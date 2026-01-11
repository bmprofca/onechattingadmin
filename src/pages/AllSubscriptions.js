import React, { useState, useEffect, useCallback } from 'react';
import { Header, Sidebar } from '../component/Menu';
import { useNavigate } from 'react-router-dom';
import {
    FiSearch, FiRefreshCw, FiFilter, FiChevronDown, FiCheckCircle,
    FiXCircle, FiCalendar, FiCreditCard, FiPackage, FiUsers, FiDollarSign
} from 'react-icons/fi';
import axios from 'axios';

const AllSubscriptions = () => {
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(() => {
        const saved = localStorage.getItem('sidebarMinimized');
        return saved ? JSON.parse(saved) : false;
    });

    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [tokens, setTokens] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [packTypeFilter, setPackTypeFilter] = useState('all');
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        localStorage.setItem('sidebarMinimized', JSON.stringify(isMinimized));
    }, [isMinimized]);

    useEffect(() => {
        const data = localStorage.getItem('userData') || sessionStorage.getItem('userData');
        if (data) {
            setTokens(JSON.parse(data));
        } else {
            navigate('/login');
        }
    }, [navigate]);

    const fetchSubscriptions = useCallback(async () => {
        if (!tokens?.token) return;
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (statusFilter !== 'all') params.append('status', statusFilter);
            if (packTypeFilter !== 'all') params.append('pack_type', packTypeFilter);

            const response = await axios.get(
                `https://api.w1chat.com/admin/subscription/all-subscriptions?${params.toString()}`,
                {
                    headers: { 'x-token': tokens.token }
                }
            );

            if (!response.data.error) {
                setSubscriptions(response.data.data || []);
            }
        } catch (err) {
            console.error("Failed to fetch subscriptions", err);
        } finally {
            setLoading(false);
        }
    }, [tokens, statusFilter, packTypeFilter]);

    useEffect(() => {
        if (tokens?.token) {
            fetchSubscriptions();
        }
    }, [fetchSubscriptions, tokens]);

    const filteredSubscriptions = subscriptions.filter(sub =>
        sub.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.pack_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.subscription_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatCurrency = (amount) => {
        if (!amount) return '₹0';
        return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            return new Date(dateString).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    const isExpired = (endDate) => {
        if (!endDate) return false;
        try {
            return new Date(endDate) < new Date();
        } catch {
            return false;
        }
    };

    const stats = {
        total: subscriptions.length,
        active: subscriptions.filter(s => s.status === 'active').length,
        expired: subscriptions.filter(s => s.status === 'expired').length,
        revenue: subscriptions.reduce((sum, s) => sum + parseFloat(s.amount_paid || 0), 0),
        autoRenew: subscriptions.filter(s => s.auto_renew === '1').length
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

            <div className={`pt-16 transition-all duration-300 ease-in-out ${isMinimized ? 'md:pl-20' : 'md:pl-72'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8">
                    
                    {/* Page Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">All Subscriptions</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Monitor and manage all user subscriptions</p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                                    <h3 className="text-2xl font-bold dark:text-white">{stats.total}</h3>
                                </div>
                                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                    <FiPackage size={24} />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
                                    <h3 className="text-2xl font-bold dark:text-white">{stats.active}</h3>
                                </div>
                                <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
                                    <FiCheckCircle size={24} />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Expired</p>
                                    <h3 className="text-2xl font-bold dark:text-white">{stats.expired}</h3>
                                </div>
                                <div className="p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg">
                                    <FiXCircle size={24} />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Auto-Renew</p>
                                    <h3 className="text-2xl font-bold dark:text-white">{stats.autoRenew}</h3>
                                </div>
                                <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                                    <FiRefreshCw size={24} />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Revenue</p>
                                    <h3 className="text-xl font-bold dark:text-white">{formatCurrency(stats.revenue)}</h3>
                                </div>
                                <div className="p-3 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg">
                                    <FiDollarSign size={24} />
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
                                    placeholder="Search by username, email, pack name, subscription ID..."
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <button
                                        onClick={() => setShowFilters(!showFilters)}
                                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                                    >
                                        <FiFilter size={16} />
                                        Filters
                                        <FiChevronDown size={14} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                                    </button>
                                    
                                    {showFilters && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setShowFilters(false)}></div>
                                            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg z-50 p-4">
                                                <div className="mb-4">
                                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                                                        Status
                                                    </label>
                                                    <select
                                                        value={statusFilter}
                                                        onChange={(e) => setStatusFilter(e.target.value)}
                                                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                                    >
                                                        <option value="all">All Status</option>
                                                        <option value="active">Active</option>
                                                        <option value="expired">Expired</option>
                                                        <option value="cancelled">Cancelled</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                                                        Pack Type
                                                    </label>
                                                    <select
                                                        value={packTypeFilter}
                                                        onChange={(e) => setPackTypeFilter(e.target.value)}
                                                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                                    >
                                                        <option value="all">All Types</option>
                                                        <option value="platform">Platform</option>
                                                        <option value="addon">Add-on</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <button
                                    onClick={fetchSubscriptions}
                                    className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"
                                >
                                    <FiRefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : filteredSubscriptions.length === 0 ? (
                            <div className="text-center py-20">
                                <FiPackage className="mx-auto text-gray-300 dark:text-gray-700 mb-3" size={48} />
                                <p className="text-gray-500 dark:text-gray-400 font-medium">No subscriptions found</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                                        <tr>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pack</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Period</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Payment</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Auto-Renew</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {filteredSubscriptions.map((sub) => {
                                            const expired = isExpired(sub.end_date);
                                            const walletUsed = parseFloat(sub.wallet_amount || 0) > 0;
                                            const gatewayUsed = parseFloat(sub.gateway_amount || 0) > 0;

                                            return (
                                                <tr key={sub.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <div className="font-medium text-gray-900 dark:text-white">{sub.name || sub.username}</div>
                                                            <div className="text-sm text-gray-500 dark:text-gray-400">{sub.email}</div>
                                                            <div className="text-xs text-gray-400 dark:text-gray-500 font-mono">{sub.username}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <div className="font-medium text-gray-900 dark:text-white">{sub.pack_name}</div>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                                                    sub.pack_type === 'platform'
                                                                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                                                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                                }`}>
                                                                    {sub.pack_type}
                                                                </span>
                                                            </div>
                                                            <div className="text-xs text-gray-400 font-mono mt-1">{sub.subscription_id}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                                                            <FiCalendar size={12} />
                                                            <span>{formatDate(sub.start_date)}</span>
                                                        </div>
                                                        <div className="text-xs text-gray-400 dark:text-gray-500">
                                                            to {formatDate(sub.end_date)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-semibold text-gray-900 dark:text-white">
                                                            {formatCurrency(sub.amount_paid)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="space-y-1">
                                                            {walletUsed && (
                                                                <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                                                                    <FiCreditCard size={10} />
                                                                    Wallet: {formatCurrency(sub.wallet_amount)}
                                                                </div>
                                                            )}
                                                            {gatewayUsed && (
                                                                <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                                                                    <FiCreditCard size={10} />
                                                                    Gateway: {formatCurrency(sub.gateway_amount)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {sub.status === 'active' && !expired ? (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                                                                <FiCheckCircle className="mr-1" size={12} /> Active
                                                            </span>
                                                        ) : sub.status === 'expired' || expired ? (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-400">
                                                                <FiXCircle className="mr-1" size={12} /> Expired
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400">
                                                                {sub.status}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {sub.auto_renew === '1' ? (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400">
                                                                <FiRefreshCw className="mr-1" size={12} /> Yes
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-gray-400">No</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AllSubscriptions;
