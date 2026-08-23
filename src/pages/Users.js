import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FiUser,
    FiSearch,
    FiEye,
    FiUserCheck,
    FiUserX,
    FiMail,
    FiPhone,
    FiChevronLeft,
    FiChevronRight,
    FiChevronsLeft,
    FiChevronsRight,
    FiFilter,
    FiDownload,
    FiUsers,
    FiActivity,
    FiLogIn,
    FiCalendar,
    FiBriefcase,
    FiXCircle,
    FiRefreshCw,
    FiDollarSign
} from 'react-icons/fi';
import { apiCall } from '../utils/apiCall';
import ManagementTable from '../component/common/ManagementTable';
import ActionMenu from '../component/common/ActionMenu';
import Pagination from '../component/common/PaginationComponent';
import SelectField from '../component/common/SelectField';
import { API_BASE } from '../utils/config';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { checkUserActiveSession } from '../utils/impersonationService';

const Users = () => {
    const navigate = useNavigate();
    const { startImpersonatingUser } = useAuth();

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [exportLoading, setExportLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, total_pages: 1 });
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterRole, setFilterRole] = useState('');
    const [filterKycVerified, setFilterKycVerified] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [pageJumpInput, setPageJumpInput] = useState('');
    const [activeActionId, setActiveActionId] = useState(null);

    const fetchUsers = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const limit = Math.min(Math.max(pagination.limit || 10, 1), 100);
            const params = new URLSearchParams({ page: String(page), limit: String(limit) });
            if (searchTerm) params.set('search', searchTerm);
            if (filterStatus !== 'all') params.set('status', filterStatus === 'active' ? '1' : '0');
            if (filterRole) params.set('role', filterRole);
            if (filterKycVerified) params.set('kyc_verified', filterKycVerified);
            const response = await apiCall(`/admin/users?${params}`);
            if (response.ok) {
                const data = await response.json();
                if (!data.error) {
                    setUsers(data.data);
                    setPagination(data.pagination);
                }
            }
        } catch (err) {
            console.error("Failed to fetch users", err);
        } finally {
            setLoading(false);
        }
    }, [filterKycVerified, filterRole, filterStatus, pagination.limit, searchTerm]);

    useEffect(() => {
        fetchUsers(pagination.page);
    }, [fetchUsers, pagination.page]);

    const fetchAllUsersForExport = async () => {
        try {
            const firstPageRes = await apiCall(`/admin/users?page=1&limit=1`);
            const firstPage = await firstPageRes.json();
            const totalUsers = firstPage.pagination.total;
            const totalPages = Math.ceil(totalUsers / 100);
            let allUsers = [];

            for (let page = 1; page <= totalPages; page++) {
                const response = await apiCall(`/admin/users?page=${page}&limit=100`);
                if (response.ok) {
                    const data = await response.json();
                    if (!data.error) {
                        allUsers = [...allUsers, ...data.data];
                    }
                }
            }
            return allUsers;
        } catch (err) {
            console.error("Failed to fetch all users for export", err);
            return [];
        }
    };

    const filteredUsers = users;

    const handleLoginAsUser = async (user) => {
        if (!user?.username && !user?.email) return;
        const targetUsername = user.username || user.email;
        const toastId = toast.loading(`Checking active session for ${user.name || targetUsername}...`);

        try {
            const stored = localStorage.getItem('user_data');
            const adminToken = stored ? JSON.parse(stored)?.token : null;

            const sessionCheck = await checkUserActiveSession(targetUsername, adminToken);
            if (!sessionCheck.hasActiveSession || !sessionCheck.activeToken) {
                toast.error(
                    sessionCheck.message ||
                    `No active login session found for ${targetUsername}. The user must have logged in or have an active session token.`,
                    { id: toastId, duration: 5000 }
                );
                return;
            }

            const res = await startImpersonatingUser(
                {
                    id: user.id || user._id,
                    name: user.name || targetUsername,
                    username: user.username || targetUsername,
                    email: user.email,
                    mobile: user.mobile,
                    country_code: user.country_code,
                    role: user.role || 'user',
                    balance: user.balance
                },
                sessionCheck.activeToken,
                true
            );

            if (res.success) {
                toast.success(`Logged in as ${user.name || targetUsername}! Admin session backed up securely.`, { id: toastId, duration: 4500 });
            } else {
                toast.error(res.error || 'Failed to switch to user session.', { id: toastId });
            }
        } catch (err) {
            console.error('Failed to log in as user:', err);
            toast.error('Failed to log in as user.', { id: toastId });
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return new Intl.DateTimeFormat('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }).format(date);
        } catch {
            return dateString;
        }
    };

    const formatBalance = (balance) => {
        if (balance === undefined || balance === null) return '0.00';
        const num = parseFloat(balance);
        return num.toFixed(2);
    };

    const exportAllToCSV = async () => {
        setExportLoading(true);
        try {
            const allUsers = await fetchAllUsersForExport();
            if (allUsers.length === 0) {
                alert('No users to export');
                return;
            }
            const headers = ['S.No.', 'Name', 'Username', 'Email', 'Mobile', 'Country Code', 'Status', 'Balance', 'Role', 'Created Date', 'Last Login'];
            const rows = allUsers.map((user, index) => [
                index + 1, user.name || 'N/A', user.username || 'N/A', user.email || 'N/A', user.mobile || 'N/A', user.country_code || 'N/A',
                user.status === '1' ? 'Active' : 'Inactive', formatBalance(user.balance), user.role?.toUpperCase() || 'USER',
                formatDate(user.create_date), formatDate(user.last_login)
            ]);
            const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => {
                if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
                    return `"${cell.replace(/"/g, '""')}"`;
                }
                return cell;
            }).join(','))].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `all_users_export_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            alert(`Successfully exported ${allUsers.length} users`);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export users. Please try again.');
        } finally {
            setExportLoading(false);
        }
    };

    const columns = [
        {
            key: 'contact',
            label: 'Contact',
            render: (user) => (
                <div className="space-y-1 min-w-0 text-left">
                    <div className="flex items-center justify-start text-xs text-gray-600 dark:text-gray-300">
                        <FiUser className="mr-1.5 flex-shrink-0" size={11} />
                            <span className="truncate">{user.name}</span>
                        </div>
                    <div className="flex items-center justify-start text-xs text-gray-600 dark:text-gray-300">
                        <FiMail className="mr-1.5 flex-shrink-0" size={11} />
                        <span className="truncate">{user.email}</span>
                    </div>
                    <div className="flex items-center justify-start text-xs text-gray-500 dark:text-gray-400">
                        <FiPhone className="mr-1.5 flex-shrink-0" size={11} />
                        <span className="truncate">{user.country_code ? `${user.country_code} ${user.mobile || ''}` : user.mobile || 'No phone'}</span>
                    </div>
                </div>
            )
        },
        {
            key: 'status',
            label: 'Status',
            render: (user) => user.status === '1' ? (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    <FiUserCheck className="mr-1" size={10} /> Active
                </span>
            ) : (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                    <FiUserX className="mr-1" size={10} /> Inactive
                </span>
            )
        },
        {
            key: 'projects',
            label: 'Projects',
            render: (user) => (
                <button className="inline-flex items-center justify-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                    <FiBriefcase className="mr-1" size={10} /> {Array.isArray(user.projects) ? user.projects.length : 0}
                </button>
            )
        },
        {
            key: 'balance',
            label: 'Balance',
            render: (user) => (
                <button onClick={() => navigate(`/users/${user.username}/transactions`)} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-700">
                    <FiDollarSign className="mr-1" size={10} /> {formatBalance(user.balance)}
                </button>
            )
        },
        {
            key: 'joined',
            label: 'Joined',
            render: (user) => (
                <div className="flex items-center justify-start text-xs text-gray-600 dark:text-gray-300">
                    <FiCalendar className="mr-1.5 flex-shrink-0" size={11} />
                    <span className="truncate">{formatDate(user.create_date)}</span>
                </div>
            )
        }
    ];

    const getActions = (user) => [
        { label: 'View Profile', icon: <FiEye />, onClick: () => navigate(`/users/${user.username}`) },
        { label: 'Login as User', icon: <FiLogIn />, onClick: () => handleLoginAsUser(user) }
    ];

    return (
        <div className="min-h-screen">
            <div className="max-w-8xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-4 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg shadow-lg shadow-indigo-500/20"><FiUsers className="text-white" size={24} /></div>
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">User Management</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage, monitor and verify system users across all projects.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => fetchUsers(pagination.page)} className="inline-flex items-center h-10 gap-2 px-4 rounded-lg bg-white/90 dark:bg-gray-800/90 border border-gray-200/50 dark:border-gray-700/50 text-sm font-medium hover:bg-white dark:hover:bg-gray-700 shadow-lg transition-all">
                            <FiRefreshCw className="mr-2" /> Refresh
                        </button>
                        <button onClick={exportAllToCSV} disabled={exportLoading} className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-sm font-medium shadow-lg shadow-indigo-500/20 hover:shadow-xl transition-all disabled:opacity-50">
                            {exportLoading ? <><FiRefreshCw className="mr-2 animate-spin" /> Exporting...</> : <><FiDownload className="mr-2" /> Export All</>}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Users</p>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{pagination.total}</h3>
                            </div>
                            <div className="p-4 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shadow-lg shadow-indigo-500/20"><FiUsers className="text-white" size={24} /></div>
                        </div>
                    </div>
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Active Now</p>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{users.filter(u => u.status === '1').length}</h3>
                            </div>
                            <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-lg shadow-green-500/20"><FiActivity className="text-white" size={24} /></div>
                        </div>
                    </div>
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Inactive Users</p>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{users.filter(u => u.status !== '1').length}</h3>
                            </div>
                            <div className="p-4 bg-gradient-to-br from-red-500 to-rose-600 rounded-lg shadow-lg shadow-red-500/20"><FiUserX className="text-white" size={24} /></div>
                        </div>
                    </div>
                </div>

                <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg lg:flex justify-between gap-3 shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-2 mb-2">
                    <div className="flex w-full max-w-[600px] flex-col md:flex-row gap-4 md:mb-2 lg:mb-0 mb-2">
                        <div className="relative flex-1">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name, email, username or mobile..."
                                className="w-full pl-11 pr-10 h-10 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white transition-all"
                                value={searchTerm}
                                onChange={(e) => { setPagination(p => ({ ...p, page: 1 })); setSearchTerm(e.target.value); }}
                            />
                            {searchTerm && (
                                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    <FiXCircle size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2 justify-start items-center ">
                        <SelectField options={[{ value: 'all', label: 'All statuses' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} value={{ value: filterStatus, label: filterStatus === 'all' ? 'All statuses' : filterStatus === 'active' ? 'Active' : 'Inactive' }} onChange={option => { setPagination(p => ({ ...p, page: 1 })); setFilterStatus(option.value); }} isSearchable={false} />
                        <SelectField options={[{ value: '', label: 'All roles' }, { value: 'user', label: 'User' }, { value: 'admin', label: 'Admin' }]} value={[{ value: '', label: 'All roles' }, { value: 'user', label: 'User' }, { value: 'admin', label: 'Admin' }].find(option => option.value === filterRole)} onChange={option => { setPagination(p => ({ ...p, page: 1 })); setFilterRole(option.value); }} isSearchable={false} />
                        <SelectField options={[{ value: '', label: 'All KYC' }, { value: '1', label: 'KYC verified' }, { value: '0', label: 'KYC unverified' }]} value={[{ value: '', label: 'All KYC' }, { value: '1', label: 'KYC verified' }, { value: '0', label: 'KYC unverified' }].find(option => option.value === filterKycVerified)} onChange={option => { setPagination(p => ({ ...p, page: 1 })); setFilterKycVerified(option.value); }} isSearchable={false} />
                    </div>

                </div>

                <div className="w-full overflow-x-auto rounded-lg">
                    <ManagementTable
                        columns={columns}
                        rows={filteredUsers}
                        rowKey="username"
                        getActions={getActions}
                        activeId={activeActionId}
                        onToggleAction={setActiveActionId}
                        onRowClick={(user) => navigate(`/users/${encodeURIComponent(user.username)}`)}
                    />
                </div>

                <Pagination currentPage={pagination.page} totalItems={pagination.total} itemsPerPage={pagination.limit} onPageChange={page => setPagination(p => ({ ...p, page }))} onLimitChange={limit => setPagination(p => ({ ...p, limit, page: 1 }))} className="mt-4" />
            </div>
        </div>
    );
};

export default Users;
