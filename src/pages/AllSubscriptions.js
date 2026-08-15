import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { FiBriefcase, FiEdit2, FiPackage, FiPlus, FiRefreshCw, FiSave, FiSearch, FiTrash2, FiUser, FiX, FiChevronDown } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiCall } from '../utils/apiCall';
import Pagination from '../component/common/PaginationComponent';
import ManagementTable from '../component/common/ManagementTable';
import Modal from '../component/common/Modal';

const emptyForm = { username: '', userName: '', package_id: '', packageName: '', project_id: '', projectName: '', type: 'project', amount: '', start_date: '', end_date: '' };
const initialFilters = { search: '', username: '', userName: '', project_id: '', projectName: '', package_id: '', packageName: '' };
const inputClass = 'w-full px-3.5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all';

const UserAvatar = ({ image, name, size = 'w-9 h-9' }) => {
    const [hasError, setHasError] = useState(false);
    const initial = (name || 'U').trim().charAt(0).toUpperCase();

    if (image && !hasError) {
        return (
            <img
                src={image}
                alt={name || 'User'}
                className={`${size} rounded-full object-cover border border-gray-200 dark:border-gray-700 flex-shrink-0 shadow-sm`}
                onError={() => setHasError(true)}
            />
        );
    }
    return (
        <div className={`${size} rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold text-xs flex items-center justify-center flex-shrink-0 shadow-sm`}>
            {initial}
        </div>
    );
};

const ProjectLogo = ({ image, name, size = 'w-9 h-9' }) => {
    const [hasError, setHasError] = useState(false);

    if (image && !hasError) {
        return (
            <img
                src={image}
                alt={name || 'Project'}
                className={`${size} rounded-xl object-cover border border-gray-200 dark:border-gray-700 flex-shrink-0 shadow-sm`}
                onError={() => setHasError(true)}
            />
        );
    }
    return (
        <div className={`${size} rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm`}>
            <FiBriefcase size={16} />
        </div>
    );
};

const AllSubscriptions = () => {
    const navigate = useNavigate();
    const [tokens, setTokens] = useState(null);
    const [subscriptions, setSubscriptions] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, total_pages: 1 });
    const [filters, setFilters] = useState(initialFilters);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [formData, setFormData] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    // Picker states & target ('filter' | 'form')
    const [pickerContext, setPickerContext] = useState('form');
    const [showUserSearchModal, setShowUserSearchModal] = useState(false);
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    const [showPackagePicker, setShowPackagePicker] = useState(false);
    const [packageSearchTerm, setPackageSearchTerm] = useState('');
    const [packages, setPackages] = useState([]);
    const [packagePagination, setPackagePagination] = useState({ page: 1, limit: 20, total: 0, total_pages: 1 });
    const [loadingPackages, setLoadingPackages] = useState(false);

    const [showProjectPicker, setShowProjectPicker] = useState(false);
    const [projectSearchTerm, setProjectSearchTerm] = useState('');
    const [projects, setProjects] = useState([]);
    const [projectPagination, setProjectPagination] = useState({ page: 1, limit: 20, total: 0, total_pages: 1 });
    const [loadingProjects, setLoadingProjects] = useState(false);

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
        if (filters.search) params.set('search', filters.search);
        if (filters.username) params.set('username', filters.username);
        if (filters.project_id) params.set('project_id', filters.project_id);
        if (filters.package_id) params.set('package_id', filters.package_id);

        try {
            const response = await apiCall(`/subscription/user-packages?${params}`, 'GET', null, authHeaders());
            const result = await response.json();
            if (!response.ok || result?.error) throw new Error(result?.message || result?.error || 'Failed to load user packages');
            setSubscriptions(Array.isArray(result.data) ? result.data : []);
            setPagination(current => ({ ...current, ...(result.pagination || {}), page }));
        } catch (error) { toast.error(error.message || 'Failed to load user packages'); }
        finally { setLoading(false); }
    }, [authHeaders, filters.package_id, filters.project_id, filters.search, filters.username, pagination.limit, pagination.page, tokens]);

    useEffect(() => { fetchSubscriptions(); }, [fetchSubscriptions]);

    const updateFilter = (key, value) => {
        setPagination(current => ({ ...current, page: 1 }));
        setFilters(current => ({ ...current, [key]: value }));
    };

    const clearFilter = (key, nameKey = null) => {
        setPagination(current => ({ ...current, page: 1 }));
        setFilters(current => {
            const updated = { ...current, [key]: '' };
            if (nameKey) updated[nameKey] = '';
            return updated;
        });
    };

    const clearAllFilters = () => {
        setPagination(current => ({ ...current, page: 1 }));
        setFilters(initialFilters);
    };

    const fetchUsers = useCallback(async (search = '') => {
        if (!tokens?.token) return;
        setLoadingUsers(true);
        try {
            const response = await apiCall(`/admin/users/${encodeURIComponent(search)}`, 'GET', null, authHeaders());
            const result = await response.json();
            if (!response.ok || result?.error) throw new Error(result?.message || 'Failed to load users');
            setUsers(Array.isArray(result.data) ? result.data : []);
        } catch (error) { toast.error(error.message || 'Failed to load users'); }
        finally { setLoadingUsers(false); }
    }, [authHeaders, tokens]);

    const fetchPackages = useCallback(async (page = 1, append = false) => {
        if (!tokens?.token || loadingPackages) return;
        setLoadingPackages(true);
        try {
            const response = await apiCall(`/subscription/packages?page=${page}&limit=20`, 'GET', null, authHeaders());
            const result = await response.json();
            if (!response.ok || result?.error) throw new Error(result?.message || 'Failed to load packages');
            const nextPackages = Array.isArray(result.data) ? result.data : [];
            setPackages(current => append ? [...current, ...nextPackages.filter(pack => !current.some(item => item.package_id === pack.package_id))] : nextPackages);
            setPackagePagination({ page, limit: 20, total: 0, total_pages: 1, ...(result.pagination || {}) });
        } catch (error) { toast.error(error.message || 'Failed to load packages'); }
        finally { setLoadingPackages(false); }
    }, [authHeaders, loadingPackages, tokens]);

    const fetchProjects = useCallback(async (page = 1, append = false) => {
        if (!tokens?.token || loadingProjects) return;
        setLoadingProjects(true);
        try {
            const response = await apiCall(`/admin/projects?page=${page}&limit=20`, 'GET', null, authHeaders());
            const result = await response.json();
            if (!response.ok || result?.error) throw new Error(result?.message || 'Failed to load projects');
            const nextProjects = Array.isArray(result.data) ? result.data : [];
            setProjects(current => append ? [...current, ...nextProjects.filter(project => !current.some(item => item.project_id === project.project_id))] : nextProjects);
            setProjectPagination({ page, limit: 20, total: 0, total_pages: 1, ...(result.pagination || {}) });
        } catch (error) { toast.error(error.message || 'Failed to load projects'); }
        finally { setLoadingProjects(false); }
    }, [authHeaders, loadingProjects, tokens]);

    useEffect(() => {
        if (showUserSearchModal) fetchUsers(userSearchTerm);
    }, [fetchUsers, showUserSearchModal, userSearchTerm]);

    useEffect(() => {
        if (showPackagePicker) fetchPackages(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showPackagePicker]);

    useEffect(() => {
        if (showProjectPicker) fetchProjects(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showProjectPicker]);

    const openUserPicker = (context) => {
        setPickerContext(context);
        setShowUserSearchModal(true);
    };

    const openPackagePicker = (context) => {
        setPickerContext(context);
        setShowPackagePicker(true);
    };

    const openProjectPicker = (context) => {
        setPickerContext(context);
        setShowProjectPicker(true);
    };

    const selectUser = user => {
        const userName = user.name || user.full_name || user.username;
        if (pickerContext === 'filter') {
            setPagination(p => ({ ...p, page: 1 }));
            setFilters(current => ({ ...current, username: user.username, userName }));
        } else {
            setFormData(current => ({ ...current, username: user.username, userName }));
        }
        setShowUserSearchModal(false);
        setUserSearchTerm('');
    };

    const selectPackage = pack => {
        const packageName = pack.name || pack.package_id;
        if (pickerContext === 'filter') {
            setPagination(p => ({ ...p, page: 1 }));
            setFilters(current => ({ ...current, package_id: pack.package_id, packageName }));
        } else {
            setFormData(current => ({ ...current, package_id: pack.package_id, packageName }));
        }
        setShowPackagePicker(false);
        setPackageSearchTerm('');
    };

    const selectProject = project => {
        const projectName = project.name || project.project_name || project.project_id;
        if (pickerContext === 'filter') {
            setPagination(p => ({ ...p, page: 1 }));
            setFilters(current => ({ ...current, project_id: project.project_id, projectName }));
        } else {
            setFormData(current => ({ ...current, project_id: project.project_id, projectName }));
        }
        setShowProjectPicker(false);
        setProjectSearchTerm('');
    };

    const loadMorePackages = event => {
        const element = event.currentTarget;
        const hasNextPage = packagePagination.page < packagePagination.total_pages;
        if (hasNextPage && !loadingPackages && element.scrollTop + element.clientHeight >= element.scrollHeight - 32) fetchPackages(packagePagination.page + 1, true);
    };

    const loadMoreProjects = event => {
        const element = event.currentTarget;
        const hasNextPage = projectPagination.page < projectPagination.total_pages;
        if (hasNextPage && !loadingProjects && element.scrollTop + element.clientHeight >= element.scrollHeight - 32) fetchProjects(projectPagination.page + 1, true);
    };

    const openModal = (subscription = null) => {
        setEditing(subscription);
        setFormData(subscription ? {
            username: subscription.username || '',
            userName: subscription.full_name || subscription.name || subscription.username || '',
            package_id: subscription.package_id || '',
            packageName: subscription.package_name || subscription.package_id || '',
            project_id: subscription.project_id || '',
            projectName: subscription.project_name || subscription.project_id || '',
            type: subscription.type || 'project',
            amount: subscription.amount ?? '',
            start_date: dateOnly(subscription.start_date),
            end_date: dateOnly(subscription.end_date)
        } : emptyForm);
        setShowModal(true);
    };

    const closeModal = () => { if (!saving) { setShowModal(false); setEditing(null); } };

    const saveSubscription = async event => {
        event.preventDefault();
        if (!editing && (!formData.username || !formData.package_id || !formData.project_id)) {
            toast.error('Please select a user, package, and project');
            return;
        }
        setSaving(true);
        const payload = editing
            ? { amount: Number(formData.amount), end_date: formData.end_date }
            : { username: formData.username, package_id: formData.package_id, project_id: formData.project_id, type: formData.type, amount: Number(formData.amount), start_date: formData.start_date, end_date: formData.end_date };
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

    const hasActiveFilters = Boolean(filters.search || filters.username || filters.package_id || filters.project_id);

    const columns = [
        {
            key: 'user',
            label: 'User',
            render: item => (
                <div className="flex items-center gap-3 min-w-0">
                    <UserAvatar image={item.profile_picture} name={item.full_name || item.name} />
                    <div className="min-w-0 flex-1">
                        <div className="font-semibold text-gray-900 dark:text-white truncate">
                            {item.full_name || item.name || 'User'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate" title={item.username}>
                            @{item.username}
                        </div>
                    </div>
                </div>
            )
        },
        {
            key: 'project',
            label: 'Project',
            render: item => (
                <div className="flex items-center gap-3 min-w-0">
                    <ProjectLogo image={item.image} name={item.project_name} />
                    <div className="min-w-0 flex-1">
                        <div className="font-semibold text-gray-900 dark:text-white truncate">
                            {item.project_name || 'Project'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate" title={item.project_id}>
                            {item.project_id || '—'}
                        </div>
                    </div>
                </div>
            )
        },
        {
            key: 'package',
            label: 'Package',
            render: item => (
                <div className="min-w-0">
                    <div className="font-semibold text-indigo-600 dark:text-indigo-400 truncate">
                        {item.package_name || item.package_id}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate">
                        {item.package_id}
                    </div>
                </div>
            )
        },
        {
            key: 'type',
            label: 'Type',
            render: item => (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50 capitalize">
                    {item.type || 'project'}
                </span>
            )
        },
        {
            key: 'amount',
            label: 'Amount',
            render: item => (
                <span className="font-semibold text-gray-900 dark:text-white">
                    ₹{Number(item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
            )
        },
        {
            key: 'period',
            label: 'Period & Status',
            render: item => {
                const isExpired = item.end_date && new Date(item.end_date) < new Date();
                return (
                    <div className="space-y-1">
                        <div className="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                            {dateOnly(item.start_date)} – {dateOnly(item.end_date)}
                        </div>
                        <div>
                            {isExpired ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
                                    Expired
                                </span>
                            ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                    Active
                                </span>
                            )}
                        </div>
                    </div>
                );
            }
        },
    ];

    const getActions = item => [
        { label: 'Edit package', icon: <FiEdit2 />, onClick: () => openModal(item) },
        { label: 'Delete package', icon: <FiTrash2 />, className: 'text-rose-600 dark:text-rose-400', onClick: () => deleteSubscription(item.id) },
    ];

    return (
        <div className="min-h-screen">
            <div className="max-w-8xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20">
                            <FiBriefcase className="text-white" size={24} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                                User Packages
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Manage user subscription packages and project allocations
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-sm font-medium shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:scale-[1.02] transition-all"
                    >
                        <FiPlus size={16} /> Create User Package
                    </button>
                </div>

                {/* Filter Bar */}
                <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-4 sm:p-5 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 mb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {/* 1. Search */}
                        <div className="relative">
                            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                value={filters.search}
                                onChange={e => updateFilter('search', e.target.value)}
                                className={`${inputClass} pl-10`}
                                placeholder="Search subscriptions..."
                            />
                            {filters.search && (
                                <button
                                    type="button"
                                    onClick={() => updateFilter('search', '')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                >
                                    <FiX size={14} />
                                </button>
                            )}
                        </div>

                        {/* 2. Select User (Searchable Picker) */}
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => openUserPicker('filter')}
                                className={`${inputClass} flex items-center justify-between text-left pr-8`}
                            >
                                <span className={filters.username ? 'text-gray-900 dark:text-white font-medium truncate' : 'text-gray-400 truncate'}>
                                    {filters.username ? (filters.userName ? `${filters.userName} (@${filters.username})` : filters.username) : 'All Users'}
                                </span>
                                <FiUser className="text-gray-400 flex-shrink-0 ml-2" size={16} />
                            </button>
                            {filters.username && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        clearFilter('username', 'userName');
                                    }}
                                    className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-rose-500 transition-colors p-1"
                                    title="Clear user filter"
                                >
                                    <FiX size={14} />
                                </button>
                            )}
                        </div>

                        {/* 3. Select Package (Searchable Picker) */}
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => openPackagePicker('filter')}
                                className={`${inputClass} flex items-center justify-between text-left pr-8`}
                            >
                                <span className={filters.package_id ? 'text-gray-900 dark:text-white font-medium truncate' : 'text-gray-400 truncate'}>
                                    {filters.package_id ? (filters.packageName ? `${filters.packageName} (${filters.package_id})` : filters.package_id) : 'All Packages'}
                                </span>
                                <FiPackage className="text-gray-400 flex-shrink-0 ml-2" size={16} />
                            </button>
                            {filters.package_id && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        clearFilter('package_id', 'packageName');
                                    }}
                                    className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-rose-500 transition-colors p-1"
                                    title="Clear package filter"
                                >
                                    <FiX size={14} />
                                </button>
                            )}
                        </div>

                        {/* 4. Select Project (Searchable Picker) */}
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => openProjectPicker('filter')}
                                className={`${inputClass} flex items-center justify-between text-left pr-8`}
                            >
                                <span className={filters.project_id ? 'text-gray-900 dark:text-white font-medium truncate' : 'text-gray-400 truncate'}>
                                    {filters.project_id ? (filters.projectName ? `${filters.projectName} (${filters.project_id})` : filters.project_id) : 'All Projects'}
                                </span>
                                <FiBriefcase className="text-gray-400 flex-shrink-0 ml-2" size={16} />
                            </button>
                            {filters.project_id && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        clearFilter('project_id', 'projectName');
                                    }}
                                    className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-rose-500 transition-colors p-1"
                                    title="Clear project filter"
                                >
                                    <FiX size={14} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Filter footer: Active filter tags & actions */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50 text-xs text-gray-500">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span>Showing {subscriptions.length} of {pagination.total} subscriptions</span>
                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    onClick={clearAllFilters}
                                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium ml-2"
                                >
                                    Clear all filters
                                </button>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => fetchSubscriptions()}
                            className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg dark:text-gray-300 hover:text-indigo-600 flex items-center gap-1.5 transition-colors text-xs font-medium"
                            title="Refresh"
                        >
                            <FiRefreshCw className={loading ? 'animate-spin' : ''} size={13} />
                            <span>Refresh</span>
                        </button>
                    </div>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="py-20 text-center text-gray-500">Loading user packages...</div>
                ) : (
                    <ManagementTable
                        rows={subscriptions}
                        columns={columns}
                        rowKey="id"
                        getActions={getActions}
                        onRowClick={openModal}
                        accent="indigo"
                        emptyState={<div className="py-20 text-center text-gray-500">No user packages found.</div>}
                    />
                )}
                <Pagination
                    currentPage={pagination.page}
                    totalItems={pagination.total}
                    itemsPerPage={pagination.limit}
                    onPageChange={page => setPagination(p => ({ ...p, page }))}
                    onLimitChange={limit => setPagination(p => ({ ...p, limit, page: 1 }))}
                    className="mt-4"
                />
            </div>

            {/* Create/Edit Modal */}
            <Modal
                isOpen={showModal}
                onClose={closeModal}
                title={editing ? 'Update User Package' : 'Create User Package'}
                size="lg"
                contentClassName="p-5"
                hideCloseButton
                footer={
                    <>
                        <button type="button" onClick={closeModal} className="px-5 py-2.5 rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-semibold text-slate-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" form="user-package-form" disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60 transition-colors">
                            <FiSave />{saving ? 'Saving...' : editing ? 'Update' : 'Create'}
                        </button>
                    </>
                }
            >
                <form id="user-package-form" onSubmit={saveSubscription} className="space-y-4">
                    {!editing && (
                        <>
                            <Field label="User *">
                                <button type="button" onClick={() => openUserPicker('form')} className={`${inputClass} flex items-center justify-between text-left`}>
                                    <span className={formData.username ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-400'}>
                                        {formData.userName ? `${formData.userName} (@${formData.username})` : 'Search and select a user'}
                                    </span>
                                    <FiUser className="text-gray-400 flex-shrink-0" />
                                </button>
                            </Field>
                            <Field label="Package *">
                                <button type="button" onClick={() => openPackagePicker('form')} className={`${inputClass} flex items-center justify-between text-left`}>
                                    <span className={formData.package_id ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-400'}>
                                        {formData.package_id ? `${formData.packageName || formData.package_id} (${formData.package_id})` : 'Select a package'}
                                    </span>
                                    <FiPackage className="text-gray-400 flex-shrink-0" />
                                </button>
                            </Field>
                            <Field label="Project *">
                                <button type="button" onClick={() => openProjectPicker('form')} className={`${inputClass} flex items-center justify-between text-left`}>
                                    <span className={formData.project_id ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-400'}>
                                        {formData.project_id ? `${formData.projectName || formData.project_id} (${formData.project_id})` : 'Select a project'}
                                    </span>
                                    <FiBriefcase className="text-gray-400 flex-shrink-0" />
                                </button>
                            </Field>
                            <Field label="Type *">
                                <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className={inputClass}>
                                    <option value="project">Project</option>
                                </select>
                            </Field>
                            <Field label="Start date *">
                                <input required type="date" value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} className={inputClass} />
                            </Field>
                        </>
                    )}
                    <Field label="Amount (₹) *">
                        <input required type="number" min="0" step="0.01" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} className={inputClass} />
                    </Field>
                    <Field label="End date *">
                        <input required type="date" value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })} className={inputClass} />
                    </Field>
                </form>
            </Modal>

            {/* Select User Modal (Searchable Picker) */}
            <AnimatePresence>
                {showUserSearchModal && (
                    <PickerModal title="Select User" onClose={() => { setShowUserSearchModal(false); setUserSearchTerm(''); }}>
                        <div className="relative mb-3">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input autoFocus value={userSearchTerm} onChange={e => setUserSearchTerm(e.target.value)} placeholder="Search by username, name, email..." className={`${inputClass} pl-10`} />
                        </div>
                        <div className="max-h-96 overflow-y-auto space-y-1">
                            {loadingUsers ? (
                                <PickerLoading />
                            ) : users.length ? (
                                users.map(user => (
                                    <button type="button" key={user.username} onClick={() => selectUser(user)} className="w-full rounded-xl p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-3 transition-colors">
                                        <UserAvatar image={user.profile_picture || user.image} name={user.name || user.full_name || user.username} />
                                        <div className="min-w-0 flex-1">
                                            <div className="font-semibold text-gray-900 dark:text-white truncate">{user.name || user.full_name || user.username}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate">@{user.username}{user.email ? ` · ${user.email}` : ''}</div>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <PickerEmpty text="No users found" />
                            )}
                        </div>
                    </PickerModal>
                )}
            </AnimatePresence>

            {/* Select Package Modal (Searchable Picker) */}
            <AnimatePresence>
                {showPackagePicker && (
                    <PickerModal title="Select Package" onClose={() => { setShowPackagePicker(false); setPackageSearchTerm(''); }}>
                        <div className="relative mb-3">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input autoFocus value={packageSearchTerm} onChange={e => setPackageSearchTerm(e.target.value)} placeholder="Filter loaded packages..." className={`${inputClass} pl-10`} />
                        </div>
                        <div onScroll={loadMorePackages} className="max-h-96 overflow-y-auto space-y-1">
                            {packages
                                .filter(pack => `${pack.package_id} ${pack.name}`.toLowerCase().includes(packageSearchTerm.toLowerCase()))
                                .map(pack => (
                                    <button type="button" key={pack.package_id} onClick={() => selectPackage(pack)} className="w-full rounded-xl p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                        <div className="font-semibold text-gray-900 dark:text-white">{pack.name || pack.package_id}</div>
                                        <div className="font-mono text-xs text-gray-500 dark:text-gray-400 mt-0.5">{pack.package_id} · ₹{pack.amount} · {pack.validity}</div>
                                    </button>
                                ))}
                            {loadingPackages && <PickerLoading />}
                            {!loadingPackages && !packages.length && <PickerEmpty text="No packages found" />}
                        </div>
                    </PickerModal>
                )}
            </AnimatePresence>

            {/* Select Project Modal (Searchable Picker) */}
            <AnimatePresence>
                {showProjectPicker && (
                    <PickerModal title="Select Project" onClose={() => { setShowProjectPicker(false); setProjectSearchTerm(''); }}>
                        <div className="relative mb-3">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input autoFocus value={projectSearchTerm} onChange={e => setProjectSearchTerm(e.target.value)} placeholder="Filter loaded projects..." className={`${inputClass} pl-10`} />
                        </div>
                        <div onScroll={loadMoreProjects} className="max-h-96 overflow-y-auto space-y-1">
                            {projects
                                .filter(project => `${project.project_id} ${project.name || project.project_name || ''}`.toLowerCase().includes(projectSearchTerm.toLowerCase()))
                                .map(project => (
                                    <button type="button" key={project.project_id} onClick={() => selectProject(project)} className="w-full rounded-xl p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-3 transition-colors">
                                        <ProjectLogo image={project.image || project.profile_picture} name={project.name || project.project_name} />
                                        <div className="min-w-0 flex-1">
                                            <div className="font-semibold text-gray-900 dark:text-white truncate">{project.name || project.project_name || project.project_id}</div>
                                            <div className="font-mono text-xs text-gray-500 dark:text-gray-400 truncate">{project.project_id}</div>
                                        </div>
                                    </button>
                                ))}
                            {loadingProjects && <PickerLoading />}
                            {!loadingProjects && !projects.length && <PickerEmpty text="No projects found" />}
                        </div>
                    </PickerModal>
                )}
            </AnimatePresence>
        </div>
    );
};

const Field = ({ label, children }) => <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}<span className="block mt-1">{children}</span></label>;
const PickerModal = ({ title, onClose, children }) => <Modal isOpen onClose={onClose} title={title} contentClassName="p-4" closeText="Cancel">{children}</Modal>;
const PickerLoading = () => <div className="py-5 text-center text-sm text-gray-500">Loading...</div>;
const PickerEmpty = ({ text }) => <div className="py-5 text-center text-sm text-gray-500">{text}</div>;
const dateOnly = value => value ? String(value).slice(0, 10) : '—';
export default AllSubscriptions;
