import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FiMessageSquare,
    FiUsers,
    FiZap,
    FiFileText,
    FiCreditCard,
    FiBarChart2,
    FiArrowUpRight,
    FiArrowDownLeft,
    FiActivity,
    FiTrendingUp,
    FiShield,
    FiClock,
    FiAward,
    FiDollarSign,
    FiPieChart,
    FiExternalLink,
    FiRefreshCw,
    FiChevronRight
} from 'react-icons/fi';
import { apiCall } from '../utils/apiCall';
import toast from 'react-hot-toast';
import ActionCard from '../component/common/ActionCard';

function AdminDashboard() {

    const navigate = useNavigate();
    const [tokens, setTokens] = useState(null);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Load Admin Tokens
    useEffect(() => {
        const data = localStorage.getItem('user_data') || localStorage.getItem('userData') || sessionStorage.getItem('userData');
        if (data) {
            setTokens(JSON.parse(data));
        } else {
            navigate('/login');
        }
    }, [navigate]);

    // Fetch Admin Summary
    useEffect(() => {
        const fetchSummary = async () => {
            if (!tokens?.token) return;

            try {
                setLoading(true);
                const response = await apiCall('/admin/dashboard/summary', 'GET', null, {
                    'x-token': tokens.token,
                    'username': tokens.username
                });

                if (response.ok) {
                    const data = await response.json();
                    if (!data.error) {
                        setSummary(data.data);
                    } else {
                        toast.error(data.message || 'Failed to fetch admin summary');
                    }
                } else {
                    toast.error('Failed to fetch admin summary');
                }
            } catch (err) {
                toast.error('Authorization failed or server error');
            } finally {
                setLoading(false);
            }
        };

        fetchSummary();
    }, [tokens]);

    // Mapping API data to UI metrics with enhanced styling
    const mainStats = summary ? [
        {
            title: "Total Users",
            value: summary.users.total,
            sub: `${summary.users.active} Active Users`,
            icon: <FiUsers />,
            color: "text-blue-600 dark:text-blue-400",
            bgColor: "bg-blue-50 dark:bg-blue-950/50",
            gradient: "from-blue-500 to-blue-600",
            borderColor: "border-blue-200",
            trend: "+12%",
            trendUp: true
        },
        {
            title: "Total Projects",
            value: summary.projects,
            icon: <FiActivity />,
            color: "text-indigo-600 dark:text-indigo-400",
            bgColor: "bg-indigo-50 dark:bg-indigo-950/50",
            gradient: "from-indigo-500 to-indigo-600",
            borderColor: "border-indigo-200",
            trend: "+8%",
            trendUp: true
        },
        {
            title: "Campaigns",
            value: summary.campaigns,
            icon: <FiZap />,
            color: "text-orange-600 dark:text-orange-400",
            bgColor: "bg-orange-50 dark:bg-orange-950/50",
            gradient: "from-orange-500 to-orange-600",
            borderColor: "border-orange-200",
            trend: "+5%",
            trendUp: true
        },
        {
            title: "Messages Sent",
            value: summary.messages,
            icon: <FiMessageSquare />,
            color: "text-green-600 dark:text-green-400",
            bgColor: "bg-green-50 dark:bg-green-950/50",
            gradient: "from-green-500 to-green-600",
            borderColor: "border-green-200",
            trend: "+23%",
            trendUp: true
        },
        {
            title: "Templates",
            value: summary.templates,
            icon: <FiFileText />,
            color: "text-purple-600 dark:text-purple-400",
            bgColor: "bg-purple-50 dark:bg-purple-950/50",
            gradient: "from-purple-500 to-purple-600",
            borderColor: "border-purple-200",
            trend: "+3%",
            trendUp: false
        },
    ] : [];

    // Format currency with proper symbol
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Get greeting based on time
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <div className="mx-auto">
            {/* Header Section with Greeting */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <FiAward className="text-2xl text-indigo-600 dark:text-indigo-400" />
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            Admin Dashboard
                        </h1>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 flex items-center gap-2">
                        <FiClock className="text-gray-400 dark:text-gray-500" />
                        {getGreeting()}, {tokens?.username || 'Admin'} • Overview of your platform
                    </p>
                </div>

                {/* Refresh Button */}
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 md:mt-0 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-black/20 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-md transition-all duration-300 flex items-center gap-2 group"
                >
                    <FiRefreshCw className="group-hover:rotate-180 transition-transform duration-500" />
                    Refresh Data
                </button>
            </div>

            {loading ? (
                <div className="space-y-6">
                    {/* Skeleton Loader */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-black/20 p-6 animate-pulse">
                                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2"></div>
                                <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-black/20 p-6 animate-pulse">
                            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4"></div>
                            <div className="grid grid-cols-3 gap-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-24 bg-gray-100 dark:bg-gray-700 rounded-lg"></div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-lg p-6 animate-pulse">
                            <div className="h-6 bg-white/20 rounded w-32 mb-4"></div>
                            <div className="space-y-3">
                                {[1, 2].map(i => (
                                    <div key={i} className="h-12 bg-white/10 rounded"></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : error ? (
                <div className="bg-red-50 dark:bg-red-950/30 border-l-4 border-red-500 dark:border-red-400 text-red-700 dark:text-red-300 p-6 rounded-lg shadow-lg dark:shadow-black/20">
                    <div className="flex items-center">
                        <FiShield className="text-2xl mr-3" />
                        <div>
                            <h3 className="font-bold text-lg">Error Loading Dashboard</h3>
                            <p>{error}</p>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {/* Main Counts with Enhanced Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                        {mainStats.map((stat, idx) => (
                            <div
                                key={idx}
                                className="group bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-black/20 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 dark:border-gray-700 overflow-hidden"
                            >
                                <div className="p-6">
                                    <div className={`w-12 h-12 ${stat.bgColor} ${stat.color} rounded-lg flex items-center justify-center mb-4 text-2xl group-hover:scale-110 transition-transform duration-300`}>
                                        {stat.icon}
                                    </div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{stat.title}</p>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{stat.value.toLocaleString()}</h3>
                                    {stat.sub && (
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs text-green-600 dark:text-green-300 font-medium bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full">
                                                {stat.sub}
                                            </p>
                                            <span className={`text-xs font-semibold ${stat.trendUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} flex items-center`}>
                                                {stat.trendUp ? <FiArrowUpRight /> : <FiArrowDownLeft />}
                                                {stat.trend}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className={`h-1 bg-gradient-to-r ${stat.gradient} w-0 group-hover:w-full transition-all duration-500`}></div>
                            </div>
                        ))}
                    </div>

                    {/* Financial Summary with Enhanced Design */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        {/* Transaction Summary Card */}
                        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl dark:shadow-black/20 border border-gray-100 dark:border-gray-700 overflow-hidden">
                            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50 px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold flex items-center text-gray-800 dark:text-gray-100">
                                        <FiCreditCard className="mr-2 text-indigo-600 dark:text-indigo-400" />
                                        Financial Overview
                                    </h3>
                                    <FiTrendingUp className="text-indigo-600 dark:text-indigo-400 text-xl" />
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-green-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-lg"></div>
                                        <div className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 rounded-lg border border-green-100 dark:border-green-900">
                                            <div className="flex items-center text-green-700 dark:text-green-300 mb-2">
                                                <div className="p-2 bg-green-200 dark:bg-green-900/60 rounded-lg mr-2">
                                                    <FiArrowUpRight className="text-green-700 dark:text-green-300" />
                                                </div>
                                                <span className="text-xs font-bold uppercase tracking-wider">Total Credits</span>
                                            </div>
                                            <p className="text-2xl font-bold text-green-800 dark:text-green-200">{formatCurrency(summary.transactions.total_credit)}</p>
                                            <p className="text-xs text-green-600 dark:text-green-400 mt-2">+15.3% from last month</p>
                                        </div>
                                    </div>

                                    <div className="relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-red-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-lg"></div>
                                        <div className="p-5 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/50 dark:to-rose-950/50 rounded-lg border border-red-100 dark:border-red-900">
                                            <div className="flex items-center text-red-700 dark:text-red-300 mb-2">
                                                <div className="p-2 bg-red-200 dark:bg-red-900/60 rounded-lg mr-2">
                                                    <FiArrowDownLeft className="text-red-700 dark:text-red-300" />
                                                </div>
                                                <span className="text-xs font-bold uppercase tracking-wider">Total Debits</span>
                                            </div>
                                            <p className="text-2xl font-bold text-red-800 dark:text-red-200">{formatCurrency(summary.transactions.total_debit)}</p>
                                            <p className="text-xs text-red-600 dark:text-red-400 mt-2">+8.2% from last month</p>
                                        </div>
                                    </div>

                                    <div className="relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-purple-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-lg"></div>
                                        <div className="p-5 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50 rounded-lg border border-indigo-100 dark:border-indigo-900">
                                            <div className="flex items-center text-indigo-700 dark:text-indigo-300 mb-2">
                                                <div className="p-2 bg-indigo-200 dark:bg-indigo-900/60 rounded-lg mr-2">
                                                    <FiBarChart2 className="text-indigo-700 dark:text-indigo-300" />
                                                </div>
                                                <span className="text-xs font-bold uppercase tracking-wider">Net Balance</span>
                                            </div>
                                            <p className="text-2xl font-bold text-indigo-800 dark:text-indigo-200">{formatCurrency(summary.transactions.balance)}</p>
                                            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2">Available balance</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Additional Metrics */}
                                <div className="mt-6 grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                            <FiDollarSign className="text-gray-600 dark:text-gray-300" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Avg. Transaction</p>
                                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                                {formatCurrency(summary.transactions.total_credit / 100)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                            <FiPieChart className="text-gray-600 dark:text-gray-300" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Transaction Ratio</p>
                                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                                {((summary.transactions.total_credit / summary.transactions.total_debit) * 100).toFixed(1)}%
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* System Health Card with Enhanced Design */}
                        <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-800 dark:from-indigo-800 dark:via-indigo-900 dark:to-blue-950 rounded-lg p-6 text-white shadow-2xl shadow-indigo-200 dark:shadow-black/40 relative overflow-hidden">
                            {/* Decorative Elements */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-8 -mt-8"></div>
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-5 rounded-full -ml-8 -mb-8"></div>

                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold flex items-center">
                                        <FiShield className="mr-2" /> System Health
                                    </h3>
                                    <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold tracking-wider">
                                        LIVE
                                    </span>
                                </div>

                                <div className="space-y-5">
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-indigo-100 text-sm">Active Users Ratio</span>
                                            <span className="font-bold text-lg">{((summary.users.active / summary.users.total) * 100).toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-indigo-400/30 rounded-full h-2.5">
                                            <div
                                                className="bg-white rounded-full h-2.5 transition-all duration-500"
                                                style={{ width: `${(summary.users.active / summary.users.total) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-indigo-100 text-sm">Avg Projects/User</span>
                                            <span className="font-bold text-lg">{(summary.projects / summary.users.total).toFixed(1)}</span>
                                        </div>
                                        <div className="w-full bg-indigo-400/30 rounded-full h-2.5">
                                            <div
                                                className="bg-white rounded-full h-2.5 transition-all duration-500"
                                                style={{ width: `${(summary.projects / summary.users.total) * 25}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <div className="flex items-center justify-between text-indigo-100 text-sm mb-3">
                                            <span>System Status</span>
                                            <span className="flex items-center text-green-300">
                                                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></span>
                                                Operational
                                            </span>
                                        </div>

                                        <button
                                            onClick={() => navigate('/users')}
                                            className="w-full mt-4 bg-white text-indigo-700 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center group"
                                        >
                                            Manage Users
                                            <FiChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                        {[{ title: 'Manage Users', description: 'Review users, balances, and KYC information.', path: '/users', icon: <FiUsers className="text-white text-2xl" />, gradient: 'blue' }, { title: 'Projects', description: 'Review connected projects and WABA status.', path: '/projects', icon: <FiActivity className="text-white text-2xl" />, gradient: 'indigo' }, { title: 'Subscriptions', description: 'Manage packages and user subscriptions.', path: '/subscriptions', icon: <FiCreditCard className="text-white text-2xl" />, gradient: 'purple' }, { title: 'AI Providers', description: 'Configure provider credentials and availability.', path: '/ai-providers', icon: <FiZap className="text-white text-2xl" />, gradient: 'blue' }].map((action, idx) => (
                            <ActionCard key={action.path} {...action} buttonText="Open" onClick={() => navigate(action.path)} delay={idx * 0.08} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

export default AdminDashboard;
