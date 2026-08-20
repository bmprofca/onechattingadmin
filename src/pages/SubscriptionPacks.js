import React, { useCallback, useEffect, useState } from 'react';
import { FiDollarSign, FiEdit2, FiPackage, FiPlus, FiRefreshCw, FiSave, FiSearch, FiTrash2, FiX } from 'react-icons/fi';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiCall } from '../utils/apiCall';
import Pagination from '../component/common/PaginationComponent';
import SelectField from '../component/common/SelectField';
import ManagementTable from '../component/common/ManagementTable';
import ActionCard from '../component/common/ActionCard';

const initialForm = { package_id: '', name: '', amount: '', validity: '1m' };

const SubscriptionPacks = () => {
    const navigate = useNavigate();
    const [tokens, setTokens] = useState(null);
    const [packs, setPacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ package_id: '', name: '', validity: '', min_amount: '', max_amount: '' });
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, total_pages: 1 });
    const [showModal, setShowModal] = useState(false);
    const [editingPack, setEditingPack] = useState(null);
    const [formData, setFormData] = useState(initialForm);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('user_data') || localStorage.getItem('userData') || sessionStorage.getItem('userData');
        if (!stored) return navigate('/login');
        try { setTokens(JSON.parse(stored)); } catch { navigate('/login'); }
    }, [navigate]);

    const headers = useCallback(() => ({ 'x-auth-token': tokens?.token, 'x-token': tokens?.token }), [tokens]);

    const fetchPacks = useCallback(async () => {
        if (!tokens?.token) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(pagination.page), limit: String(pagination.limit) });
            if (searchTerm) params.set('search', searchTerm);
            Object.entries(filters).forEach(([key, value]) => value !== '' && params.set(key, value));
            const response = await apiCall(`/subscription/packages?${params}`, 'GET', null, headers());
            const result = await response.json();
            if (!response.ok || result?.error) throw new Error(result?.message || result?.error || 'Failed to fetch packages');
            setPacks(Array.isArray(result.data) ? result.data : []);
            setPagination(current => ({ ...current, ...(result.pagination || {}) }));
        } catch (error) {
            toast.error(error.message || 'Failed to fetch packages');
        } finally { setLoading(false); }
    }, [filters, headers, pagination.limit, pagination.page, searchTerm, tokens]);

    useEffect(() => { fetchPacks(); }, [fetchPacks]);

    const openModal = (pack = null) => {
        setEditingPack(pack);
        setFormData(pack ? { package_id: pack.package_id, name: pack.name || '', amount: pack.amount ?? '', validity: pack.validity || '1m' } : initialForm);
        setShowModal(true);
    };
    const closeModal = () => { if (!saving) { setShowModal(false); setEditingPack(null); } };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const payload = { name: formData.name.trim(), amount: Number(formData.amount), validity: formData.validity };
        if (!editingPack) payload.package_id = formData.package_id.trim();
        setSaving(true);
        try {
            const endpoint = editingPack ? `/subscription/packages/${encodeURIComponent(editingPack.package_id)}` : '/subscription/packages';
            const response = await apiCall(endpoint, editingPack ? 'PATCH' : 'POST', payload, headers());
            const result = await response.json();
            if (!response.ok || result?.error) throw new Error(result?.message || result?.error || 'Unable to save package');
            toast.success(result.message || (editingPack ? 'Package updated successfully.' : 'Package created successfully.'));
            setShowModal(false); setEditingPack(null); await fetchPacks();
        } catch (error) { toast.error(error.message || 'Unable to save package'); }
        finally { setSaving(false); }
    };

    const handleDelete = async (packageId) => {
        if (!window.confirm('Are you sure you want to delete this package?')) return;
        try {
            const response = await apiCall(`/subscription/packages/${encodeURIComponent(packageId)}`, 'DELETE', null, headers());
            const result = await response.json();
            if (!response.ok || result?.error) throw new Error(result?.message || result?.error || 'Unable to delete package');
            toast.success(result.message || 'Package deleted successfully.');
            await fetchPacks();
        } catch (error) { toast.error(error.message || 'Unable to delete package'); }
    };

    const updateFilter = (key, value) => { setPagination(current => ({ ...current, page: 1 })); setFilters(current => ({ ...current, [key]: value })); };
    const packageColumns = [
        { key: 'package_id', label: 'Package ID', render: pack => <span className="font-mono text-xs">{pack.package_id}</span> },
        { key: 'name', label: 'Name', render: pack => <span className="font-semibold text-gray-900 dark:text-white">{pack.name}</span> },
        { key: 'amount', label: 'Amount', render: pack => `₹${Number(pack.amount || 0).toLocaleString('en-IN')}` },
        { key: 'validity', label: 'Validity', render: pack => <span className="rounded-full bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300">{pack.validity}</span> },
    ];
    const packageActions = pack => [{ label: 'Edit package', icon: <FiEdit2 />, onClick: () => openModal(pack) }, { label: 'Delete package', icon: <FiTrash2 />, className: 'text-rose-600 dark:text-rose-400', onClick: () => handleDelete(pack.package_id) }];
    const formatCurrency = amount => `₹${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return <div className="min-h-screen">
        <div className="max-w-8xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-3"><div className="p-2 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg shadow-lg shadow-indigo-500/20"><FiPackage className="text-white" size={24} /></div><div><h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Subscription Packages</h1><p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage subscription plans and pricing</p></div></div>
                <div className="flex items-center gap-2">
                    <button onClick={fetchPacks} title="Refresh packages" className="p-2 text-gray-400 hover:text-indigo-600"><FiRefreshCw size={20} className={loading ? 'animate-spin' : ''} />Refresh</button>
                    <button onClick={() => openModal()} className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-sm font-medium shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:scale-[1.02] transition-all"><FiPlus size={16} /> Create Package</button>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Stat label="Total Packages" value={packs.length} icon={<FiPackage size={24} />} color="indigo" />
                <Stat label="Starting Price" value={packs.length ? formatCurrency(Math.min(...packs.map(p => Number(p.amount) || 0))) : '—'} icon={<FiDollarSign size={24} />} color="green" />
                <Stat label="Max Price" value={packs.length ? formatCurrency(Math.max(...packs.map(p => Number(p.amount) || 0))) : '—'} icon={<FiDollarSign size={24} />} color="green" />
            </div>
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-2 mb-2 flex gap-4">
                <div className="relative flex-1 max-w-[600px]"><FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input value={searchTerm} onChange={e => { setPagination(p => ({ ...p, page: 1 })); setSearchTerm(e.target.value); }} placeholder="Search by name, package ID or validity..." className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg dark:text-white" /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
                <input value={filters.package_id} onChange={e => updateFilter('package_id', e.target.value)} placeholder="Exact package ID" className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:text-white" />
                <input value={filters.name} onChange={e => updateFilter('name', e.target.value)} placeholder="Exact package name" className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:text-white" />
                <input value={filters.validity} onChange={e => updateFilter('validity', e.target.value)} placeholder="Exact validity" className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:text-white" />
                <input type="number" value={filters.min_amount} onChange={e => updateFilter('min_amount', e.target.value)} placeholder="Minimum amount" className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:text-white" />
                <input type="number" value={filters.max_amount} onChange={e => updateFilter('max_amount', e.target.value)} placeholder="Maximum amount" className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:text-white" />
            </div>
            {loading ? <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
                : !packs.length ? <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-lg border border-dashed border-gray-200"><FiPackage className="mx-auto text-gray-300 mb-3" size={48} /><p className="text-gray-500">No subscription packages found</p></div>
                    : <><ManagementTable rows={packs} columns={packageColumns} rowKey="package_id" getActions={packageActions} onRowClick={openModal} accent="indigo" /><div className="hidden grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{packs.map(pack => <div key={pack.package_id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6">
                        <div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-lg text-gray-900 dark:text-white">{pack.name}</h3><span className="font-mono text-xs text-gray-500">{pack.package_id}</span></div><span className="px-2 py-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 rounded text-xs font-medium">{pack.validity}</span></div>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white mt-6">{formatCurrency(pack.amount)}</div><p className="text-xs text-gray-500 mt-1">Validity: {pack.validity}</p>
                        <div className="flex gap-2 pt-4 mt-4 border-t border-gray-100 dark:border-gray-700"><button onClick={() => openModal(pack)} className="flex-1 flex justify-center items-center gap-2 p-2 text-sm text-indigo-600"><FiEdit2 size={14} />Edit</button><button onClick={() => handleDelete(pack.package_id)} className="flex-1 flex justify-center items-center gap-2 p-2 text-sm text-rose-600"><FiTrash2 size={14} />Delete</button></div>
                    </div>)}</div></>}
            <Pagination currentPage={pagination.page} totalItems={pagination.total || packs.length} itemsPerPage={pagination.limit} onPageChange={page => setPagination(p => ({ ...p, page }))} onLimitChange={limit => setPagination(p => ({ ...p, limit, page: 1 }))} className="mt-6" />
        </div>
        <AnimatePresence>{showModal && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeModal} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"><motion.div initial={{ scale: .95 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()} className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-800"><h2 className="font-semibold text-lg dark:text-white">{editingPack ? 'Edit Package' : 'Create Package'}</h2><button onClick={closeModal} className="p-2 text-gray-400"><FiX size={20} /></button></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4"><Field label="Package ID *"><input required disabled={Boolean(editingPack)} value={formData.package_id} onChange={e => setFormData({ ...formData, package_id: e.target.value })} placeholder="e.g., PROJECT_1M" className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-white disabled:opacity-60" /></Field><Field label="Package Name *"><input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Monthly" className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-white" /></Field><div className="grid grid-cols-2 gap-4"><Field label="Amount (₹) *"><input required min="0" step="0.01" type="number" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-white" /></Field><Field label="Validity *"><SelectField options={[{ value: '1m', label: '1 month' }, { value: '3m', label: '3 months' }, { value: '6m', label: '6 months' }, { value: '1y', label: '1 year' }]} value={[{ value: '1m', label: '1 month' }, { value: '3m', label: '3 months' }, { value: '6m', label: '6 months' }, { value: '1y', label: '1 year' }].find(option => option.value === formData.validity)} onChange={option => setFormData({ ...formData, validity: option.value })} isSearchable={false} /></Field></div><div className="flex gap-3 pt-3"><button type="button" onClick={closeModal} className="flex-1 p-2 border rounded-lg dark:text-gray-300">Cancel</button><button disabled={saving} className="flex-1 flex justify-center items-center gap-2 p-2 bg-indigo-600 text-white rounded-lg disabled:opacity-60"><FiSave size={16} />{saving ? 'Saving...' : editingPack ? 'Update Package' : 'Create Package'}</button></div></form>
        </motion.div></motion.div>}</AnimatePresence>
    </div>;
};

const Field = ({ label, children }) => <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}<span className="block mt-1">{children}</span></label>;
const Stat = ({ label, value, icon, color }) => <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between hover:shadow-xl transition-shadow"><div><p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p><h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{value}</h3></div><div className={`p-4 rounded-lg shadow-lg text-white ${color === 'green' ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/20' : 'bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-indigo-500/20'}`}>{icon}</div></div>;

export default SubscriptionPacks;
