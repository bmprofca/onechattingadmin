import React, { useCallback, useEffect, useState } from 'react';
import { FiEdit2, FiPlus, FiRefreshCw, FiSave, FiSearch, FiTrash2, FiX } from 'react-icons/fi';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiCall } from '../utils/apiCall';
import Pagination from '../component/common/PaginationComponent';
import ManagementTable from '../component/common/ManagementTable';
import SelectField from '../component/common/SelectField';

const emptyForm = { username: '', package_id: '', project_id: '', type: 'project', amount: '', start_date: '', end_date: '' };
const inputClass = 'w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white';

const AllSubscriptions = () => {
    const navigate = useNavigate();
    const [tokens, setTokens] = useState(null);
    const [subscriptions, setSubscriptions] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, total_pages: 1 });
    const [filters, setFilters] = useState({ search: '', username: '', project_id: '', package_id: '', type: '', start_date_from: '', start_date_to: '', end_date_from: '', end_date_to: '' });
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [formData, setFormData] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('user_data') || localStorage.getItem('userData') || sessionStorage.getItem('userData');
        if (!stored) return navigate('/login');
        try { setTokens(JSON.parse(stored)); } catch { navigate('/login'); }
    }, [navigate]);

    const authHeaders = useCallback(() => ({ 'x-auth-token': tokens?.token, 'x-token': tokens?.token }), [tokens]);
    const fetchSubscriptions = useCallback(async (page = pagination.page) => {
        if (!tokens?.token) return;
        setLoading(true);
        const params = new URLSearchParams({ page: String(page), limit: String(pagination.limit) });
        Object.entries(filters).forEach(([key, value]) => value && params.set(key, value));
        try {
            const response = await apiCall(`/subscription/user-packages?${params}`, 'GET', null, authHeaders());
            const result = await response.json();
            if (!response.ok || result?.error) throw new Error(result?.message || result?.error || 'Failed to load user packages');
            setSubscriptions(Array.isArray(result.data) ? result.data : []);
            setPagination(current => ({ ...current, ...(result.pagination || {}), page }));
        } catch (error) { toast.error(error.message || 'Failed to load user packages'); }
        finally { setLoading(false); }
    }, [authHeaders, filters, pagination.limit, pagination.page, tokens]);

    useEffect(() => { fetchSubscriptions(); }, [fetchSubscriptions]);

    const updateFilter = (key, value) => { setPagination(current => ({ ...current, page: 1 })); setFilters(current => ({ ...current, [key]: value })); };
    const openModal = (subscription = null) => {
        setEditing(subscription);
        setFormData(subscription ? { username: subscription.username || '', package_id: subscription.package_id || '', project_id: subscription.project_id || '', type: subscription.type || 'project', amount: subscription.amount ?? '', start_date: dateOnly(subscription.start_date), end_date: dateOnly(subscription.end_date) } : emptyForm);
        setShowModal(true);
    };
    const closeModal = () => { if (!saving) { setShowModal(false); setEditing(null); } };

    const saveSubscription = async event => {
        event.preventDefault(); setSaving(true);
        const payload = editing ? { amount: Number(formData.amount), end_date: formData.end_date } : { ...formData, amount: Number(formData.amount) };
        try {
            const endpoint = editing ? `/subscription/user-packages/${editing.id}` : '/subscription/user-packages';
            const response = await apiCall(endpoint, editing ? 'PATCH' : 'POST', payload, authHeaders());
            const result = await response.json();
            if (!response.ok || result?.error) throw new Error(result?.message || result?.error || 'Unable to save user package');
            toast.success(result.message || 'User package saved successfully.'); closeModal(); await fetchSubscriptions();
        } catch (error) { toast.error(error.message || 'Unable to save user package'); }
        finally { setSaving(false); }
    };
    const deleteSubscription = async id => {
        if (!window.confirm('Are you sure you want to delete this user package?')) return;
        try {
            const response = await apiCall(`/subscription/user-packages/${id}`, 'DELETE', null, authHeaders());
            const result = await response.json();
            if (!response.ok || result?.error) throw new Error(result?.message || result?.error || 'Unable to delete user package');
            toast.success(result.message || 'User package deleted successfully.'); await fetchSubscriptions();
        } catch (error) { toast.error(error.message || 'Unable to delete user package'); }
    };

    const typeOptions = [{ value: '', label: 'All types' }, { value: 'project', label: 'Project' }];
    const columns = [
        { key: 'user_package', label: 'User / Package', render: item => <><div>{item.username}</div><div className="font-mono text-xs text-gray-500">{item.package_id}</div></> },
        { key: 'project_id', label: 'Project', render: item => <span className="font-mono text-xs">{item.project_id || '—'}</span> },
        { key: 'type', label: 'Type', render: item => <span className="capitalize">{item.type}</span> },
        { key: 'amount', label: 'Amount', render: item => `₹${Number(item.amount || 0).toLocaleString('en-IN')}` },
        { key: 'period', label: 'Period', render: item => <span className="whitespace-nowrap">{dateOnly(item.start_date)} – {dateOnly(item.end_date)}</span> },
    ];
    const getActions = item => [
        { label: 'Edit package', icon: <FiEdit2 />, onClick: () => openModal(item) },
        { label: 'Delete package', icon: <FiTrash2 />, className: 'text-rose-600 dark:text-rose-400', onClick: () => deleteSubscription(item.id) },
    ];

    return <div className="min-h-screen bg-gray-50 dark:bg-gray-900"><div className="max-w-8xl mx-auto px-4 sm:px-6 md:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8"><div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Packages</h1><p className="text-sm text-gray-500 dark:text-gray-400">Manage user subscription packages</p></div><button onClick={() => openModal()} className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium"><FiPlus /> Create User Package</button></div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border dark:border-gray-700 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3"><input value={filters.search} onChange={e => updateFilter('search', e.target.value)} className={inputClass} placeholder="Search subscriptions" /><input value={filters.username} onChange={e => updateFilter('username', e.target.value)} className={inputClass} placeholder="Username" /><input value={filters.project_id} onChange={e => updateFilter('project_id', e.target.value)} className={inputClass} placeholder="Project ID" /><input value={filters.package_id} onChange={e => updateFilter('package_id', e.target.value)} className={inputClass} placeholder="Package ID" /><SelectField options={typeOptions} value={typeOptions.find(option => option.value === filters.type)} onChange={option => updateFilter('type', option?.value || '')} isSearchable={false} /><input type="date" value={filters.start_date_from} onChange={e => updateFilter('start_date_from', e.target.value)} className={inputClass} title="Start date from" /><input type="date" value={filters.start_date_to} onChange={e => updateFilter('start_date_to', e.target.value)} className={inputClass} title="Start date to" /><input type="date" value={filters.end_date_from} onChange={e => updateFilter('end_date_from', e.target.value)} className={inputClass} title="End date from" /><input type="date" value={filters.end_date_to} onChange={e => updateFilter('end_date_to', e.target.value)} className={inputClass} title="End date to" /><button type="button" onClick={fetchSubscriptions} className="p-2 border rounded-lg dark:text-gray-300"><FiRefreshCw className={loading ? 'animate-spin' : ''} /></button></div>
        {loading ? <div className="py-20 text-center text-gray-500">Loading user packages...</div> : <ManagementTable rows={subscriptions} columns={columns} rowKey="id" getActions={getActions} onRowClick={openModal} accent="indigo" emptyState={<div className="py-20 text-center text-gray-500">No user packages found.</div>} />}
        <Pagination currentPage={pagination.page} totalItems={pagination.total} itemsPerPage={pagination.limit} onPageChange={page => setPagination(p => ({ ...p, page }))} onLimitChange={limit => setPagination(p => ({ ...p, limit, page: 1 }))} className="mt-4" />
    </div><AnimatePresence>{showModal && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeModal} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"><motion.div initial={{ scale: .95 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()} className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-xl shadow-2xl"><div className="flex justify-between items-center p-5 border-b dark:border-gray-800"><h2 className="font-semibold dark:text-white">{editing ? 'Update User Package' : 'Create User Package'}</h2><button onClick={closeModal} className="text-gray-400"><FiX size={20} /></button></div><form onSubmit={saveSubscription} className="p-5 space-y-4">{!editing && <><Field label="Username *"><input required value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} className={inputClass} /></Field><Field label="Package ID *"><input required value={formData.package_id} onChange={e => setFormData({ ...formData, package_id: e.target.value })} className={inputClass} /></Field><Field label="Project ID *"><input required value={formData.project_id} onChange={e => setFormData({ ...formData, project_id: e.target.value })} className={inputClass} /></Field><Field label="Type *"><select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className={inputClass}><option value="project">Project</option></select></Field><Field label="Start date *"><input required type="date" value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} className={inputClass} /></Field></>}<Field label="Amount (₹) *"><input required type="number" min="0" step="0.01" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} className={inputClass} /></Field><Field label="End date *"><input required type="date" value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })} className={inputClass} /></Field><div className="flex gap-3 pt-2"><button type="button" onClick={closeModal} className="flex-1 p-2 border rounded-lg dark:text-gray-300">Cancel</button><button disabled={saving} className="flex-1 flex justify-center gap-2 items-center p-2 bg-indigo-600 text-white rounded-lg disabled:opacity-60"><FiSave />{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</button></div></form></motion.div></motion.div>}</AnimatePresence></div>;
};
const Field = ({ label, children }) => <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}<span className="block mt-1">{children}</span></label>;
const dateOnly = value => value ? String(value).slice(0, 10) : '—';
export default AllSubscriptions;
