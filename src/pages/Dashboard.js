import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, Sidebar } from '../component/Menu';
import {
    FiMessageSquare,
    FiUsers,
    FiZap,
    FiFileText,
    FiCreditCard,
    FiBarChart2,
    FiArrowUpRight,
    FiArrowDownLeft,
    FiActivity
} from 'react-icons/fi';
import axios from 'axios';

function AdminDashboard() {
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [tokens, setTokens] = useState(null);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isMinimized, setIsMinimized] = useState(() => {
        const saved = localStorage.getItem('sidebarMinimized');
        return saved ? JSON.parse(saved) : false;
    });

    useEffect(() => {
        localStorage.setItem('sidebarMinimized', JSON.stringify(isMinimized));
    }, [isMinimized]);

    // Load Admin Tokens
    useEffect(() => {
        const data = localStorage.getItem('userData') || sessionStorage.getItem('userData');
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
                const response = await axios.get('https://api.w1chat.com/admin/dashboard/summary', {
                    headers: {
                        'x-token': tokens.token,
                        'username': tokens.username
                    }
                });

                if (!response.data.error) {
                    setSummary(response.data.data);
                } else {
                    setError(response.data.message || 'Failed to fetch admin summary');
                }
            } catch (err) {
                setError('Authorization failed or server error');
            } finally {
                setLoading(false);
            }
        };

        fetchSummary();
    }, [tokens]);

    // Mapping API data to UI metrics
    const mainStats = summary ? [
        { title: "Total Users", value: summary.users.total, sub: `${summary.users.active} Active`, icon: <FiUsers />, color: "text-blue-600", bgColor: "bg-blue-50" },
        { title: "Total Projects", value: summary.projects, icon: <FiActivity />, color: "text-indigo-600", bgColor: "bg-indigo-50" },
        { title: "Campaigns", value: summary.campaigns, icon: <FiZap />, color: "text-orange-600", bgColor: "bg-orange-50" },
        { title: "Messages Sent", value: summary.messages, icon: <FiMessageSquare />, color: "text-green-600", bgColor: "bg-green-50" },
        { title: "Templates", value: summary.templates, icon: <FiFileText />, color: "text-purple-600", bgColor: "bg-purple-50" },
    ] : [];

    return (
        <div className="min-h-screen bg-gray-50">
            <Header mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} isMinimized={isMinimized} setIsMinimized={setIsMinimized} />
            <Sidebar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} isMinimized={isMinimized} setIsMinimized={setIsMinimized} />

            <div className={`pt-16 transition-all duration-300 ${isMinimized ? 'md:pl-20' : 'md:pl-72'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-900">Admin Overview</h1>
                        <p className="text-gray-500">Global system performance and financial summary.</p>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-32 bg-white rounded-xl shadow-sm"></div>)}
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">{error}</div>
                    ) : (
                        <>
                            {/* Main Counts */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                                {mainStats.map((stat, idx) => (
                                    <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                        <div className={`w-10 h-10 ${stat.bgColor} ${stat.color} rounded-lg flex items-center justify-center mb-4 text-xl`}>
                                            {stat.icon}
                                        </div>
                                        <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                                        <h3 className="text-2xl font-bold text-gray-900">{stat.value.toLocaleString()}</h3>
                                        {stat.sub && <p className="text-xs text-green-600 mt-1 font-medium">{stat.sub}</p>}
                                    </div>
                                ))}
                            </div>

                            {/* Financial Summary */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-lg font-semibold flex items-center">
                                            <FiCreditCard className="mr-2 text-indigo-500" /> Transaction Summary
                                        </h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                                            <div className="flex items-center text-green-700 mb-1">
                                                <FiArrowUpRight className="mr-1" />
                                                <span className="text-xs font-bold uppercase">Total Credits</span>
                                            </div>
                                            <p className="text-xl font-bold text-green-800">₹{summary.transactions.total_credit.toLocaleString()}</p>
                                        </div>
                                        <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                                            <div className="flex items-center text-red-700 mb-1">
                                                <FiArrowDownLeft className="mr-1" />
                                                <span className="text-xs font-bold uppercase">Total Debits</span>
                                            </div>
                                            <p className="text-xl font-bold text-red-800">₹{summary.transactions.total_debit.toLocaleString()}</p>
                                        </div>
                                        <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                                            <div className="flex items-center text-indigo-700 mb-1">
                                                <FiBarChart2 className="mr-1" />
                                                <span className="text-xs font-bold uppercase">Net Balance</span>
                                            </div>
                                            <p className="text-xl font-bold text-indigo-800">₹{summary.transactions.balance.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Links/Status */}
                                <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-xl p-6 text-white shadow-lg shadow-indigo-200">
                                    <h3 className="text-lg font-semibold mb-4">System Health</h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center border-b border-indigo-400 pb-2">
                                            <span className="text-indigo-100 text-sm">Active Ratio</span>
                                            <span className="font-bold">{((summary.users.active / summary.users.total) * 100).toFixed(1)}%</span>
                                        </div>
                                        <div className="flex justify-between items-center border-b border-indigo-400 pb-2">
                                            <span className="text-indigo-100 text-sm">Avg Projects/User</span>
                                            <span className="font-bold">{(summary.projects / summary.users.total).toFixed(1)}</span>
                                        </div>
                                        <button 
                                            onClick={() => navigate('/admin/users')}
                                            className="w-full mt-4 bg-white text-indigo-600 py-2 rounded-lg font-semibold hover:bg-indigo-50 transition-colors"
                                        >
                                            Manage Users
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;