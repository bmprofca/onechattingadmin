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

const Users = () => {
    const navigate = useNavigate();

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

    const handleLoginAsUser = (user) => {
        if (!user?.email) return;
        const baseUrl = 'https://wichat-sigma.vercel.app/login';
        const params = new URLSearchParams({
            username: user.email,
            password: user.password || ''
        });
        const url = `${baseUrl}?${params.toString()}`;
        window.open(url, '_blank', 'noopener,noreferrer');
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
                <div className="flex items-center justify-start text-xs text-gray-600">
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
        <div className="w-full px-4 sm:px-6 py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage, monitor and verify system users across all projects.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => fetchUsers(pagination.page)} className="flex items-center px-4 py-2 bg-white dark:bg-gray-800 border rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm">
                        <FiRefreshCw className="mr-2" /> Refresh
                    </button>
                    <button onClick={exportAllToCSV} disabled={exportLoading} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm disabled:opacity-50">
                        {exportLoading ? <><FiRefreshCw className="mr-2 animate-spin" /> Exporting...</> : <><FiDownload className="mr-2" /> Export All</>}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Users</p>
                            <h3 className="text-2xl font-bold">{pagination.total}</h3>
                        </div>
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg"><FiUsers size={24} /></div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Active Now</p>
                            <h3 className="text-2xl font-bold">{users.filter(u => u.status === '1').length}</h3>
                        </div>
                        <div className="p-3 bg-green-50 text-green-600 rounded-lg"><FiActivity size={24} /></div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Inactive Users</p>
                            <h3 className="text-2xl font-bold">{users.filter(u => u.status !== '1').length}</h3>
                        </div>
                        <div className="p-3 bg-red-50 text-red-600 rounded-lg"><FiUserX size={24} /></div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, email, username or mobile..."
                            className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
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
                <select value={filterStatus} onChange={e => { setPagination(p => ({ ...p, page: 1 })); setFilterStatus(e.target.value); }} className="px-3 py-2.5 border rounded-lg bg-gray-50 text-sm"><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
                <select value={filterRole} onChange={e => { setPagination(p => ({ ...p, page: 1 })); setFilterRole(e.target.value); }} className="px-3 py-2.5 border rounded-lg bg-gray-50 text-sm"><option value="">All roles</option><option value="user">User</option><option value="admin">Admin</option></select>
                <select value={filterKycVerified} onChange={e => { setPagination(p => ({ ...p, page: 1 })); setFilterKycVerified(e.target.value); }} className="px-3 py-2.5 border rounded-lg bg-gray-50 text-sm"><option value="">All KYC</option><option value="1">KYC verified</option><option value="0">KYC unverified</option></select>
            </div>

            <ManagementTable 
                columns={columns} 
                rows={filteredUsers} 
                rowKey="username"
                getActions={getActions}
                activeId={activeActionId}
                onToggleAction={setActiveActionId}
            />

            <Pagination currentPage={pagination.page} totalItems={pagination.total} itemsPerPage={pagination.limit} onPageChange={page => setPagination(p => ({ ...p, page }))} onLimitChange={limit => setPagination(p => ({ ...p, limit, page: 1 }))} className="mt-4" />
        </div>
    );
};

export default Users;
