import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FiSearch, FiUsers, FiPackage, FiRefreshCw,
    FiTrash2, FiAlertCircle, FiCheckCircle, FiX, FiFilter, FiChevronDown,
    FiEdit2, FiPlus, FiUser, FiPercent
} from 'react-icons/fi';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { Encrypt } from '../pages/encryption/payload-encryption';
import toast from 'react-hot-toast';
import ManagementTable from '../component/common/ManagementTable';
import ActionCard from '../component/common/ActionCard';
import Pagination from '../component/common/PaginationComponent';

const BASE_URL = (process.env.REACT_APP_API_BASE_URL || 'http://localhost:6540') + '/admin';
const BASE_PACKAGE = {
    monthly: 499,
    yearly: 4999
};

const CustomPricing = () => {

    const navigate = useNavigate();
    const [isMinimized, setIsMinimized] = useState(() => {
        const saved = localStorage.getItem('sidebarMinimized');
        return saved ? JSON.parse(saved) : false;
    });

    const [customPackages, setCustomPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [tokens, setTokens] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filterStatus, setFilterStatus] = useState('all');

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showUserSearchModal, setShowUserSearchModal] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [users, setUsers] = useState([]);
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [loadingUsers, setLoadingUsers] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        username: '',
        userName: '',
        monthly: '',
        yearly: ''
    });

    // Pagination states
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        total_pages: 1
    });

    useEffect(() => {
        const data = localStorage.getItem('user_data') || localStorage.getItem('userData') || sessionStorage.getItem('userData');
        if (data) {
            setTokens(JSON.parse(data));
        } else {
            navigate('/login');
        }
    }, [navigate]);

    const fetchCustomPackages = useCallback(async () => {
        if (!tokens?.token) return;
        setLoading(true);
        try {
            const payload = { search: searchTerm };
            const { data, key } = Encrypt(payload);

            const response = await axios.post(
                `${BASE_URL}/custom-packages?page=${pagination.page}&limit=${pagination.limit}`,
                { data, key },
                {
                    headers: {
                        'x-token': tokens.token,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.data.error) {
                setCustomPackages(response.data.data || []);
                setPagination(response.data.pagination || {
                    page: 1,
                    limit: 20,
                    total: 0,
                    total_pages: 1
                });
            }
        } catch (err) {
            console.error("Failed to fetch custom packages", err);
            toast.error('Failed to fetch custom packages data');
        } finally {
            setLoading(false);
        }
    }, [tokens, searchTerm, pagination.limit, pagination.page]);

    const fetchUsers = async (search = '') => {
        if (!tokens?.token) return;
        setLoadingUsers(true);
        try {
            const response = await axios.get(
                `${BASE_URL}/users/${search}`,
                {
                    headers: { 'x-token': tokens.token }
                }
            );

            if (!response.data.error) {
                setUsers(response.data.data || []);
            }
        } catch (err) {
            console.error("Failed to fetch users", err);
        } finally {
            setLoadingUsers(false);
        }
    };

    useEffect(() => {
        if (tokens?.token) {
            fetchCustomPackages();
        }
    }, [fetchCustomPackages, tokens]);

    useEffect(() => {
        if (showUserSearchModal) {
            fetchUsers(userSearchTerm);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showUserSearchModal, userSearchTerm, tokens]);

    const handleCreatePackage = async () => {
        if (!tokens?.token) return;

        if (!formData.username) {
            toast.error('Please select a user');
            return;
        }

        if (!formData.monthly || !formData.yearly) {
            toast.error('Please enter both monthly and yearly prices');
            return;
        }

        try {
            const payload = {
                username: formData.username,
                monthly: parseFloat(formData.monthly),
                yearly: parseFloat(formData.yearly)
            };

            const { data, key } = Encrypt(payload);

            const response = await axios.post(
                `${BASE_URL}/create-custom-package`,
                { data, key },
                {
                    headers: {
                        'x-token': tokens.token,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data?.error) {
                toast.error(response.data.error || 'Failed to create custom package');
            } else {
                toast.success('Custom package created successfully');
                setShowCreateModal(false);
                resetForm();
                setPagination(prev => ({ ...prev, page: 1 }));
            }
        } catch (err) {
            toast.error(err?.response?.data?.error || 'Failed to create custom package');
        }
    };

    const handleUpdatePackage = async () => {
        if (!tokens?.token || !selectedPackage) return;

        try {
            const payload = {
                custom_id: selectedPackage.custom_id,
                monthly: parseFloat(formData.monthly),
                yearly: parseFloat(formData.yearly)
            };

            const { data, key } = Encrypt(payload);

            const response = await axios.post(
                `${BASE_URL}/update-custom-package`,
                { data, key },
                {
                    headers: {
                        'x-token': tokens.token,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data?.error) {
                toast.error(response.data.error || 'Failed to update custom package');
            } else {
                toast.success('Custom package updated successfully');
                setShowEditModal(false);
                setSelectedPackage(null);
                resetForm();
                fetchCustomPackages();
            }
        } catch (err) {
            toast.error(err?.response?.data?.error || 'Failed to update custom package');
        }
    };

    const handleDeletePackage = async (custom_id) => {
        if (!window.confirm('Are you sure you want to delete this custom package?')) return;
        if (!tokens?.token) return;

        try {
            const payload = { custom_id };
            const { data, key } = Encrypt(payload);

            const response = await axios.post(
                `${BASE_URL}/delete-custom-package`,
                { data, key },
                {
                    headers: {
                        'x-token': tokens.token,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data?.error) {
                toast.error(response.data.error || 'Failed to delete custom package');
            } else {
                toast.success('Custom package deleted successfully');
                fetchCustomPackages();
            }
        } catch (err) {
            toast.error(err?.response?.data?.error || 'Failed to delete custom package');
        }
    };

    const openEditModal = (pkg) => {
        setSelectedPackage(pkg);
        setFormData({
            username: pkg.user?.name || '',
            userName: pkg.user?.name || '',
            monthly: pkg.package?.monthly || '',
            yearly: pkg.package?.yearly || ''
        });
        setShowEditModal(true);
    };

    const openCreateModal = () => {
        resetForm();
        setShowCreateModal(true);
    };

    const resetForm = () => {
        setFormData({
            username: '',
            userName: '',
            monthly: '',
            yearly: ''
        });
        setSelectedPackage(null);
        setUserSearchTerm('');
    };

    const selectUser = (user) => {
        setFormData(prev => ({
            ...prev,
            username: user.username,
            userName: user.name
        }));
        setShowUserSearchModal(false);
        setUserSearchTerm('');
    };

    const calculateDiscount = (price, type) => {
        const basePrice = type === 'monthly' ? BASE_PACKAGE.monthly : BASE_PACKAGE.yearly;
        const discount = basePrice - parseFloat(price || 0);
        const discountPercent = basePrice > 0 ? ((discount / basePrice) * 100).toFixed(1) : 0;
        return { discount, discountPercent };
    };

    const packageColumns = [
        { key: 'user', label: 'User', render: item => <div><p className="font-semibold text-gray-900 dark:text-white">{item.user?.name || 'N/A'}</p><p className="font-mono text-xs text-gray-500">{item.user?.username || 'N/A'}</p></div> },
        { key: 'contact', label: 'Contact', render: item => <div className="text-xs"><p>{item.user?.email || '—'}</p><p className="text-gray-500">{item.user?.country_code} {item.user?.mobile}</p></div> },
        { key: 'monthly', label: 'Monthly', render: item => `₹${item.package?.monthly || 0}` },
        { key: 'yearly', label: 'Yearly', render: item => `₹${item.package?.yearly || 0}` },
        { key: 'status', label: 'Status', render: item => <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.user?.status ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>{item.user?.status ? 'Active' : 'Inactive'}</span> },
    ];
    const packageActions = item => [{ label: 'Edit custom package', icon: <FiEdit2 />, onClick: () => openEditModal(item) }, { label: 'Delete custom package', icon: <FiTrash2 />, className: 'text-rose-600 dark:text-rose-400', onClick: () => handleDeletePackage(item.custom_id) }];

    const filteredPackages = customPackages.filter(item => {
        if (filterStatus === 'all') return true;
        if (filterStatus === 'active') return item.user?.status === true;
        if (filterStatus === 'inactive') return item.user?.status === false;
        return true;
    });

    const stats = {
        total: pagination.total,
        active: customPackages.filter(p => p.user?.status === true).length,
        users: new Set(customPackages.map(p => p.user?.name)).size,
        totalDiscount: customPackages.reduce((sum, item) => {
            const monthlyDiscount = item.package?.monthly ? BASE_PACKAGE.monthly - item.package.monthly : 0;
            const yearlyDiscount = item.package?.yearly ? BASE_PACKAGE.yearly - item.package.yearly : 0;
            return sum + monthlyDiscount + yearlyDiscount;
        }, 0)
    };

    return (
        <div className="min-h-screen">
            <div className={`transition-all duration-300 ease-in-out`}>
                <div className="max-w-8xl mx-auto">

                    {/* Page Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20"><FiPackage className="text-white" size={24} /></div>
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Custom Packages</h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage user-specific custom pricing packages</p>
                            </div>
                        </div>
                        <button
                            onClick={openCreateModal}
                            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-sm font-medium shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:scale-[1.02] transition-all"
                        >
                            <FiPlus size={18} />
                            Create Custom Package
                        </button>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Packages</p>
                                    <h3 className="text-2xl font-bold dark:text-white">{stats.total}</h3>
                                </div>
                                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                    <FiPackage size={24} />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Active Users</p>
                                    <h3 className="text-2xl font-bold dark:text-white">{stats.active}</h3>
                                </div>
                                <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
                                    <FiUsers size={24} />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Unique Users</p>
                                    <h3 className="text-2xl font-bold dark:text-white">{stats.users}</h3>
                                </div>
                                <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                                    <FiUser size={24} />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Discount</p>
                                    <h3 className="text-2xl font-bold dark:text-white">
                                        ₹{stats.totalDiscount.toLocaleString('en-IN')}
                                    </h3>
                                </div>
                                <div className="p-3 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg">
                                    <FiPercent size={24} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notifications */}
                    <AnimatePresence>
                        {(error || success) && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg border mb-6 text-sm ${error
                                    ? 'bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-900/10 dark:border-rose-900/20 dark:text-rose-400'
                                    : 'bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-900/10 dark:border-emerald-900/20 dark:text-emerald-400'
                                    }`}
                            >
                                {error ? <FiAlertCircle size={16} /> : <FiCheckCircle size={16} />}
                                <span className="font-medium">{error || success}</span>
                                <button onClick={() => { }} className="ml-auto">
                                    <FiX size={16} />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Search & Filter Bar */}
                    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-5 mb-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by name, email, or mobile..."
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white transition-all"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setPagination(prev => ({ ...prev, page: 1 }));
                                    }}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <button
                                        onClick={() => setShowFilters(!showFilters)}
                                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                                    >
                                        <FiFilter size={16} />
                                        Filter
                                        <FiChevronDown size={14} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                                    </button>

                                    {showFilters && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setShowFilters(false)}></div>
                                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg z-50 py-1">
                                                {[
                                                    { value: 'all', label: 'All Users' },
                                                    { value: 'active', label: 'Active Users' },
                                                    { value: 'inactive', label: 'Inactive Users' }
                                                ].map(filter => (
                                                    <button
                                                        key={filter.value}
                                                        onClick={() => {
                                                            setFilterStatus(filter.value);
                                                            setShowFilters(false);
                                                        }}
                                                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${filterStatus === filter.value
                                                            ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
                                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                                            }`}
                                                    >
                                                        {filter.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                                <button
                                    onClick={fetchCustomPackages}
                                    className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"
                                    title="Refresh"
                                >
                                    <FiRefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : filteredPackages.length === 0 ? (
                            <div className="text-center py-20">
                                <FiPackage className="mx-auto text-gray-300 dark:text-gray-700 mb-3" size={48} />
                                <p className="text-gray-500 dark:text-gray-400 font-medium">No custom packages found</p>
                                <button
                                    onClick={openCreateModal}
                                    className="mt-4 text-indigo-600 dark:text-indigo-400 hover:underline"
                                >
                                    Create your first custom package
                                </button>
                            </div>
                        ) : (<><ManagementTable rows={filteredPackages} columns={packageColumns} rowKey="custom_id" getActions={packageActions} onRowClick={openEditModal} accent="indigo" />
                            <Pagination
                                currentPage={pagination.page}
                                totalItems={pagination.total}
                                itemsPerPage={pagination.limit}
                                onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
                                onLimitChange={(limit) => setPagination((prev) => ({ ...prev, limit, page: 1 }))}
                                className="mt-6"
                            />
                            <div className="hidden">
                                <>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                                                <tr>
                                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">User Details</th>
                                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contact</th>
                                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Monthly Package</th>
                                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Yearly Package</th>
                                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                                {filteredPackages.map((item) => {
                                                    const monthlyDiscount = calculateDiscount(item.package?.monthly, 'monthly');
                                                    const yearlyDiscount = calculateDiscount(item.package?.yearly, 'yearly');

                                                    return (
                                                        <tr key={item.custom_id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                                                                        {item.user?.name?.charAt(0) || 'U'}
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-medium text-gray-900 dark:text-white">{item.user?.name || 'N/A'}</div>
                                                                        <div className="text-xs text-gray-400 dark:text-gray-500 font-mono">{item.user?.username || 'N/A'}</div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="text-sm text-gray-600 dark:text-gray-400">{item.user?.email}</div>
                                                                <div className="text-xs text-gray-500 dark:text-gray-500">
                                                                    {item.user?.country_code} {item.user?.mobile}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="space-y-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-sm line-through text-gray-400">₹{BASE_PACKAGE.monthly}</span>
                                                                        <span className="font-semibold text-gray-900 dark:text-white">₹{item.package?.monthly || 0}</span>
                                                                    </div>
                                                                    {item.package?.monthly && (
                                                                        <div className="flex items-center gap-1 text-xs">
                                                                            <span className="text-green-600 dark:text-green-400">
                                                                                Save ₹{monthlyDiscount.discount}
                                                                            </span>
                                                                            <span className="text-gray-400">
                                                                                ({monthlyDiscount.discountPercent}% off)
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="space-y-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-sm line-through text-gray-400">₹{BASE_PACKAGE.yearly}</span>
                                                                        <span className="font-semibold text-gray-900 dark:text-white">₹{item.package?.yearly || 0}</span>
                                                                    </div>
                                                                    {item.package?.yearly && (
                                                                        <div className="flex items-center gap-1 text-xs">
                                                                            <span className="text-green-600 dark:text-green-400">
                                                                                Save ₹{yearlyDiscount.discount}
                                                                            </span>
                                                                            <span className="text-gray-400">
                                                                                ({yearlyDiscount.discountPercent}% off)
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                {item.user?.status ? (
                                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                                                                        Active
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400">
                                                                        Inactive
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <button
                                                                        onClick={() => openEditModal(item)}
                                                                        className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                                                                        title="Edit Package"
                                                                    >
                                                                        <FiEdit2 size={16} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeletePackage(item.custom_id)}
                                                                        className="p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-all"
                                                                        title="Delete Package"
                                                                    >
                                                                        <FiTrash2 size={16} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                </></div></>
                        )}
                    </div>
                </div>
            </div>

            {/* Create Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                        onClick={() => setShowCreateModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Create Custom Package</h2>
                                    <button
                                        onClick={() => setShowCreateModal(false)}
                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    >
                                        <FiX size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 space-y-4">
                                {/* User Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Select User
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search user..."
                                            className="w-full px-4 py-2 pr-10 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
                                            value={formData.userName || formData.username}
                                            onClick={() => setShowUserSearchModal(true)}
                                            readOnly
                                        />
                                        <FiUser className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    </div>
                                </div>

                                {/* Monthly Price */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Monthly Price (Base: ₹{BASE_PACKAGE.monthly})
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
                                        value={formData.monthly}
                                        onChange={(e) => setFormData({ ...formData, monthly: e.target.value })}
                                    />
                                    {formData.monthly && (
                                        <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                                            Save: ₹{BASE_PACKAGE.monthly - parseFloat(formData.monthly)}
                                            ({((BASE_PACKAGE.monthly - parseFloat(formData.monthly)) / BASE_PACKAGE.monthly * 100).toFixed(1)}% off)
                                        </p>
                                    )}
                                </div>

                                {/* Yearly Price */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Yearly Price (Base: ₹{BASE_PACKAGE.yearly})
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
                                        value={formData.yearly}
                                        onChange={(e) => setFormData({ ...formData, yearly: e.target.value })}
                                    />
                                    {formData.yearly && (
                                        <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                                            Save: ₹{BASE_PACKAGE.yearly - parseFloat(formData.yearly)}
                                            ({((BASE_PACKAGE.yearly - parseFloat(formData.yearly)) / BASE_PACKAGE.yearly * 100).toFixed(1)}% off)
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreatePackage}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-indigo-600/20"
                                >
                                    Create Package
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Edit Modal */}
            <AnimatePresence>
                {showEditModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                        onClick={() => setShowEditModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Custom Package</h2>
                                    <button
                                        onClick={() => {
                                            setShowEditModal(false);
                                            setSelectedPackage(null);
                                            resetForm();
                                        }}
                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    >
                                        <FiX size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">User: <span className="font-medium text-gray-900 dark:text-white">{formData.userName || formData.username}</span></p>
                                </div>

                                {/* Monthly Price */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Monthly Price (Base: ₹{BASE_PACKAGE.monthly})
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
                                        value={formData.monthly}
                                        onChange={(e) => setFormData({ ...formData, monthly: e.target.value })}
                                    />
                                </div>

                                {/* Yearly Price */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Yearly Price (Base: ₹{BASE_PACKAGE.yearly})
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
                                        value={formData.yearly}
                                        onChange={(e) => setFormData({ ...formData, yearly: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
                                <button
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setSelectedPackage(null);
                                        resetForm();
                                    }}
                                    className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdatePackage}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-indigo-600/20"
                                >
                                    Update Package
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* User Search Modal */}
            <AnimatePresence>
                {showUserSearchModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50"
                        onClick={() => {
                            setShowUserSearchModal(false);
                            setUserSearchTerm('');
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-gray-900 dark:text-white">Select User</h3>
                                    <button
                                        onClick={() => {
                                            setShowUserSearchModal(false);
                                            setUserSearchTerm('');
                                        }}
                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    >
                                        <FiX size={20} />
                                    </button>
                                </div>
                                <div className="relative">
                                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search by username, name, email..."
                                        className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
                                        value={userSearchTerm}
                                        onChange={(e) => setUserSearchTerm(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="overflow-y-auto max-h-96 p-2">
                                {loadingUsers ? (
                                    <div className="flex justify-center py-8">
                                        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                ) : users.length === 0 ? (
                                    <div className="text-center py-8">
                                        <FiUser className="mx-auto text-gray-300 dark:text-gray-700 mb-2" size={32} />
                                        <p className="text-gray-500 dark:text-gray-400">No users found</p>
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {users.map((user) => (
                                            <button
                                                key={user.username}
                                                onClick={() => selectUser(user)}
                                                className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                                                        {user.name?.charAt(0) || 'U'}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-gray-900 dark:text-white truncate">
                                                            {user.name || 'N/A'}
                                                        </p>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                                            {user.email}
                                                        </p>
                                                        <p className="text-xs text-gray-400 dark:text-gray-500">
                                                            {user.country_code} {user.mobile} • @{user.username}
                                                        </p>
                                                    </div>
                                                    {user.status === 1 && (
                                                        <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-1 rounded">
                                                            Active
                                                        </span>
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CustomPricing;
