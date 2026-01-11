import React, { useState, useEffect, useCallback } from 'react';
import { Header, Sidebar } from '../component/Menu'; // Adjust path if necessary
import { useNavigate } from 'react-router-dom';
import {
    FiSearch,
    FiEye,
    FiUserCheck,
    FiUserX,
    FiMail,
    FiPhone,
    FiChevronLeft,
    FiChevronRight,
    FiFilter,
    FiDownload,
    FiUsers,
    FiActivity,
    FiLogIn,
    FiCreditCard
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
    const [searchTerm, setSearchTerm] = useState('');
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
    const [tokens, setTokens] = useState(null);
    const [billingModalOpen, setBillingModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

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
            const response = await axios.get(`https://api.w1chat.com/admin/users?page=${page}&limit=${pagination.limit}`, {
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

    // Derived filtering for current page
    const filteredUsers = users.filter(user => 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleLoginAsUser = (user) => {
        if (!user?.email) return;
        const baseUrl = 'https://wichat-sigma.vercel.app/login';
        const params = new URLSearchParams({
            username: user.email,
            // If backend sends a password field for the user, it will be used here.
            // Otherwise this will be empty and the target app can handle it.
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
                <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8">
                    
                    {/* Page Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Manage, monitor and verify system users across all projects.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm">
                                <FiDownload className="mr-2" /> Export CSV
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
                                    <h3 className="text-2xl font-bold dark:text-white">{users.filter(u => u.status === '1').length} <span className="text-sm font-normal text-gray-400">on this page</span></h3>
                                </div>
                                <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
                                    <FiActivity size={24} />
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
                                    placeholder="Search by name, email or username..."
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button className="flex items-center justify-center px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                                <FiFilter className="mr-2" /> Filters
                            </button>
                        </div>
                    </div>

                    {/* Table Container */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100vh - 32rem)' }}>
                        <div className="overflow-x-auto overflow-y-auto flex-1">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900/50">S.No.</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900/50">Contact</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900/50">Status</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900/50">Role</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right bg-gray-50 dark:bg-gray-900/50">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {loading ? (
                                        [...Array(5)].map((_, i) => (
                                            <tr key={i} className="animate-pulse">
                                                <td colSpan="5" className="px-6 py-8"><div className="h-8 bg-gray-100 dark:bg-gray-700 rounded w-full"></div></td>
                                            </tr>
                                        ))
                                    ) : filteredUsers.length > 0 ? (
                                        filteredUsers.map((user, index) => (
                                            <tr key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                                                <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                                                    {(pagination.page - 1) * pagination.limit + index + 1}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center text-xs text-gray-600 dark:text-gray-400"><FiMail className="mr-2" size={12}/> {user.email}</div>
                                                        <div className="flex items-center text-xs text-gray-600 dark:text-gray-400"><FiPhone className="mr-2" size={12}/> {user.country_code} {user.mobile}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {user.status === '1' ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                                                            <FiUserCheck className="mr-1" /> Active
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400">
                                                            <FiUserX className="mr-1" /> Inactive
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                                        {user.role?.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button 
                                                            onClick={() => navigate(`/admin/users/${user.username}`)}
                                                            className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"
                                                            title="View Profile"
                                                        >
                                                            <FiEye size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleOpenBilling(user)}
                                                            className="p-2 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-all"
                                                            title="View Billing & Plans"
                                                        >
                                                            <FiCreditCard size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleLoginAsUser(user)}
                                                            className="p-2 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-all"
                                                            title="Login as this user"
                                                        >
                                                            <FiLogIn size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                                No users found matching your search.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Bar */}
                        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-sm text-gray-500 dark:text-gray-400 text-center sm:text-left">
                                Showing <span className="font-medium text-gray-900 dark:text-white">{(pagination.page - 1) * pagination.limit + 1}</span> to <span className="font-medium text-gray-900 dark:text-white">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="font-medium text-gray-900 dark:text-white">{pagination.total}</span> users
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    disabled={pagination.page === 1}
                                    onClick={() => setPagination(prev => ({...prev, page: prev.page - 1}))}
                                    className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all dark:text-white"
                                >
                                    <FiChevronLeft />
                                </button>
                                <div className="text-sm font-medium px-4 dark:text-white">Page {pagination.page}</div>
                                <button 
                                    disabled={pagination.page * pagination.limit >= pagination.total}
                                    onClick={() => setPagination(prev => ({...prev, page: prev.page + 1}))}
                                    className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all dark:text-white"
                                >
                                    <FiChevronRight />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Billing Modal */}
            <UserBillingModal
                isOpen={billingModalOpen}
                onClose={handleCloseBilling}
                user={selectedUser}
                tokens={tokens}
                onUpdated={() => {
                    // Optionally refresh users list if needed
                }}
            />
        </div>
    );
};

export default Users;