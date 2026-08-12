import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FiSearch,
    FiCpu,
    FiActivity,
    FiToggleRight,
    FiPlus,
    FiEdit2,
    FiTrash2,
    FiEye,
    FiEyeOff,
    FiCopy,
    FiCheck,
    FiCheckCircle,
    FiXCircle,
    FiX,
    FiDatabase,
    FiAlertTriangle
} from 'react-icons/fi';
import { apiCall } from '../utils/apiCall';
import toast from 'react-hot-toast';
import Pagination from '../component/common/PaginationComponent';
import SelectField from '../component/common/SelectField';
import ManagementTable from '../component/common/ManagementTable';

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const maskKey = (key = '') => {
    if (!key) return '';
    if (key.length <= 8) return '•'.repeat(key.length);
    return `${key.slice(0, 4)}${'•'.repeat(Math.max(key.length - 8, 4))}${key.slice(-4)}`;
};

const isActiveValue = (val) => val === '1' || val === 1 || val === true;

const formatDate = (val) => {
    if (!val) return '—';
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

/* -------------------------------------------------------------------------- */
/*  Add / Edit Modal                                                           */
/* -------------------------------------------------------------------------- */

const ProviderFormModal = ({ isOpen, onClose, tokens, editingProvider, onSaved }) => {

    const isEdit = !!editingProvider;
    const [provider, setProvider] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [showKey, setShowKey] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setProvider(editingProvider?.provider || '');
            setApiKey(editingProvider?.api_key || '');
            setIsActive(editingProvider ? isActiveValue(editingProvider.is_active) : true);
            setShowKey(false);

        }
    }, [isOpen, editingProvider]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!provider.trim() || !apiKey.trim()) {
            toast.error('Provider and API key are required.');
            return;
        }
        setSaving(true);

        try {
            const payload = {
                provider: provider.trim(),
                api_key: apiKey.trim(),
                is_active: isActive ? '1' : '0'
            };
            const headers = {
                'x-token': tokens?.token,
                'username': tokens?.username
            };

            let response;
            if (isEdit) {
                response = await apiCall(
                    `/admin/ai-providers/${editingProvider.id}`,
                    'PUT',
                    payload,
                    headers,
                );
            } else {
                response = await apiCall(
                    '/admin/ai-providers',
                    'POST',
                    payload,
                    headers,
                );
            }
            const responseData = await response.json();

            if (response.ok && !responseData?.error) {
                onSaved();
                onClose();
            } else {
                toast.error(responseData?.message || responseData?.error || 'Something went wrong.');
            }
        } catch (err) {
            toast.error(err?.message || 'Server error. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
                onClick={saving ? undefined : onClose}
            />
            <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-indigo-500/5 to-indigo-600/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg shadow-lg shadow-indigo-500/20">
                            <FiCpu className="text-white" size={18} />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                            {isEdit ? 'Edit AI Provider' : 'Add AI Provider'}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                        <FiX size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                    {error && (
                        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
                            <FiAlertTriangle className="flex-shrink-0" size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-2">
                            Provider Name
                        </label>
                        <input
                            type="text"
                            value={provider}
                            onChange={(e) => setProvider(e.target.value)}
                            placeholder="e.g. OpenAI, Anthropic, Google Gemini"
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white text-sm transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-2">
                            API Key
                        </label>
                        <div className="relative">
                            <input
                                type={showKey ? 'text' : 'password'}
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="Paste the provider API key"
                                className="w-full pl-4 pr-11 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white text-sm font-mono transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowKey((s) => !s)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                {showKey ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                            </button>
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                            Keys are stored server-side and only ever shown to admins.
                        </p>
                    </div>

                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">Active</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Enable this provider for use immediately</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsActive((s) => !s)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isActive ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${isActive ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-sm font-medium shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 transition-all disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Provider'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

/* -------------------------------------------------------------------------- */
/*  Delete Confirmation Modal                                                  */
/* -------------------------------------------------------------------------- */

const DeleteConfirmModal = ({ isOpen, onClose, tokens, provider, onDeleted }) => {
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleDelete = async () => {
        setDeleting(true);

        try {
            const response = await apiCall(
                `/admin/ai-providers/${provider.id}`,
                'DELETE',
                null,
                {
                    'x-token': tokens?.token,
                    username: tokens?.username,
                },
            );
            const responseData = await response.json();
            if (response.ok && !responseData?.error) {
                onDeleted(provider.id);
                onClose();
            } else {
                toast.error(responseData?.message || responseData?.error || 'Failed to delete provider.');
            }
        } catch (err) {
            toast.error(err?.message || 'Server error. Please try again.');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
                onClick={deleting ? undefined : onClose}
            />
            <div className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
                <div className="px-6 py-6 text-center">
                    <div className="mx-auto mb-4 p-3 w-fit bg-red-50 dark:bg-red-900/30 rounded-full">
                        <FiTrash2 className="text-red-500 dark:text-red-400" size={22} />
                    </div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">
                        Delete "{provider?.provider}"?
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        This will permanently remove this API key. Any features relying on it will stop working.
                    </p>

                </div>
                <div className="flex items-center gap-3 px-6 pb-6">
                    <button
                        onClick={onClose}
                        disabled={deleting}
                        className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white text-sm font-medium shadow-lg shadow-red-500/20 hover:shadow-xl transition-all disabled:opacity-50"
                    >
                        {deleting ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
};

/* -------------------------------------------------------------------------- */
/*  Main Page                                                                  */
/* -------------------------------------------------------------------------- */

const AiProviders = () => {
    const navigate = useNavigate();
    const [isMinimized, setIsMinimized] = useState(() => {
        const saved = localStorage.getItem('sidebarMinimized');
        return saved ? JSON.parse(saved) : false;
    });

    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, total_pages: 1 });
    const [tokens, setTokens] = useState(null);
    const [error, setError] = useState('');

    const [revealedKeys, setRevealedKeys] = useState({});
    const [copiedId, setCopiedId] = useState(null);

    const [formModalOpen, setFormModalOpen] = useState(false);
    const [editingProvider, setEditingProvider] = useState(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deletingProvider, setDeletingProvider] = useState(null);

    useEffect(() => {
        const data = localStorage.getItem('user_data') || localStorage.getItem('userData') || sessionStorage.getItem('userData');
        if (data) {
            setTokens(JSON.parse(data));
        } else {
            navigate('/login');
        }
    }, [navigate]);

    const fetchProviders = useCallback(async () => {
        if (!tokens?.token) return;
        setLoading(true);

        try {
            const params = new URLSearchParams({ page: String(pagination.page), limit: String(pagination.limit) });
            if (searchTerm) params.set('search', searchTerm);
            if (statusFilter !== 'all') params.set('is_active', statusFilter === 'active' ? '1' : '0');
            const response = await apiCall(`/admin/ai-providers?${params}`, 'GET', null, {
                'x-token': tokens.token,
                username: tokens.username,
            });
            const responseData = await response.json();

            if (response.ok && !responseData?.error) {
                setProviders(responseData.data || []);
                setPagination(current => ({ ...current, ...(responseData.pagination || {}) }));
            } else {
                toast.error(responseData?.message || responseData?.error || 'Failed to fetch AI providers');
            }
        } catch (err) {
            toast.error('Authorization failed or server error');
        } finally {
            setLoading(false);
        }
    }, [pagination.limit, pagination.page, searchTerm, statusFilter, tokens]);

    useEffect(() => {
        fetchProviders();
    }, [fetchProviders]);

    const filteredProviders = providers;

    const totalProviders = providers.length;
    const activeProviders = providers.filter((p) => isActiveValue(p.is_active)).length;
    const distinctProviders = new Set(providers.map((p) => (p.provider || '').toLowerCase())).size;

    const clearFilters = () => {
        setPagination(current => ({ ...current, page: 1 }));
        setSearchTerm('');
        setStatusFilter('all');
    };

    const providerColumns = [
        { key: 'provider', label: 'Provider', render: provider => <div><p className="font-semibold text-gray-900 dark:text-white">{provider.provider}</p><p className="text-xs text-gray-500">ID: {provider.id}</p></div> },
        { key: 'api_key', label: 'API Key', render: provider => <div className="flex items-center gap-2"><code className="text-xs font-mono">{revealedKeys[provider.id] ? provider.api_key : maskKey(provider.api_key)}</code><button type="button" onClick={() => toggleReveal(provider.id)} className="text-gray-400 hover:text-indigo-600">{revealedKeys[provider.id] ? <FiEyeOff /> : <FiEye />}</button><button type="button" onClick={() => handleCopy(provider.id, provider.api_key)} className="text-gray-400 hover:text-indigo-600">{copiedId === provider.id ? <FiCheck className="text-green-500" /> : <FiCopy />}</button></div> },
        { key: 'is_active', label: 'Status', render: provider => <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${isActiveValue(provider.is_active) ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>{isActiveValue(provider.is_active) ? 'Active' : 'Inactive'}</span> },
        { key: 'create_date', label: 'Created', render: provider => formatDate(provider.create_date) },
        { key: 'modify_date', label: 'Updated', render: provider => formatDate(provider.modify_date) },
    ];
    const providerActions = provider => [{ label: 'Edit provider', icon: <FiEdit2 />, onClick: () => openEditModal(provider) }, { label: 'Delete provider', icon: <FiTrash2 />, className: 'text-rose-600 dark:text-rose-400', onClick: () => openDeleteModal(provider) }];

    const toggleReveal = (id) => {
        setRevealedKeys((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const handleCopy = async (id, key) => {
        try {
            await navigator.clipboard.writeText(key);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 1500);
        } catch (err) {
            // clipboard unavailable, ignore silently
        }
    };

    const openAddModal = () => {
        setEditingProvider(null);
        setFormModalOpen(true);
    };

    const openEditModal = (provider) => {
        setEditingProvider(provider);
        setFormModalOpen(true);
    };

    const openDeleteModal = (provider) => {
        setDeletingProvider(provider);
        setDeleteModalOpen(true);
    };

    const handleDeleted = (id) => {
        setProviders((prev) => prev.filter((p) => p.id !== id));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <div className={`transition-all duration-300 ease-in-out `}>
                <div className="max-w-8xl mx-auto px-4 sm:px-6 md:px-8 py-8">
                    {/* Page Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20">
                                <FiCpu className="text-white" size={24} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                                    AI Providers
                                </h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Manage global AI API keys used across the platform
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={openAddModal}
                            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-sm font-medium shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 hover:scale-[1.02] transition-all duration-200"
                        >
                            <FiPlus size={16} />
                            Add Provider
                        </button>
                    </div>

                    {/* Stats Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Keys</p>
                                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{totalProviders}</h3>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">All time</p>
                                </div>
                                <div className="p-4 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/20">
                                    <FiDatabase className="text-white" size={24} />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Active Keys</p>
                                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{activeProviders}</h3>
                                    <p className="text-xs text-green-500 dark:text-green-400 mt-1">{((activeProviders / totalProviders) * 100 || 0).toFixed(1)}% of total</p>
                                </div>
                                <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg shadow-green-500/20">
                                    <FiActivity className="text-white" size={24} />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Distinct Providers</p>
                                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{distinctProviders}</h3>
                                    <p className="text-xs text-emerald-500 dark:text-emerald-400 mt-1">Unique provider names</p>
                                </div>
                                <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg shadow-emerald-500/20">
                                    <FiToggleRight className="text-white" size={24} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Search and Filters */}
                    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-5 mb-6">
                        <div className="flex flex-col gap-4">
                            <div className="relative flex-1">
                                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search by provider name or ID..."
                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white transition-all"
                                    value={searchTerm}
                                    onChange={(e) => { setPagination(p => ({ ...p, page: 1 })); setSearchTerm(e.target.value); }}
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                                <SelectField options={[{ value: 'all', label: 'All Status' }, { value: 'active', label: 'Active Only' }, { value: 'inactive', label: 'Inactive Only' }]} value={[{ value: 'all', label: 'All Status' }, { value: 'active', label: 'Active Only' }, { value: 'inactive', label: 'Inactive Only' }].find(option => option.value === statusFilter)} onChange={option => { setPagination(p => ({ ...p, page: 1 })); setStatusFilter(option.value); }} isSearchable={false} />

                                {(statusFilter !== 'all' || searchTerm) && (
                                    <button
                                        onClick={clearFilters}
                                        className="px-4 py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors"
                                    >
                                        Clear Filters
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 px-6 py-4 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                            <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
                                <FiXCircle className="flex-shrink-0" size={16} />
                                <span>{error}</span>
                            </div>
                        </div>
                    )}

                    {/* Table */}
                    <div className="w-full overflow-x-auto">
                        {!loading && <ManagementTable rows={filteredProviders} columns={providerColumns} rowKey="id" getActions={providerActions} onRowClick={openEditModal} accent="indigo" emptyState={<div className="py-20 text-center text-gray-500 dark:text-gray-400">No AI providers found.</div>} />}
                        <div className={loading ? '' : 'hidden'}>
                        <table className="w-full text-center border-separate border-spacing-0">
                            <thead className="bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900">
                                <tr>
                                    <th className="px-6 py-5 text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider border-b-2 border-gray-200 dark:border-gray-700 rounded-tl-2xl">
                                        Provider
                                    </th>
                                    <th className="px-6 py-5 text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider border-b-2 border-gray-200 dark:border-gray-700">
                                        API Key
                                    </th>
                                    <th className="px-6 py-5 text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider border-b-2 border-gray-200 dark:border-gray-700">
                                        Status
                                    </th>
                                    <th className="px-6 py-5 text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider border-b-2 border-gray-200 dark:border-gray-700">
                                        Created
                                    </th>
                                    <th className="px-6 py-5 text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider border-b-2 border-gray-200 dark:border-gray-700">
                                        Updated
                                    </th>
                                    <th className="px-6 py-5 text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider border-b-2 border-gray-200 dark:border-gray-700 rounded-tr-2xl">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800">
                                {loading ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i} className="animate-pulse border-b border-gray-100 dark:border-gray-700">
                                            <td className="px-6 py-5" colSpan="6">
                                                <div className="flex items-center justify-center space-x-4">
                                                    <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                                                    <div className="flex-1 space-y-3">
                                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto"></div>
                                                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto"></div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : filteredProviders.length > 0 ? (
                                    filteredProviders.map((p, index) => {
                                        const active = isActiveValue(p.is_active);
                                        const isLast = index === filteredProviders.length - 1;
                                        const revealed = !!revealedKeys[p.id];

                                        return (
                                            <tr
                                                key={p.id}
                                                className={`hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-blue-50/50 dark:hover:from-indigo-900/20 dark:hover:to-blue-900/20 transition-all duration-200 border-b border-gray-100 dark:border-gray-700 ${isLast ? 'border-b-0' : ''
                                                    }`}
                                            >
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center justify-center">
                                                        <div className="flex items-center">
                                                            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-indigo-500/20">
                                                                {p.provider?.charAt(0)?.toUpperCase() || 'A'}
                                                            </div>
                                                            <div className="ml-4 text-left">
                                                                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                                                    {p.provider}
                                                                </div>
                                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                    ID: {p.id}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <code className="px-3 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-mono text-gray-700 dark:text-gray-300 min-w-[160px] inline-block">
                                                            {revealed ? p.api_key : maskKey(p.api_key)}
                                                        </code>
                                                        <button
                                                            onClick={() => toggleReveal(p.id)}
                                                            title={revealed ? 'Hide key' : 'Reveal key'}
                                                            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                        >
                                                            {revealed ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                                                        </button>
                                                        <button
                                                            onClick={() => handleCopy(p.id, p.api_key)}
                                                            title="Copy key"
                                                            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                        >
                                                            {copiedId === p.id ? (
                                                                <FiCheck size={14} className="text-green-500" />
                                                            ) : (
                                                                <FiCopy size={14} />
                                                            )}
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center justify-center">
                                                        {active ? (
                                                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-200 dark:border-green-800">
                                                                <FiCheckCircle className="text-green-500 dark:text-green-400" size={14} />
                                                                <span className="text-xs font-semibold text-green-700 dark:text-green-400">Active</span>
                                                            </div>
                                                        ) : (
                                                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-red-500/10 to-rose-500/10 border border-red-200 dark:border-red-800">
                                                                <FiXCircle className="text-red-500 dark:text-red-400" size={14} />
                                                                <span className="text-xs font-semibold text-red-700 dark:text-red-400">Inactive</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        {formatDate(p.create_date)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        {formatDate(p.modify_date)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => openEditModal(p)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-xs font-medium shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:scale-105 transition-all duration-200"
                                                        >
                                                            <FiEdit2 size={13} />
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => openDeleteModal(p)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-red-500 to-rose-600 text-white text-xs font-medium shadow-lg shadow-red-500/20 hover:shadow-xl hover:scale-105 transition-all duration-200"
                                                        >
                                                            <FiTrash2 size={13} />
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-20 text-center border-b border-gray-100 dark:border-gray-700">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                                                    <FiCpu className="text-gray-400 dark:text-gray-500" size={32} />
                                                </div>
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                                    No AI providers found
                                                </h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                                    {providers.length === 0
                                                        ? 'Add your first AI provider key to get started.'
                                                        : 'No providers match your search criteria.'}
                                                </p>
                                                <button
                                                    onClick={providers.length === 0 ? openAddModal : clearFilters}
                                                    className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors"
                                                >
                                                    {providers.length === 0 ? 'Add Provider' : 'Clear All Filters'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>

                            {filteredProviders.length > 0 && (
                                <tfoot>
                                    <tr>
                                        <td colSpan="6" className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-t-2 border-gray-200 dark:border-gray-700 rounded-b-2xl">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                                    Showing <span className="font-semibold">{filteredProviders.length}</span> of <span className="font-semibold">{totalProviders}</span> providers
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {activeProviders} active
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                        </div>
                    </div>

                    <Pagination currentPage={pagination.page} totalItems={pagination.total || providers.length} itemsPerPage={pagination.limit} onPageChange={page => setPagination(p => ({ ...p, page }))} onLimitChange={limit => setPagination(p => ({ ...p, limit, page: 1 }))} className="mt-4" />

                    <ProviderFormModal
                        isOpen={formModalOpen}
                        onClose={() => setFormModalOpen(false)}
                        tokens={tokens}
                        editingProvider={editingProvider}
                        onSaved={fetchProviders}
                    />

                    <DeleteConfirmModal
                        isOpen={deleteModalOpen}
                        onClose={() => setDeleteModalOpen(false)}
                        tokens={tokens}
                        provider={deletingProvider}
                        onDeleted={handleDeleted}
                    />
                </div>
            </div>
        </div>
    );
};

export default AiProviders;
