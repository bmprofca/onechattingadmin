import React, { useState, useEffect, useCallback } from 'react';
import { Header, Sidebar } from '../component/Menu';
import { useNavigate } from 'react-router-dom';
import {
    FiUser,
    FiSearch,
    FiEye,
    FiUserCheck,
    FiUserX,
    FiMail,
    FiPhone,
    FiChevronLeft,
    FiChevronRight,
    FiChevronsLeft,
    FiChevronsRight,
    FiFilter,
    FiDownload,
    FiUsers,
    FiActivity,
    FiLogIn,
    FiCreditCard,
    FiCalendar,
    FiShield,
    FiRefreshCw,
    FiXCircle,
    FiDollarSign
} from 'react-icons/fi';
import axios from 'axios';
import UserBillingModal from '../component/Modals/UserBillingModal';

const Users = () => {
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(() => {
        const saved = localStorage.getItem('sidebarMinimized');
        return saved ? JSON.parse(saved) : false;
    });

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [exportLoading, setExportLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
    const [tokens, setTokens] = useState(null);
    const [billingModalOpen, setBillingModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    const [pageJumpInput, setPageJumpInput] = useState('');

    // Sync Sidebar State
    useEffect(() => {
        localStorage.setItem('sidebarMinimized', JSON.stringify(isMinimized));
    }, [isMinimized]);

    // Load tokens
    useEffect(() => {
        const data = localStorage.getItem('userData') || sessionStorage.getItem('userData');
        if (data) {
            setTokens(JSON.parse(data));
        } else {
            navigate('/login');
        }
    }, [navigate]);

    // Fetch Users Function
    const fetchUsers = useCallback(async (page = 1) => {
        if (!tokens?.token) return;
        setLoading(true);
        try {
            const limit = Math.min(Math.max(pagination.limit || 10, 1), 100);
            const response = await axios.get(`https://api.w1chat.com/admin/users?page=${page}&limit=${limit}`, {
                headers: { 'x-token': tokens.token }
            });

            if (!response.data.error) {
                setUsers(response.data.data);
                setPagination(response.data.pagination);
            }
        } catch (err) {
            console.error("Failed to fetch users", err);
        } finally {
            setLoading(false);
        }
    }, [tokens, pagination.limit]);

    useEffect(() => {
        fetchUsers(pagination.page);
    }, [fetchUsers, pagination.page]);

    // Fetch ALL Users for Export
    const fetchAllUsersForExport = async () => {
        if (!tokens?.token) return [];
        try {
            // First get total count
            const firstPage = await axios.get(`https://api.w1chat.com/admin/users?page=1&limit=1`, {
                headers: { 'x-token': tokens.token }
            });
            
            const totalUsers = firstPage.data.pagination.total;
            const totalPages = Math.ceil(totalUsers / 100); // Fetch 100 per page for export
            
            let allUsers = [];
            
            // Fetch all pages
            for (let page = 1; page <= totalPages; page++) {
                const response = await axios.get(`https://api.w1chat.com/admin/users?page=${page}&limit=100`, {
                    headers: { 'x-token': tokens.token }
                });
                
                if (!response.data.error) {
                    allUsers = [...allUsers, ...response.data.data];
                }
            }
            
            return allUsers;
        } catch (err) {
            console.error("Failed to fetch all users for export", err);
            return [];
        }
    };

    // Derived filtering for current page
    const filteredUsers = users.filter(user => {
        const matchesSearch = 
            user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
            user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.mobile?.includes(searchTerm);
        
        const matchesStatus = 
            filterStatus === 'all' || 
            (filterStatus === 'active' && user.status === '1') ||
            (filterStatus === 'inactive' && user.status !== '1');
        
        return matchesSearch && matchesStatus;
    });

    const handleLoginAsUser = (user) => {
        if (!user?.email) return;
        const baseUrl = 'https://wichat-sigma.vercel.app/login';
        const params = new URLSearchParams({
            username: user.email,
            password: user.password || ''
        });
        const url = `${baseUrl}?${params.toString()}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const handleOpenBilling = (user) => {
        setSelectedUser(user);
        setBillingModalOpen(true);
    };

    const handleCloseBilling = () => {
        setBillingModalOpen(false);
        setSelectedUser(null);
    };

    // Handle balance click – navigates to transaction history page
    const handleBalanceClick = (user) => {
        // Navigate to the transaction history page, passing user and tokens via state
        navigate(`/users/${user.username}/transactions`, { state: { user, tokens } });
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return new Intl.DateTimeFormat('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }).format(date);
        } catch {
            return dateString;
        }
    };

    const formatBalance = (balance) => {
        if (balance === undefined || balance === null) return '0.00';
        const num = parseFloat(balance);
        return num.toFixed(2);
    };

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    // Export ALL Data to CSV
    const exportAllToCSV = async () => {
        setExportLoading(true);
        try {
            // Fetch ALL users from all pages
            const allUsers = await fetchAllUsersForExport();
            
            if (allUsers.length === 0) {
                alert('No users to export');
                return;
            }

            // Define CSV headers
            const headers = [
                'S.No.',
                'Name',
                'Username',
                'Email',
                'Mobile',
                'Country Code',
                'Status',
                'Balance',
                'Role',
                'Created Date',
                'Last Login'
            ];

            // Prepare data rows for ALL users
            const rows = allUsers.map((user, index) => [
                index + 1,
                user.name || 'N/A',
                user.username || 'N/A',
                user.email || 'N/A',
                user.mobile || 'N/A',
                user.country_code || 'N/A',
                user.status === '1' ? 'Active' : 'Inactive',
                formatBalance(user.balance),
                user.role?.toUpperCase() || 'USER',
                formatDate(user.created_at),
                formatDate(user.last_login)
            ]);

            // Combine headers and rows
            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.map(cell => {
                    // Escape commas and quotes in CSV
                    if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
                        return `"${cell.replace(/"/g, '""')}"`;
                    }
                    return cell;
                }).join(','))
            ].join('\n');

            // Create blob and download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `all_users_export_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            alert(`Successfully exported ${allUsers.length} users`);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export users. Please try again.');
        } finally {
            setExportLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header
                mobileMenuOpen={mobileMenuOpen}
                setMobileMenuOpen={setMobileMenuOpen}
                isMinimized={isMinimized}
                setIsMinimized={setIsMinimized}
            />
            <Sidebar
                mobileMenuOpen={mobileMenuOpen}
                setMobileMenuOpen={setMobileMenuOpen}
                isMinimized={isMinimized}
                setIsMinimized={setIsMinimized}
            />

            {/* Main content */}
            <div className={`pt-16 transition-all duration-300 ease-in-out ${isMinimized ? 'md:pl-20' : 'md:pl-72'}`}>
                <div className="w-full px-4 sm:px-6 py-8">
                    {/* Page Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Manage, monitor and verify system users across all projects.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => fetchUsers(pagination.page)}
                                className="flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
                            >
                                <FiRefreshCw className="mr-2" /> Refresh
                            </button>
                            <button 
                                onClick={exportAllToCSV}
                                disabled={exportLoading}
                                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {exportLoading ? (
                                    <>
                                        <FiRefreshCw className="mr-2 animate-spin" /> Exporting...
                                    </>
                                ) : (
                                    <>
                                        <FiDownload className="mr-2" /> Export All Users
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Stats Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
                                    <h3 className="text-2xl font-bold dark:text-white">{pagination.total}</h3>
                                </div>
                                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                    <FiUsers size={24} />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Active Now</p>
                                    <h3 className="text-2xl font-bold dark:text-white">
                                        {users.filter(u => u.status === '1').length}
                                        <span className="text-sm font-normal text-gray-400 ml-2">on this page</span>
                                    </h3>
                                </div>
                                <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
                                    <FiActivity size={24} />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Inactive Users</p>
                                    <h3 className="text-2xl font-bold dark:text-white">
                                        {users.filter(u => u.status !== '1').length}
                                    </h3>
                                </div>
                                <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
                                    <FiUserX size={24} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Search & Filter Bar */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input 
                                    type="text"
                                    placeholder="Search by name, email, username or mobile..."
                                    className="w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && (
                                    <button 
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <FiXCircle size={16} />
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <button 
                                        onClick={() => setShowFilters(!showFilters)}
                                        className={`flex items-center justify-center px-4 py-2.5 border rounded-lg text-sm font-medium transition-all ${
                                            filterStatus !== 'all'
                                                ? 'border-indigo-200 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' 
                                                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                    >
                                        <FiFilter className="mr-2" /> 
                                        Status
                                        {filterStatus !== 'all' && (
                                            <span className="ml-2 w-5 h-5 rounded-full bg-indigo-200 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs flex items-center justify-center">
                                                1
                                            </span>
                                        )}
                                    </button>
                                    
                                    {showFilters && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setShowFilters(false)}></div>
                                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 p-1 z-50">
                                                <button 
                                                    onClick={() => { setFilterStatus('all'); setShowFilters(false); }}
                                                    className={`w-full text-left px-3 py-2 rounded-md text-sm ${filterStatus === 'all' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                                >
                                                    All Users
                                                </button>
                                                <button 
                                                    onClick={() => { setFilterStatus('active'); setShowFilters(false); }}
                                                    className={`w-full text-left px-3 py-2 rounded-md text-sm ${filterStatus === 'active' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                                >
                                                    Active Only
                                                </button>
                                                <button 
                                                    onClick={() => { setFilterStatus('inactive'); setShowFilters(false); }}
                                                    className={`w-full text-left px-3 py-2 rounded-md text-sm ${filterStatus === 'inactive' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                                >
                                                    Inactive Only
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Table Container - NO HORIZONTAL SCROLL */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden w-full">
                        {/* Table - Responsive with no horizontal scroll */}
                        <div className="w-full">
                            <table className="w-full table-fixed">
                                <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                                    <tr>
                                        <th className="px-3 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[5%] text-center">#</th>
                                        <th className="px-3 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[20%] text-center">Contact</th>
                                        <th className="px-3 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[10%] text-center">Status</th>
                                        <th className="px-3 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[10%] text-center">Balance</th>
                                        <th className="px-3 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[15%] text-center">Joined</th>
                                        <th className="px-3 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-[15%] text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {loading ? (
                                        [...Array(5)].map((_, i) => (
                                            <tr key={i} className="animate-pulse">
                                                <td className="px-3 py-4 text-center"><div className="h-4 w-8 bg-gray-200 dark:bg-gray-700 rounded mx-auto"></div></td>
                                                <td className="px-3 py-4">
                                                    <div className="space-y-2">
                                                        <div className="h-4 w-full max-w-[140px] bg-gray-200 dark:bg-gray-700 rounded mx-auto"></div>
                                                        <div className="h-3 w-full max-w-[100px] bg-gray-200 dark:bg-gray-700 rounded mx-auto"></div>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-4 text-center"><div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto"></div></td>
                                                <td className="px-3 py-4 text-center"><div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded mx-auto"></div></td>
                                                <td className="px-3 py-4 text-center"><div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded mx-auto"></div></td>
                                                <td className="px-3 py-4 text-center"><div className="flex justify-center gap-1"><div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div><div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div><div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div></div></td>
                                            </tr>
                                        ))
                                    ) : filteredUsers.length > 0 ? (
                                        filteredUsers.map((user, index) => (
                                            <tr 
                                                key={user.id} 
                                                className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors"
                                            >
                                                <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap text-center">
                                                    {(pagination.page - 1) * pagination.limit + index + 1}
                                                </td>
                                               <td className="px-3 py-4">
    <div className="space-y-1 min-w-0 text-left">
         <div className="flex items-center justify-start text-xs text-gray-600 dark:text-gray-300">
            <FiUser className="mr-1.5 flex-shrink-0" size={11} />
            <span className="truncate">{user.name}</span>
        </div>
        <div className="flex items-center justify-start text-xs text-gray-600 dark:text-gray-300">
            <FiMail className="mr-1.5 flex-shrink-0" size={11} />
            <span className="truncate">{user.email}</span>
        </div>

        <div className="flex items-center justify-start text-xs text-gray-500 dark:text-gray-400">
            <FiPhone className="mr-1.5 flex-shrink-0" size={11} />
            <span className="truncate">
                {user.country_code
                    ? `${user.country_code} ${user.mobile || ''}`
                    : user.mobile || 'No phone'}
            </span>
        </div>
    </div>
</td>
                                                <td className="px-3 py-4 whitespace-nowrap text-center">
                                                    {user.status === '1' ? (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                                                            <FiUserCheck className="mr-1" size={10} />
                                                            Active
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
                                                            <FiUserX className="mr-1" size={10} />
                                                            Inactive
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-4 whitespace-nowrap text-center">
                                                    <button
                                                        onClick={() => handleBalanceClick(user)}
                                                        className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-700 dark:hover:text-purple-400 hover:border-purple-200 dark:hover:border-purple-800 transition-all cursor-pointer"
                                                        title="View Transaction History"
                                                    >
                                                        <FiDollarSign className="mr-1" size={10} />
                                                        {formatBalance(user.balance)}
                                                    </button>
                                                </td>
                                                <td className="px-3 py-4 whitespace-nowrap text-center">
                                                    <div className="flex items-center justify-center text-xs text-gray-600 dark:text-gray-400">
                                                        <FiCalendar className="mr-1.5 flex-shrink-0" size={11} />
                                                        <span className="truncate">{formatDate(user.created_at)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-4 whitespace-nowrap text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button 
                                                            onClick={() => navigate(`/users/${user.username}`)}
                                                            className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"
                                                            title="View Profile"
                                                        >
                                                            <FiEye size={20} />
                                                        </button>
                                                        {/* <button
                                                            onClick={() => handleOpenBilling(user)}
                                                            className="p-1.5 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-all"
                                                            title="View Billing"
                                                        >
                                                            <FiCreditCard size={15} />
                                                        </button> */}
                                                        <button
                                                            onClick={() => handleLoginAsUser(user)}
                                                            className="p-1.5 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-all"
                                                            title="Login as User"
                                                        >
                                                            <FiLogIn size={20} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                                <div className="flex flex-col items-center justify-center">
                                                    <FiUsers size={40} className="text-gray-300 dark:text-gray-600 mb-3" />
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">No users found</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm">
                                                        {searchTerm || filterStatus !== 'all' 
                                                            ? 'Try adjusting your search or filter criteria'
                                                            : 'No users have been created yet'}
                                                    </p>
                                                    {(searchTerm || filterStatus !== 'all') && (
                                                        <button 
                                                            onClick={() => {
                                                                setSearchTerm('');
                                                                setFilterStatus('all');
                                                            }}
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

                        {/* Pagination Bar */}
                        {filteredUsers.length > 0 && (() => {
                            const totalPages = Math.ceil(pagination.total / pagination.limit) || 1;
                            const start = (pagination.page - 1) * pagination.limit + 1;
                            const end = Math.min(pagination.page * pagination.limit, pagination.total);
                            return (
                                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                            Showing <span className="font-medium text-gray-900 dark:text-white">{start}</span> to{' '}
                                            <span className="font-medium text-gray-900 dark:text-white">{end}</span> of{' '}
                                            <span className="font-medium text-gray-900 dark:text-white">{pagination.total}</span> users
                                        </div>
                                        <div className="flex items-center gap-0.5">
                                            <button
                                                type="button"
                                                disabled={pagination.page <= 1}
                                                onClick={() => setPagination(prev => ({...prev, page: 1}))}
                                                className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                                title="First"
                                            >
                                                <FiChevronsLeft size={16} />
                                            </button>
                                            <button
                                                type="button"
                                                disabled={pagination.page <= 1}
                                                onClick={() => setPagination(prev => ({...prev, page: prev.page - 1}))}
                                                className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                                title="Previous"
                                            >
                                                <FiChevronLeft size={16} />
                                            </button>
                                            <span className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg min-w-[80px] text-center">
                                                {pagination.page}
                                            </span>
                                            <button
                                                type="button"
                                                disabled={pagination.page >= totalPages}
                                                onClick={() => setPagination(prev => ({...prev, page: prev.page + 1}))}
                                                className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                                title="Next"
                                            >
                                                <FiChevronRight size={16} />
                                            </button>
                                            <button
                                                type="button"
                                                disabled={pagination.page >= totalPages}
                                                onClick={() => setPagination(prev => ({...prev, page: totalPages}))}
                                                className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                                title="Last"
                                            >
                                                <FiChevronsRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    {totalPages > 1 && (
                                        <form
                                            onSubmit={(e) => {
                                                e.preventDefault();
                                                const val = parseInt(pageJumpInput || String(pagination.page), 10);
                                                if (val >= 1 && val <= totalPages) setPagination(prev => ({...prev, page: val}));
                                                setPageJumpInput('');
                                            }}
                                            className="flex items-center gap-2"
                                        >
                                            <span className="text-sm text-gray-500 dark:text-gray-400">Go to</span>
                                            <input
                                                type="number"
                                                min={1}
                                                max={totalPages}
                                                value={pageJumpInput !== '' ? pageJumpInput : String(pagination.page)}
                                                onChange={(e) => setPageJumpInput(e.target.value)}
                                                placeholder={`${start}-${end}`}
                                                className="w-14 px-2 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
                                            />
                                            <button
                                                type="submit"
                                                className="px-2 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                            >
                                                Go
                                            </button>
                                        </form>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                </div>
            </div>

            {/* Billing Modal - For payments and invoices */}
            <UserBillingModal
                isOpen={billingModalOpen}
                onClose={handleCloseBilling}
                user={selectedUser}
                tokens={tokens}
                onUpdated={() => {
                    fetchUsers(pagination.page);
                }}
            />

            {/* Transaction history modal removed – now using dedicated page */}
        </div>
    );
};

export default Users;