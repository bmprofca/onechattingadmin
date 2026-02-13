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
    FiCreditCard,
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
    FiTrendingUp,
    FiTrendingDown,
    FiHash,
    FiTag
} from 'react-icons/fi';
import axios from 'axios';

// API Base URL
const API_BASE_URL = 'https://api.w1chat.com';

const UserTransactionHistoryModal = ({ isOpen, onClose, user, tokens }) => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
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

    // Transaction types options
    const transactionTypes = [
        { value: '', label: 'All Types' },
        { value: 'wallet topup', label: 'Wallet Topup', icon: '💳' },
        { value: 'template send', label: 'Template Send', icon: '📨' },
        { value: 'subscription', label: 'Subscription', icon: '📦' },
        { value: 'refund', label: 'Refund', icon: '↩️' },
        { value: 'adjustment', label: 'Adjustment', icon: '⚖️' }
    ];

    // Transaction direction options
    const directionTypes = [
        { value: '', label: 'All Transactions' },
        { value: '1', label: 'Credit (Money In)', icon: '↓' },
        { value: '0', label: 'Debit (Money Out)', icon: '↑' }
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

    // Initialize dates on modal open
    useEffect(() => {
        if (isOpen && user) {
            setFilters({
                from_date: get30DaysAgo(),
                to_date: getTodayDate(),
                transaction_type: '',
                type: ''
            });
            setSearchTerm('');
            setError('');
            setTransactions([]);
            setPagination({ 
                page: 1, 
                limit: 15, 
                total_records: 0, 
                total_pages: 0,
                has_more: false 
            });
            setSummary({ 
                total_debit: '0.00', 
                total_credit: '0.00', 
                current_balance: '0.00' 
            });
            
            const token = getAuthToken();
            if (!token) {
                setError('Authentication token is missing. Please login again.');
            }
        }
    }, [isOpen, user]);

    // Fetch transactions when modal opens or filters change
    useEffect(() => {
        if (isOpen && user?.username) {
            const token = getAuthToken();
            if (token) {
                fetchTransactions(1);
            }
        }
    }, [isOpen, user, filters.from_date, filters.to_date, filters.transaction_type, filters.type]);

    // Copy to clipboard function
    const copyToClipboard = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // API Call to GET /admin/user/transaction-history/:username
    const fetchTransactions = async (page = 1) => {
        if (!user?.username) {
            setError('Username is required');
            return;
        }
        
        const token = getAuthToken();
        
        if (!token) {
            setError('Authentication token is missing. Please login again.');
            return;
        }

        setLoading(true);
        setError('');
        
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
                setError(response.data.error);
            }
        } catch (error) {
            console.error('Failed to fetch transaction history:', error);
            
            if (error.code === 'ERR_NETWORK') {
                setError('Cannot connect to server. Please check if the API server is running.');
            } else if (error.response) {
                if (error.response.status === 401) {
                    setError('Unauthorized: Your session has expired. Please login again.');
                    localStorage.removeItem('adminToken');
                    localStorage.removeItem('token');
                    localStorage.removeItem('x-auth-token');
                    setTimeout(() => {
                        window.location.href = '/admin/login';
                    }, 2000);
                } else if (error.response.status === 404) {
                    setError('User not found or has no transactions.');
                } else if (error.response.status === 500) {
                    setError('Server error. Please try again later.');
                } else {
                    setError(error.response.data?.error || `Server error: ${error.response.status}`);
                }
            } else if (error.request) {
                setError('No response from server. Please check your network connection and API URL.');
            } else {
                setError(`Request failed: ${error.message}`);
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

    const formatAmount = (amount, type) => {
        if (!amount && amount !== 0) return { formatted: '₹0.00', class: '', icon: null };
        const num = parseFloat(amount);
        const formattedNum = new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(num);
        
        return {
            formatted: formattedNum,
            class: type === '1' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
            icon: type === '1' ? 
                <FiArrowDownLeft className="inline mr-1" size={14} /> : 
                <FiArrowUpRight className="inline mr-1" size={14} />,
            prefix: type === '1' ? '+' : '-'
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
            t.type === '1' ? 'Credit' : 'Debit',
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
        link.setAttribute('download', `${user.username}_transactions_${new Date().toISOString().split('T')[0]}.csv`);
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

    if (!isOpen || !user) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

            <div className="fixed inset-0 flex items-center justify-center p-4">
                <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col overflow-hidden animate-fadeIn">
                    
                    {/* Header - Fixed */}
                    <div className="flex-shrink-0 px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-800 dark:to-purple-800">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-xl">
                                    <FiDollarSign className="text-white" size={22} />
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold text-white flex items-center gap-2">
                                        Transaction History
                                        <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-normal">
                                            @{user.username}
                                        </span>
                                    </h3>
                                    <p className="text-xs text-white/80 flex items-center gap-3 mt-0.5">
                                        <span className="flex items-center">
                                            <FiUser className="mr-1" size={11} />
                                            {user.name || 'N/A'}
                                        </span>
                                        <span className="flex items-center">
                                            <FiMail className="mr-1" size={11} />
                                            {user.email || 'N/A'}
                                        </span>
                                        <span className="flex items-center">
                                            <FiPhone className="mr-1" size={11} />
                                            {user.mobile || 'N/A'}
                                        </span>
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                            >
                                <FiX className="text-white" size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Balance Summary Cards - Compact */}
                    <div className="flex-shrink-0 px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Total Credit</p>
                                        <h4 className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                                            ₹{parseFloat(summary.total_credit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </h4>
                                    </div>
                                    <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                                        <FiArrowDownLeft className="text-emerald-600 dark:text-emerald-400" size={18} />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Total Debit</p>
                                        <h4 className="text-lg font-bold text-rose-600 dark:text-rose-400">
                                            ₹{parseFloat(summary.total_debit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </h4>
                                    </div>
                                    <div className="p-2.5 bg-rose-100 dark:bg-rose-900/30 rounded-lg">
                                        <FiArrowUpRight className="text-rose-600 dark:text-rose-400" size={18} />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Current Balance</p>
                                        <h4 className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                                            ₹{parseFloat(summary.current_balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </h4>
                                    </div>
                                    <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                                        <FiDollarSign className="text-indigo-600 dark:text-indigo-400" size={18} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="flex-shrink-0 px-6 py-2 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-800">
                            <p className="text-xs text-red-600 dark:text-red-400 flex items-center">
                                <FiXCircle className="mr-1.5 flex-shrink-0" size={14} />
                                {error}
                            </p>
                        </div>
                    )}

                    {/* Filters - Compact */}
                    <div className="flex-shrink-0 px-6 py-3 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                        <div className="flex flex-col md:flex-row gap-3">
                            <div className="relative flex-1">
                                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                <input
                                    type="text"
                                    placeholder="Search ID, type, UTR, template..."
                                    className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                                    >
                                        <FiXCircle size={14} className="text-gray-500" />
                                    </button>
                                )}
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`px-3 py-2 border rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                                        Object.values(filters).some(v => v && v !== get30DaysAgo() && v !== getTodayDate() && v !== '')
                                            ? 'border-indigo-200 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                                            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    <FiFilter size={13} />
                                    Filters
                                </button>
                                
                                <button
                                    onClick={handleRefresh}
                                    className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                                    title="Refresh"
                                    disabled={loading}
                                >
                                    <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                                </button>
                                
                                <button
                                    onClick={exportToCSV}
                                    disabled={transactions.length === 0}
                                    className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                                >
                                    <FiDownload size={13} />
                                    Export
                                </button>
                            </div>
                        </div>

                        {/* Filter Panel */}
                        {showFilters && (
                            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                            From Date
                                        </label>
                                        <input
                                            type="date"
                                            className="w-full px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
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
                                            className="w-full px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
                                            value={filters.to_date}
                                            onChange={(e) => handleFilterChange('to_date', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                            Transaction Type
                                        </label>
                                        <select
                                            className="w-full px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
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
                                            className="w-full px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
                                            value={filters.type}
                                            onChange={(e) => handleFilterChange('type', e.target.value)}
                                        >
                                            {directionTypes.map(type => (
                                                <option key={type.value} value={type.value}>{type.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="flex justify-end mt-3">
                                    <button
                                        onClick={resetFilters}
                                        className="px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                                    >
                                        Reset Filters
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Transactions Table - Scrollable */}
                    <div className="flex-1 overflow-y-auto px-6 py-3">
                        <table className="w-full">
                            <thead className="sticky top-0 bg-white dark:bg-gray-800 z-10">
                                <tr className="border-b border-gray-100 dark:border-gray-700">
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date & Time</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Transaction ID</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created By</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {loading ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-3 py-3"><div className="h-3 w-28 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                                            <td className="px-3 py-3"><div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                                            <td className="px-3 py-3"><div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded-full"></div></td>
                                            <td className="px-3 py-3"><div className="h-3 w-40 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                                            <td className="px-3 py-3 text-right"><div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded ml-auto"></div></td>
                                            <td className="px-3 py-3"><div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                                        </tr>
                                    ))
                                ) : filteredTransactions.length > 0 ? (
                                    filteredTransactions.map((transaction) => {
                                        const badge = getTransactionBadge(transaction.transaction_type);
                                        const amount = formatAmount(transaction.amount, transaction.type);
                                        return (
                                            <tr key={transaction.transaction_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                                <td className="px-3 py-2.5 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <FiCalendar className="mr-1.5 text-gray-400 flex-shrink-0" size={12} />
                                                        <span className="text-xs text-gray-900 dark:text-white">
                                                            {formatDate(transaction.create_date)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2.5 whitespace-nowrap">
                                                    <div className="flex items-center gap-1">
                                                        <FiHash className="text-gray-400" size={12} />
                                                        <span className="text-xs font-mono text-gray-600 dark:text-gray-300">
                                                            {transaction.transaction_id?.slice(-8)}
                                                        </span>
                                                        <button
                                                            onClick={() => copyToClipboard(transaction.transaction_id, transaction.transaction_id)}
                                                            className="ml-1 p-0.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded"
                                                        >
                                                            {copiedId === transaction.transaction_id ? (
                                                                <FiCheckCircle size={11} className="text-emerald-500" />
                                                            ) : (
                                                                <FiCopy size={11} />
                                                            )}
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2.5 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text} border ${badge.border}`}>
                                                        <span className="mr-1">{badge.icon}</span>
                                                        {badge.label}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <div className="text-xs text-gray-600 dark:text-gray-400 max-w-[200px] truncate" title={transaction.remark}>
                                                        {transaction.remark || 'No description'}
                                                    </div>
                                                    {transaction.payment_details?.utr && (
                                                        <div className="flex items-center mt-0.5">
                                                            <span className="text-[10px] text-gray-500 dark:text-gray-500">UTR:</span>
                                                            <span className="text-[10px] font-mono text-gray-600 dark:text-gray-400 ml-1 truncate max-w-[100px]">
                                                                {transaction.payment_details.utr}
                                                            </span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2.5 whitespace-nowrap text-right">
                                                    <div className={`text-xs font-semibold ${amount.class} flex items-center justify-end`}>
                                                        {amount.icon}
                                                        {amount.prefix}{amount.formatted.replace('₹', '')}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2.5 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <FiUser className="mr-1.5 text-gray-400" size={11} />
                                                        <span className="text-xs text-gray-600 dark:text-gray-300">
                                                            {transaction.created_by_details?.username || transaction.created_by || 'SYSTEM'}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-3 py-8 text-center text-gray-500 dark:text-gray-400">
                                            <div className="flex flex-col items-center">
                                                <FiFileText size={32} className="text-gray-300 dark:text-gray-600 mb-2" />
                                                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                                                    No transactions found
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md">
                                                    {searchTerm || Object.values(filters).some(v => v && v !== get30DaysAgo() && v !== getTodayDate() && v !== '') 
                                                        ? 'No transactions match your current filters.'
                                                        : 'This user has no transaction history yet.'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination - Fixed */}
                    {transactions.length > 0 && pagination.total_pages > 1 && (
                        <div className="flex-shrink-0 px-6 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> -{' '}
                                <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total_records)}</span> of{' '}
                                <span className="font-medium">{pagination.total_records}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    disabled={pagination.page === 1 || loading}
                                    onClick={() => fetchTransactions(pagination.page - 1)}
                                    className="p-1 border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    <FiChevronLeft size={14} />
                                </button>
                                <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded text-xs font-medium">
                                    {pagination.page} / {pagination.total_pages}
                                </span>
                                <button
                                    disabled={!pagination.has_more || loading}
                                    onClick={() => fetchTransactions(pagination.page + 1)}
                                    className="p-1 border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    <FiChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserTransactionHistoryModal;