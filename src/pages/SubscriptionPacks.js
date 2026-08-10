import React, { useState, useEffect, useCallback } from 'react';
import { Header, Sidebar } from '../component/Menu';
import { useNavigate } from 'react-router-dom';
import {
    FiSearch, FiPlus, FiEdit2, FiTrash2, FiPackage, FiDollarSign,
    FiCheckCircle, FiAlertCircle, FiRefreshCw, FiSave, FiX
} from 'react-icons/fi';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { Encrypt } from './encryption/payload-encryption';
import { API_BASE_URL } from '../config/api';

const SubscriptionPacks = () => {
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(() => {
        const saved = localStorage.getItem('sidebarMinimized');
        return saved ? JSON.parse(saved) : false;
    });

    const [packs, setPacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [tokens, setTokens] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingPack, setEditingPack] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        pack_name: '',
        pack_type: 'addon',
        amount: '',
        description: '',
        billing_cycle: 'monthly',
        features: '',
        is_active: '1'
    });

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

    const fetchPacks = useCallback(async () => {
        if (!tokens?.token) return;
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/admin/subscription/all-packs`, {
                headers: { 'x-token': tokens.token }
            });

            if (!response.data.error) {
                setPacks(response.data.data || []);
            }
        } catch (err) {
            console.error("Failed to fetch packs", err);
            setError('Failed to fetch subscription packs');
        } finally {
            setLoading(false);
        }
    }, [tokens]);

    useEffect(() => {
        if (tokens?.token) {
            fetchPacks();
        }
    }, [fetchPacks, tokens]);

    const filteredPacks = packs.filter(pack =>
        pack.pack_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pack.pack_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pack.pack_type?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleOpenModal = (pack = null) => {
        if (pack) {
            setEditingPack(pack);
            setFormData({
                pack_name: pack.pack_name || '',
                pack_type: pack.pack_type || 'addon',
                amount: pack.amount || '',
                description: pack.description || '',
                billing_cycle: pack.billing_cycle || 'monthly',
                features: Array.isArray(pack.features) ? pack.features.join(', ') : 
                         (typeof pack.features === 'string' ? 
                          (pack.features.startsWith('[') ? JSON.parse(pack.features).join(', ') : pack.features) : ''),
                is_active: pack.is_active?.toString() || '1'
            });
        } else {
            setEditingPack(null);
            setFormData({
                pack_name: '',
                pack_type: 'addon',
                amount: '',
                description: '',
                billing_cycle: 'monthly',
                features: '',
                is_active: '1'
            });
        }
        setShowModal(true);
        setError('');
        setSuccess('');
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingPack(null);
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!tokens?.token) return;

        setError('');
        setSuccess('');

        try {
            const featuresArray = formData.features.split(',').map(f => f.trim()).filter(f => f);
            
            const payload = {
                pack_name: formData.pack_name,
                pack_type: formData.pack_type,
                amount: parseFloat(formData.amount),
                description: formData.description,
                billing_cycle: formData.billing_cycle,
                features: JSON.stringify(featuresArray),
                is_active: formData.is_active
            };

            // Add pack_id for update operations
            if (editingPack) {
                payload.pack_id = editingPack.pack_id;
            }

            // Encrypt the payload
            const { data, key } = Encrypt(payload);

            let response;
            if (editingPack) {
                // Update existing pack
                response = await axios.post(
                    `${API_BASE_URL}/admin/subscription/update-pack`,
                    { data, key },
                    {
                        headers: {
                            'x-token': tokens.token,
                            'Content-Type': 'application/json'
                        }
                    }
                );
            } else {
                // Create new pack
                response = await axios.post(
                    `${API_BASE_URL}/admin/subscription/create-pack`,
                    { data, key },
                    {
                        headers: {
                            'x-token': tokens.token,
                            'Content-Type': 'application/json'
                        }
                    }
                );
            }

            if (response.data?.error) {
                setError(typeof response.data.error === 'string' ? response.data.error : (response.data.message || 'Operation failed'));
            } else {
                setSuccess(editingPack ? 'Pack updated successfully!' : 'Pack created successfully!');
                setTimeout(() => {
                    handleCloseModal();
                    fetchPacks();
                }, 1500);
            }
        } catch (err) {
            const errorMsg = err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Operation failed';
            setError(typeof errorMsg === 'string' ? errorMsg : 'Operation failed');
        }
    };

    const handleDelete = async (packId) => {
        if (!window.confirm('Are you sure you want to delete this pack?')) return;
        if (!tokens?.token) return;

        setError('');
        setSuccess('');

        try {
            const payload = {
                pack_id: packId
            };

            // Encrypt the payload
            const { data, key } = Encrypt(payload);

            const response = await axios.post(
                `${API_BASE_URL}/admin/subscription/delete-pack`,
                { data, key },
                {
                    headers: {
                        'x-token': tokens.token,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data?.error) {
                setError(typeof response.data.error === 'string' ? response.data.error : (response.data.message || 'Delete failed'));
            } else {
                setSuccess('Pack deleted successfully!');
                setTimeout(() => {
                    setSuccess('');
                    fetchPacks();
                }, 2000);
            }
        } catch (err) {
            const errorMsg = err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Delete failed';
            setError(typeof errorMsg === 'string' ? errorMsg : 'Delete failed');
        }
    };

    const formatCurrency = (amount) => {
        if (!amount) return '₹0';
        return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
    };

    const parseFeatures = (featuresString) => {
        if (!featuresString) return [];
        try {
            if (typeof featuresString === 'string') {
                return JSON.parse(featuresString);
            }
            return Array.isArray(featuresString) ? featuresString : [];
        } catch {
            return [];
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

            <div className={`pt-16 transition-all duration-300 ease-in-out ${isMinimized ? 'md:pl-20' : 'md:pl-72'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8">
                    
                    {/* Page Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subscription Packs</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Manage subscription plans and pricing</p>
                        </div>
                        <button
                            onClick={() => handleOpenModal()}
                            className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-all shadow-sm"
                        >
                            <FiPlus className="mr-2" /> Create Pack
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Packs</p>
                                    <h3 className="text-2xl font-bold dark:text-white">{packs.length}</h3>
                                </div>
                                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                    <FiPackage size={24} />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Active Packs</p>
                                    <h3 className="text-2xl font-bold dark:text-white">{packs.filter(p => p.is_active === '1').length}</h3>
                                </div>
                                <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
                                    <FiCheckCircle size={24} />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Platform Packs</p>
                                    <h3 className="text-2xl font-bold dark:text-white">{packs.filter(p => p.pack_type === 'platform').length}</h3>
                                </div>
                                <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                                    <FiDollarSign size={24} />
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
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg border mb-6 text-sm ${
                                    error
                                        ? 'bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-900/10 dark:border-rose-900/20 dark:text-rose-400'
                                        : 'bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-900/10 dark:border-emerald-900/20 dark:text-emerald-400'
                                }`}
                            >
                                {error ? <FiAlertCircle size={16} /> : <FiCheckCircle size={16} />}
                                <span className="font-medium">{error || success}</span>
                                <button onClick={() => { setError(''); setSuccess(''); }} className="ml-auto">
                                    <FiX size={16} />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Search Bar */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-6">
                        <div className="flex items-center gap-4">
                            <div className="relative flex-1">
                                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search packs by name, ID or type..."
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={fetchPacks}
                                className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"
                            >
                                <FiRefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                            </button>
                        </div>
                    </div>

                    {/* Packs Grid */}
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : filteredPacks.length === 0 ? (
                        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                            <FiPackage className="mx-auto text-gray-300 dark:text-gray-700 mb-3" size={48} />
                            <p className="text-gray-500 dark:text-gray-400 font-medium">No subscription packs found</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredPacks.map((pack) => {
                                const features = parseFeatures(pack.features);
                                const isActive = pack.is_active === '1' || pack.is_active === 1;
                                const isPlatform = pack.pack_type === 'platform';

                                return (
                                    <div
                                        key={pack.pack_id}
                                        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all overflow-hidden"
                                    >
                                        <div className="p-6">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                                                            {pack.pack_name}
                                                        </h3>
                                                        {isActive ? (
                                                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 uppercase">
                                                                Active
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400 uppercase">
                                                                Inactive
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                        <span className={`px-2 py-1 rounded font-medium ${
                                                            isPlatform 
                                                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                        }`}>
                                                            {pack.pack_type}
                                                        </span>
                                                        <span className="font-mono">{pack.pack_id}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mb-4">
                                                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                                                    {formatCurrency(pack.amount)}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    per {pack.billing_cycle || 'month'}
                                                </div>
                                            </div>

                                            {pack.description && (
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                                                    {pack.description}
                                                </p>
                                            )}

                                            {features.length > 0 && (
                                                <div className="mb-4">
                                                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                                                        Features
                                                    </div>
                                                    <div className="space-y-1">
                                                        {features.slice(0, 3).map((feature, idx) => (
                                                            <div key={idx} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                                <FiCheckCircle size={12} className="text-green-500 flex-shrink-0" />
                                                                <span className="truncate">{feature}</span>
                                                            </div>
                                                        ))}
                                                        {features.length > 3 && (
                                                            <div className="text-xs text-gray-400">
                                                                +{features.length - 3} more
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                                                <button
                                                    onClick={() => handleOpenModal(pack)}
                                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"
                                                >
                                                    <FiEdit2 size={14} />
                                                    Edit
                                                </button>
                                                {!isPlatform && (
                                                    <button
                                                        onClick={() => handleDelete(pack.pack_id)}
                                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-all"
                                                    >
                                                        <FiTrash2 size={14} />
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Create/Edit Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
                        onClick={handleCloseModal}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {editingPack ? 'Edit Pack' : 'Create New Pack'}
                                </h2>
                                <button
                                    onClick={handleCloseModal}
                                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all"
                                >
                                    <FiX size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[calc(90vh-120px)] overflow-y-auto">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Pack Name *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.pack_name}
                                            onChange={(e) => setFormData({ ...formData, pack_name: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                            placeholder="e.g., Premium Pack"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Pack Type *
                                        </label>
                                        <select
                                            required
                                            value={formData.pack_type}
                                            onChange={(e) => setFormData({ ...formData, pack_type: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                        >
                                            <option value="addon">Add-on</option>
                                            <option value="platform">Platform</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Amount (₹) *
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            step="0.01"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                            placeholder="0.00"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Billing Cycle *
                                        </label>
                                        <select
                                            required
                                            value={formData.billing_cycle}
                                            onChange={(e) => setFormData({ ...formData, billing_cycle: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                        >
                                            <option value="monthly">Monthly</option>
                                            <option value="yearly">Yearly</option>
                                            <option value="quarterly">Quarterly</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        rows="3"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                        placeholder="Brief description of the pack"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Features (comma-separated)
                                    </label>
                                    <textarea
                                        rows="3"
                                        value={formData.features}
                                        onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                        placeholder="Feature 1, Feature 2, Feature 3"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Status
                                    </label>
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, is_active: '1' })}
                                            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium border transition-all ${
                                                formData.is_active === '1'
                                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400'
                                                    : 'bg-white border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400'
                                            }`}
                                        >
                                            Active
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, is_active: '0' })}
                                            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium border transition-all ${
                                                formData.is_active === '0'
                                                    ? 'bg-gray-50 border-gray-200 text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400'
                                                    : 'bg-white border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400'
                                            }`}
                                        >
                                            Inactive
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-all"
                                    >
                                        <FiSave size={16} />
                                        {editingPack ? 'Update Pack' : 'Create Pack'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SubscriptionPacks;
