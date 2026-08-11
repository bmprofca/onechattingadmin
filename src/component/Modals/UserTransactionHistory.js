import React, { useState, useEffect } from 'react';
import {
    FiX,
    FiDollarSign,
    FiArrowUpRight,
    FiArrowDownLeft,
    FiCalendar,
    FiUser,
    FiMail,
    FiPhone,
    FiDownload,
    FiRefreshCw,
    FiChevronLeft,
    FiChevronRight,
    FiSearch,
    FiFilter,
    FiFileText,
    FiXCircle,
    FiCopy,
    FiCheckCircle,
    FiHash,
    FiArrowLeft,
    FiPlusCircle,
    FiMinusCircle
} from 'react-icons/fi';
import axios from 'axios';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Encrypt } from "../../pages/encryption/payload-encryption";
import toast from 'react-hot-toast';

// API Base URL
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:6540';

const UserTransactionHistoryPage = ({ user: propUser, tokens: propTokens }) => {

    const navigate = useNavigate();
   const { username: urlUsername } = useParams();
const location = useLocation();
const state = location.state || {};
const username = state.username || urlUsername;

    // Sidebar state
    const [isMinimized, setIsMinimized] = useState(() => {
        const saved = localStorage.getItem('sidebarMinimized');
        return saved ? JSON.parse(saved) : false;
    });

    // Sync sidebar state
    // User and tokens from props or navigation state
    const [user, setUser] = useState(propUser || state.user || null);
    const [tokens] = useState(propTokens || state.tokens || null);

    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingUser, setLoadingUser] = useState(!propUser && !state.user && username);
    const [error, setError] = useState('');
    const [copiedId, setCopiedId] = useState(null);
    const [pagination, setPagination] = useState({ 
        page: 1, 
        limit: 15, 
        total_records: 0, 
        total_pages: 0,
        has_more: false 
    });
    const [summary, setSummary] = useState({ 
        total_debit: '0.00', 
        total_credit: '0.00', 
        current_balance: '0.00' 
    });
    
    // Filters
    const [filters, setFilters] = useState({
        from_date: '',
        to_date: '',
        transaction_type: '',
        type: ''
    });
    const [showFilters, setShowFilters] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Wallet modal states
    const [showWalletModal, setShowWalletModal] = useState(false);
    const [walletAction, setWalletAction] = useState(''); // 'credit' or 'debit'
    const [walletAmount, setWalletAmount] = useState('');
    const [walletRemark, setWalletRemark] = useState('');
    const [walletLoading, setWalletLoading] = useState(false);
    const [walletError, setWalletError] = useState('');
    const [walletSuccess, setWalletSuccess] = useState('');

    // Transaction types options
    const transactionTypes = [
        { value: '', label: 'All Types' },
        { value: 'wallet topup', label: 'Wallet Topup' },
        { value: 'template send', label: 'Template Send' },
        { value: 'subscription', label: 'Subscription' },
        { value: 'refund', label: 'Refund' },
        { value: 'adjustment', label: 'Adjustment' }
    ];

    // Transaction direction options - using strings for filter API
    const directionTypes = [
        { value: '', label: 'All Transactions' },
        { value: '1', label: 'Credit (Money In)' },
        { value: '0', label: 'Debit (Money Out)' }
    ];

    // Get today's date in YYYY-MM-DD format
    const getTodayDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    // Get date 30 days ago
    const get30DaysAgo = () => {
        const date = new Date();
        date.setDate(date.getDate() - 30);
        return date.toISOString().split('T')[0];
    };

    // Get auth token from multiple sources
    const getAuthToken = () => {
        if (propTokens?.token) {
            return propTokens.token;
        }
        if (tokens?.token) {
            return tokens.token;
        }
        
        const storedToken = localStorage.getItem('adminToken') || 
                           localStorage.getItem('token') || 
                           localStorage.getItem('x-auth-token');
        
        if (storedToken) {
            return storedToken;
        }
        
        return null;
    };

    // Fetch user details if not provided
    useEffect(() => {
        const fetchUser = async () => {
            if (user && user.username) {
                return;
            }
            if (!username) {
                toast.error('No username provided');
                return;
            }

            const token = getAuthToken();
            if (!token) {
                toast.error('Authentication token missing');
                return;
            }

            setLoadingUser(true);
            try {
                const response = await axios.get(`${API_BASE_URL}/admin/user/${username}`, {
                    headers: { 
                        'x-auth-token': token,
                        'x-token': token,
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                if (response.data && !response.data.error) {
                    setUser(response.data.data || response.data.user || response.data);
                } else {
                    toast.error('User not found');
                }
            } catch (err) {
                toast.error('Failed to load user details');
            } finally {
                setLoadingUser(false);
            }
        };

        fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [username, user]);

    // Initialize dates on mount
    useEffect(() => {
        setFilters({
            from_date: get30DaysAgo(),
            to_date: getTodayDate(),
            transaction_type: '',
            type: ''
        });
    }, []);

    // Fetch transactions when user is available or filters change
    useEffect(() => {
        if (user?.username) {
            const token = getAuthToken();
            if (token) {
                fetchTransactions(1);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, filters.from_date, filters.to_date, filters.transaction_type, filters.type]);

    // Handle wallet credit/debit
   // Handle wallet credit/debit
const handleWalletAction = async () => {
    if (!user?.username) {
        toast.error('User not found');
        return;
    }

    if (!walletAmount || parseFloat(walletAmount) <= 0) {
        toast.error('Please enter a valid amount');
        return;
    }

    const token = getAuthToken();
    if (!token) {
        toast.error('Authentication token missing');
        return;
    }

    setWalletLoading(true);
    
    setWalletSuccess('');

    try {
        // Get admin username from token or localStorage
        let adminUsername = '';
        
        // Try to get from propTokens
        if (propTokens?.username) {
            adminUsername = propTokens.username;
        } else if (tokens?.username) {
            adminUsername = tokens.username;
        } else {
            // Try to get from localStorage
            adminUsername = localStorage.getItem('adminUsername') || 
                           localStorage.getItem('username') || 
                           'SYSTEM';
        }

        // Prepare data for encryption with admin username included
        const payload = {
            amount: parseFloat(walletAmount),
            remark: walletRemark || `${walletAction} by admin`,
            admin: adminUsername // Include admin username in payload
        };

        // Encrypt the data using the Encrypt function
        const encrypted = Encrypt(payload);

        const payloadData = {
            data: encrypted.data,
            key: encrypted.key
        };

        // Determine which endpoint to use
        const endpoint = walletAction === 'credit' 
            ? `${API_BASE_URL}/admin/credit-wallet/${user.username}`
            : `${API_BASE_URL}/admin/debit-wallet/${user.username}`;

        const response = await axios.post(endpoint, payloadData, {
            headers: { 
                'x-auth-token': token,
                'x-token': token,
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data && response.data.error === false) {
            setWalletSuccess(`Wallet ${walletAction}ed successfully!`);
            
            // Reset form
            setWalletAmount('');
            setWalletRemark('');
            
            // Refresh transactions and summary
            fetchTransactions(1);
            
            // Close modal after 2 seconds
            setTimeout(() => {
                setShowWalletModal(false);
                setWalletSuccess('');
            }, 2000);
        } else {
            toast.error(response.data?.error || `Failed to ${walletAction} wallet`);
        }
    } catch (error) {
        console.error(`Failed to ${walletAction} wallet:`, error);
        
        if (error.code === 'ERR_NETWORK') {
            toast.error('Cannot connect to server. Please check if the API server is running.');
        } else if (error.response) {
            if (error.response.status === 401) {
                toast.error('Unauthorized: Your session has expired. Please login again.');
            } else if (error.response.status === 404) {
                toast.error('User not found');
            } else if (error.response.status === 500) {
                toast.error('Server error. Please try again later.');
                console.error('Server error details:', error.response.data);
            } else {
                toast.error(error.response.data?.error || `Server error: ${error.response.status}`);
            }
        } else if (error.request) {
            toast.error('No response from server. Please check your network connection.');
        } else {
            toast.error(`Request failed: ${error.message}`);
        }
    } finally {
        setWalletLoading(false);
    }
};

    // Copy to clipboard function
    const copyToClipboard = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // API Call to GET /admin/user/transaction-history/:username
    const fetchTransactions = async (page = 1) => {
        if (!user?.username) {
            toast.error('Username is required');
            return;
        }
        
        const token = getAuthToken();
        
        if (!token) {
            toast.error('Authentication token is missing. Please login again.');
            return;
        }

        setLoading(true);
        
        
        try {
            const params = new URLSearchParams({
                page: page,
                limit: pagination.limit,
                from_date: filters.from_date,
                to_date: filters.to_date
            });

            if (filters.transaction_type) {
                params.append('transaction_type', filters.transaction_type);
            }
            
            if (filters.type !== '') {
                params.append('type', filters.type);
            }

            const url = `${API_BASE_URL}/admin/user/transaction-history/${encodeURIComponent(user.username)}?${params.toString()}`;
            
            const response = await axios.get(url, {
                headers: { 
                    'x-auth-token': token,
                    'x-token': token,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data && response.data.error === false) {
                setTransactions(response.data.data || []);
                
                if (response.data.summary) {
                    setSummary({
                        total_debit: response.data.summary.total_debit || '0.00',
                        total_credit: response.data.summary.total_credit || '0.00',
                        current_balance: response.data.summary.current_balance || '0.00'
                    });
                }
                
                if (response.data.pagination) {
                    setPagination({
                        page: response.data.pagination.page || page,
                        limit: response.data.pagination.limit || 15,
                        total_records: response.data.pagination.total_records || 0,
                        total_pages: response.data.pagination.total_pages || 0,
                        has_more: response.data.pagination.has_more || false
                    });
                }
            } else if (response.data && response.data.error) {
                toast.error(response.data.error);
            }
        } catch (error) {
            console.error('Failed to fetch transaction history:', error);
            
            if (error.code === 'ERR_NETWORK') {
                toast.error('Cannot connect to server. Please check if the API server is running.');
            } else if (error.response) {
                if (error.response.status === 401) {
                    toast.error('Unauthorized: Your session has expired. Please login again.');
                    localStorage.removeItem('adminToken');
                    localStorage.removeItem('token');
                    localStorage.removeItem('x-auth-token');
                    setTimeout(() => {
                        window.location.href = '/login';
                    }, 2000);
                } else if (error.response.status === 404) {
                    toast.error('User not found or has no transactions.');
                } else if (error.response.status === 500) {
                    toast.error('Server error. Please try again later.');
                } else {
                    toast.error(error.response.data?.error || `Server error: ${error.response.status}`);
                }
            } else if (error.request) {
                toast.error('No response from server. Please check your network connection and API URL.');
            } else {
                toast.error(`Request failed: ${error.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const resetFilters = () => {
        setFilters({
            from_date: get30DaysAgo(),
            to_date: getTodayDate(),
            transaction_type: '',
            type: ''
        });
        setSearchTerm('');
        fetchTransactions(1);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return new Intl.DateTimeFormat('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }).format(date);
        } catch {
            return dateString;
        }
    };

    // FIXED: Amount formatting for your API (type is boolean from API)
    const formatAmount = (amount, type) => {
        if (!amount && amount !== 0) return { formatted: '₹0.00', class: '', icon: null, prefix: '' };
        
        const num = parseFloat(amount);
        
        // Your API returns type as boolean (true = credit, false = debit)
        // This is the CORRECT way to handle it
        const isCredit = type === true;
        
        const absNum = Math.abs(num);
        const formattedNum = new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(absNum);
        
        return {
            formatted: formattedNum,
            class: isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
            icon: isCredit ? 
                <FiArrowDownLeft className="inline mr-1" size={14} /> : 
                <FiArrowUpRight className="inline mr-1" size={14} />,
            prefix: isCredit ? '+' : '-'
        };
    };

    const getTransactionBadge = (transactionType) => {
        const type = transactionType?.toLowerCase() || '';
        
        if (type.includes('wallet topup')) {
            return {
                bg: 'bg-emerald-100 dark:bg-emerald-900/30',
                text: 'text-emerald-700 dark:text-emerald-300',
                border: 'border-emerald-200 dark:border-emerald-800',
                icon: '💳',
                label: 'Wallet Topup'
            };
        }
        if (type.includes('template send')) {
            return {
                bg: 'bg-blue-100 dark:bg-blue-900/30',
                text: 'text-blue-700 dark:text-blue-300',
                border: 'border-blue-200 dark:border-blue-800',
                icon: '📨',
                label: 'Template Send'
            };
        }
        if (type.includes('subscription')) {
            return {
                bg: 'bg-purple-100 dark:bg-purple-900/30',
                text: 'text-purple-700 dark:text-purple-300',
                border: 'border-purple-200 dark:border-purple-800',
                icon: '📦',
                label: 'Subscription'
            };
        }
        if (type.includes('refund')) {
            return {
                bg: 'bg-amber-100 dark:bg-amber-900/30',
                text: 'text-amber-700 dark:text-amber-300',
                border: 'border-amber-200 dark:border-amber-800',
                icon: '↩️',
                label: 'Refund'
            };
        }
        return {
            bg: 'bg-gray-100 dark:bg-gray-800',
            text: 'text-gray-700 dark:text-gray-300',
            border: 'border-gray-200 dark:border-gray-700',
            icon: '💱',
            label: transactionType || 'Transaction'
        };
    };

    const exportToCSV = () => {
        if (transactions.length === 0) return;

        const headers = [
            'Transaction ID',
            'Date',
            'Time',
            'Type',
            'Direction',
            'Amount (₹)',
            'Remark',
            'Created By',
            'UTR',
            'Template Name'
        ];

        const rows = transactions.map(t => [
            t.transaction_id,
            new Date(t.create_date).toLocaleDateString('en-IN'),
            new Date(t.create_date).toLocaleTimeString('en-IN'),
            t.transaction_type,
            t.type === true ? 'Credit' : 'Debit', // Fixed: using boolean
            t.amount,
            t.remark || 'N/A',
            t.created_by_details?.username || t.created_by || 'N/A',
            t.payment_details?.utr || 'N/A',
            t.message_details?.template_name || 'N/A'
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => 
                typeof cell === 'string' && (cell.includes(',') || cell.includes('"')) 
                    ? `"${cell.replace(/"/g, '""')}"` 
                    : cell
            ).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${user?.username}_transactions_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleRefresh = () => {
        fetchTransactions(pagination.page);
    };

    // Filter transactions by search term
    const filteredTransactions = transactions.filter(t => 
        searchTerm === '' || 
        t.transaction_id?.toString().includes(searchTerm) ||
        t.transaction_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.remark?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.payment_details?.utr?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.message_details?.template_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.created_by?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loadingUser) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className={`transition-all duration-300 ease-in-out `}>
                    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading user details...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className={`transition-all duration-300 ease-in-out `}>
                    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
                        <div className="text-center">
                            <FiXCircle className="mx-auto h-12 w-12 text-red-500" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">User not found</h3>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{error || 'Could not load user data'}</p>
                            <button
                                onClick={() => navigate(-1)}
                                className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                <FiArrowLeft className="mr-2" size={14} />
                                Go Back
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Wallet Action Modal */}
            {showWalletModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {walletAction === 'credit' ? 'Credit Wallet' : 'Debit Wallet'}
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowWalletModal(false);
                                        
                                        setWalletSuccess('');
                                        setWalletAmount('');
                                        setWalletRemark('');
                                    }}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    <FiX size={20} />
                                </button>
                            </div>

                            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    User: <span className="font-medium text-gray-900 dark:text-white">@{user.username}</span>
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    Current Balance: <span className="font-medium text-indigo-600 dark:text-indigo-400">₹{parseFloat(summary.current_balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </p>
                            </div>

                            {walletError && (
                                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg">
                                    <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
                                        <FiXCircle className="mr-2 flex-shrink-0" size={16} />
                                        {walletError}
                                    </p>
                                </div>
                            )}

                            {walletSuccess && (
                                <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-lg">
                                    <p className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center">
                                        <FiCheckCircle className="mr-2 flex-shrink-0" size={16} />
                                        {walletSuccess}
                                    </p>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Amount (₹)
                                    </label>
                                    <input
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        value={walletAmount}
                                        onChange={(e) => setWalletAmount(e.target.value)}
                                        placeholder="Enter amount"
                                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
                                        disabled={walletLoading || walletSuccess}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Remark (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={walletRemark}
                                        onChange={(e) => setWalletRemark(e.target.value)}
                                        placeholder={`Enter remark for ${walletAction}`}
                                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
                                        disabled={walletLoading || walletSuccess}
                                    />
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={handleWalletAction}
                                        disabled={walletLoading || !walletAmount || parseFloat(walletAmount) <= 0 || walletSuccess}
                                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all ${
                                            walletAction === 'credit'
                                                ? 'bg-emerald-600 hover:bg-emerald-700'
                                                : 'bg-rose-600 hover:bg-rose-700'
                                        } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
                                    >
                                        {walletLoading ? (
                                            <>
                                                <FiRefreshCw className="animate-spin mr-2" size={14} />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                {walletAction === 'credit' ? <FiPlusCircle className="mr-2" size={14} /> : <FiMinusCircle className="mr-2" size={14} />}
                                                Confirm {walletAction === 'credit' ? 'Credit' : 'Debit'}
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowWalletModal(false);
                                            
                                            setWalletSuccess('');
                                            setWalletAmount('');
                                            setWalletRemark('');
                                        }}
                                        disabled={walletLoading}
                                        className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main content */}
            <div className={`transition-all duration-300 ease-in-out `}>
                <div className="w-full px-2 sm:px-6 py-4">
                    {/* Page header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Transaction History
                                <span className="ml-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                                    @{user.username}
                                </span>
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-3 mt-1">
                                <span className="flex items-center">
                                    <FiUser className="mr-1" size={12} />
                                    {user.name || 'N/A'}
                                </span>
                                <span className="flex items-center">
                                    <FiMail className="mr-1" size={12} />
                                    {user.email || 'N/A'}
                                </span>
                                <span className="flex items-center">
                                    <FiPhone className="mr-1" size={12} />
                                    {user.mobile || 'N/A'}
                                </span>
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => {
                                    setWalletAction('credit');
                                    setShowWalletModal(true);
                                }}
                                className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-all shadow-sm"
                            >
                                <FiPlusCircle className="mr-2" size={14} />
                                Credit Wallet
                            </button>
                            <button
                                onClick={() => {
                                    setWalletAction('debit');
                                    setShowWalletModal(true);
                                }}
                                className="inline-flex items-center px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700 transition-all shadow-sm"
                            >
                                <FiMinusCircle className="mr-2" size={14} />
                                Debit Wallet
                            </button>
                            <button
                                onClick={() => navigate(-1)}
                                className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
                            >
                                <FiArrowLeft className="mr-2" size={14} />
                                Back to Users
                            </button>
                        </div>
                    </div>

                    {/* Balance Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Credit</p>
                                    <h4 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                        ₹{parseFloat(summary.total_credit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </h4>
                                </div>
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
                                    <FiArrowDownLeft className="text-emerald-600 dark:text-emerald-400" size={24} />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Debit</p>
                                    <h4 className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                                        ₹{parseFloat(summary.total_debit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </h4>
                                </div>
                                <div className="p-3 bg-rose-50 dark:bg-rose-900/30 rounded-lg">
                                    <FiArrowUpRight className="text-rose-600 dark:text-rose-400" size={24} />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Current Balance</p>
                                    <h4 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                        ₹{parseFloat(summary.current_balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </h4>
                                </div>
                                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                                    <FiDollarSign className="text-indigo-600 dark:text-indigo-400" size={24} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main content card */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        {/* Error Message */}
                        {error && (
                            <div className="px-6 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-800">
                                <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
                                    <FiXCircle className="mr-2 flex-shrink-0" size={16} />
                                    {error}
                                </p>
                            </div>
                        )}

                        {/* Filters */}
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="relative flex-1">
                                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Search ID, type, UTR, template..."
                                        className="w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white text-sm"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    {searchTerm && (
                                        <button
                                            onClick={() => setSearchTerm('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                        >
                                            <FiXCircle size={16} />
                                        </button>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setShowFilters(!showFilters)}
                                        className={`px-4 py-2.5 border rounded-lg text-sm font-medium flex items-center transition-all ${
                                            Object.values(filters).some(v => v && v !== get30DaysAgo() && v !== getTodayDate() && v !== '')
                                                ? 'border-indigo-200 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                                                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                    >
                                        <FiFilter className="mr-2" size={14} />
                                        Filters
                                    </button>
                                    <button
                                        onClick={handleRefresh}
                                        className="p-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                                        title="Refresh"
                                        disabled={loading}
                                    >
                                        <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                                    </button>
                                    <button
                                        onClick={exportToCSV}
                                        disabled={transactions.length === 0}
                                        className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                    >
                                        <FiDownload className="mr-2" size={14} />
                                        Export
                                    </button>
                                </div>
                            </div>

                            {/* Filter Panel */}
                            {showFilters && (
                                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                                From Date
                                            </label>
                                            <input
                                                type="date"
                                                className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
                                                value={filters.from_date}
                                                onChange={(e) => handleFilterChange('from_date', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                                To Date
                                            </label>
                                            <input
                                                type="date"
                                                className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
                                                value={filters.to_date}
                                                onChange={(e) => handleFilterChange('to_date', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                                Transaction Type
                                            </label>
                                            <select
                                                className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
                                                value={filters.transaction_type}
                                                onChange={(e) => handleFilterChange('transaction_type', e.target.value)}
                                            >
                                                {transactionTypes.map(type => (
                                                    <option key={type.value} value={type.value}>{type.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                                Direction
                                            </label>
                                            <select
                                                className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
                                                value={filters.type}
                                                onChange={(e) => handleFilterChange('type', e.target.value)}
                                            >
                                                {directionTypes.map(type => (
                                                    <option key={type.value} value={type.value}>{type.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex justify-end mt-4">
                                        <button
                                            onClick={resetFilters}
                                            className="px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                                        >
                                            Reset Filters
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Transactions Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date & Time</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Transaction ID</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created By</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {loading ? (
                                        [...Array(5)].map((_, i) => (
                                            <tr key={i} className="animate-pulse">
                                                <td className="px-4 py-3"><div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                                                <td className="px-4 py-3"><div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                                                <td className="px-4 py-3"><div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-full"></div></td>
                                                <td className="px-4 py-3"><div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                                                <td className="px-4 py-3 text-right"><div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded ml-auto"></div></td>
                                                <td className="px-4 py-3"><div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                                            </tr>
                                        ))
                                    ) : filteredTransactions.length > 0 ? (
                                        filteredTransactions.map((transaction) => {
                                            const badge = getTransactionBadge(transaction.transaction_type);
                                            const amount = formatAmount(transaction.amount, transaction.type);
                                            return (
                                                <tr key={transaction.transaction_id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                                            <FiCalendar className="mr-2 text-gray-400" size={14} />
                                                            {formatDate(transaction.create_date)}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <div className="flex items-center gap-2">
                                                            <FiHash className="text-gray-400" size={14} />
                                                            <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                                                                {transaction.transaction_id?.slice(-8)}
                                                            </span>
                                                            <button
                                                                onClick={() => copyToClipboard(transaction.transaction_id, transaction.transaction_id)}
                                                                className="p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded"
                                                            >
                                                                {copiedId === transaction.transaction_id ? (
                                                                    <FiCheckCircle size={14} className="text-emerald-500" />
                                                                ) : (
                                                                    <FiCopy size={14} />
                                                                )}
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text} border ${badge.border}`}>
                                                            <span className="mr-1.5">{badge.icon}</span>
                                                            {badge.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="text-sm text-gray-600 dark:text-gray-400 max-w-[200px] truncate" title={transaction.remark}>
                                                            {transaction.remark || 'No description'}
                                                        </div>
                                                        {transaction.payment_details?.utr && (
                                                            <div className="flex items-center mt-1">
                                                                <span className="text-xs text-gray-500 dark:text-gray-500">UTR:</span>
                                                                <span className="text-xs font-mono text-gray-600 dark:text-gray-400 ml-1 truncate max-w-[120px]">
                                                                    {transaction.payment_details.utr}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-right">
                                                        <div className={`text-sm font-semibold ${amount.class} flex items-center justify-end`}>
                                                            {amount.icon}
                                                            {amount.prefix}{amount.formatted.replace('₹', '')}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                                            <FiUser className="mr-2 text-gray-400" size={14} />
                                                            {transaction.created_by_details?.username || transaction.created_by || 'SYSTEM'}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                                                <div className="flex flex-col items-center justify-center">
                                                    <FiFileText size={48} className="text-gray-300 dark:text-gray-600 mb-3" />
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">No transactions found</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm">
                                                        {searchTerm || Object.values(filters).some(v => v && v !== get30DaysAgo() && v !== getTodayDate() && v !== '') 
                                                            ? 'No transactions match your current filters.'
                                                            : 'This user has no transaction history yet.'}
                                                    </p>
                                                    {(searchTerm || Object.values(filters).some(v => v && v !== get30DaysAgo() && v !== getTodayDate() && v !== '')) && (
                                                        <button
                                                            onClick={resetFilters}
                                                            className="mt-4 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-md text-xs font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
                                                        >
                                                            Clear Filters
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {transactions.length > 0 && pagination.total_pages > 1 && (
                            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    Showing <span className="font-medium text-gray-900 dark:text-white">{(pagination.page - 1) * pagination.limit + 1}</span> -{' '}
                                    <span className="font-medium text-gray-900 dark:text-white">{Math.min(pagination.page * pagination.limit, pagination.total_records)}</span> of{' '}
                                    <span className="font-medium text-gray-900 dark:text-white">{pagination.total_records}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        disabled={pagination.page === 1 || loading}
                                        onClick={() => fetchTransactions(pagination.page - 1)}
                                        className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        <FiChevronLeft size={16} />
                                    </button>
                                    <div className="text-sm font-medium px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg">
                                        {pagination.page} / {pagination.total_pages}
                                    </div>
                                    <button
                                        disabled={!pagination.has_more || loading}
                                        onClick={() => fetchTransactions(pagination.page + 1)}
                                        className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        <FiChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserTransactionHistoryPage;