import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FiSearch,
    FiPlus,
    FiRefreshCw,
    FiTrash2,
    FiEye,
    FiCopy,
    FiCheck,
    FiAlertTriangle,
    FiCheckCircle,
    FiActivity,
    FiBriefcase
} from 'react-icons/fi';
import { QrCode } from 'lucide-react';
import { apiCall } from '../utils/apiCall';
import toast from 'react-hot-toast';
import { QRCodeCanvas } from 'qrcode.react';
import QRCodeModal from '../component/QRCodeModal';
import ManagementTable from '../component/common/ManagementTable';
import SelectField from '../component/common/SelectField';
import Pagination from '../component/common/PaginationComponent';

const QrCodes = () => {
    const navigate = useNavigate();
    const [tokens, setTokens] = useState(null);
    const [qrList, setQrList] = useState([]);
    const [projects, setProjects] = useState([]);
    const [allProjects, setAllProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProjectFilter, setSelectedProjectFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, total_pages: 1 });

    // Modals
    const [selectedQrModal, setSelectedQrModal] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingQr, setEditingQr] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(null);

    // Form inputs for creating QR
    const [newProjectId, setNewProjectId] = useState('');
    const [newQrCount, setNewQrCount] = useState('1');
    const [isCreating, setIsCreating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [copiedId, setCopiedId] = useState(null);
    const [activeAction, setActiveAction] = useState(null);

    useEffect(() => {
        const data = localStorage.getItem('user_data') || localStorage.getItem('userData') || sessionStorage.getItem('userData');
        if (data) {
            setTokens(JSON.parse(data));
        } else {
            navigate('/login');
        }
    }, [navigate]);

    const fetchAllQrCodes = async () => {
        if (!tokens?.token) return;
        setLoading(true);
        try {
            const query = new URLSearchParams({
                page: String(page),
                limit: String(pageSize),
                search: searchQuery.trim(),
                mapping_status: statusFilter === 'ALL' ? 'all' : (statusFilter === '1' ? 'mapped' : 'unmapped'),
            });
            const response = await apiCall(`/qrcode/admin/all?${query.toString()}`);
            const data = await response.json();
            if (response.ok && !data?.error) {
                setQrList(data.qr_codes || []);
                setPagination(data.pagination || { page, limit: pageSize, total: 0, total_pages: 1 });
                // `projects` is the eligible unmapped-project pool. Keep the
                // complete list only so an already mapped project can remain
                // selected while editing/unmapping its QR.
                setProjects(data.projects || []);
                setAllProjects(data.all_projects || data.projects || []);
                if (data.projects?.length > 0 && !newProjectId) {
                    setNewProjectId(data.projects[0].project_id);
                }
            } else {
                toast.error(data?.error || 'Failed to load QR codes');
            }
        } catch (err) {
            toast.error('Network error loading QR codes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tokens?.token) {
            fetchAllQrCodes();
        }
    }, [tokens, page, pageSize, searchQuery, statusFilter]);

    // Handle Create QR Code
    const handleCreateQR = async (e) => {
        e.preventDefault();
        const qrCount = Number(newQrCount);
        if (!editingQr && (!Number.isInteger(qrCount) || qrCount < 1 || qrCount > 500)) {
            toast.error('QR code count must be a whole number between 1 and 500.');
            return;
        }
        setIsCreating(true);
        try {
            const response = await apiCall(
                editingQr ? '/qrcode/admin/map' : '/qrcode/admin/generate',
                'POST',
                editingQr
                    ? { qr_id: editingQr.qr_id, project_id: newProjectId }
                    : { count: qrCount }
            );
            const data = await response.json();

            if (response.ok && !data?.error) {
                toast.success(editingQr ? 'QR Code mapped successfully!' : 'QR Code generated successfully!');
                setNewQrCount('1');
                setNewProjectId('');
                setEditingQr(null);
                setShowCreateModal(false);
                fetchAllQrCodes();
                if (data.qr_code) {
                    setSelectedQrModal(data.qr_code);
                }
            } else {
                toast.error(data?.error || 'Failed to generate QR code');
            }
        } catch (err) {
            toast.error('Server error generating QR code');
        } finally {
            setIsCreating(false);
        }
    };

    const openEditQr = (item) => {
        setEditingQr(item);
        setNewProjectId(item.project_id || '');
        setShowCreateModal(true);
    };

    const mappingProjects = useMemo(() => {
        if (!editingQr) return [];
        const eligible = projects.some((project) => project.project_id === editingQr.project_id)
            ? projects
            : allProjects;
        return eligible.filter((project) => (
            project.project_id === editingQr.project_id ||
            !qrList.some((qr) => qr.qr_id !== editingQr.qr_id && qr.status === '1' && qr.project_id === project.project_id)
        ));
    }, [allProjects, editingQr, projects, qrList]);

    // Handle Delete QR
    const handleDeleteQR = async () => {
        if (!showDeleteModal) return;
        setIsDeleting(true);
        try {
            const response = await apiCall('/qrcode/admin/delete', 'POST', {
                qr_id: showDeleteModal.qr_id
            });
            const data = await response.json();

            if (response.ok && !data?.error) {
                toast.success('QR Code deleted successfully');
                setQrList((prev) => prev.filter((item) => item.qr_id !== showDeleteModal.qr_id));
                setShowDeleteModal(null);
            } else {
                toast.error(data?.error || 'Failed to delete QR code');
            }
        } catch (err) {
            toast.error('Server error deleting QR code');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCopyUrl = async (qr_id) => {
        const portalUrl = (process.env.REACT_APP_PORTAL_URL || 'http://localhost:3000').replace(/\/$/, '');
        const scanUrl = `${portalUrl}/qr/${qr_id}`;
        try {
            await navigator.clipboard.writeText(scanUrl);
            setCopiedId(qr_id);
            toast.success('QR Link copied!');
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            toast.error('Failed to copy');
        }
    };

    // Filtered QR List
    // Filtering and pagination are performed by the server.
    const filteredQrCodes = qrList;

    // Analytics summary
    const totalScans = qrList.reduce((sum, item) => sum + (Number(item.scan_count) || 0), 0);
    const activeCount = qrList.filter((item) => item.status === '1').length;
    const projectCount = new Set(qrList.map((item) => item.project_id)).size;

    const portalUrl = (process.env.REACT_APP_PORTAL_URL || 'http://localhost:3000').replace(/\/$/, '');

    const qrColumns = [
        { key: 'qr_id', label: 'QR Number', render: (row) => <span className="font-mono font-semibold">{row.qr_id}</span> },
        {
            key: 'mapping', label: 'Mapping', render: (row) => row.project_id
                ? <span className="text-emerald-600 dark:text-emerald-400">Mapped: {row.project_name || row.project_id}</span>
                : <span className="text-amber-600 dark:text-amber-400">Unmapped</span>
        },
        { key: 'scan_count', label: 'Scans', render: (row) => row.scan_count || 0 },
        { key: 'create_date', label: 'Created', render: (row) => row.create_date ? new Date(row.create_date).toLocaleDateString() : '-' },
    ];

    const qrActions = (row) => [
        { label: 'View / Print', icon: <FiEye size={15} />, onClick: () => setSelectedQrModal(row) },
        { label: 'Copy scan URL', icon: <FiCopy size={15} />, onClick: () => handleCopyUrl(row.qr_id) },
        ...(row.project_id ? [] : [{ label: 'Map to project', icon: <FiBriefcase size={15} />, onClick: () => openEditQr(row) }]),
        { label: 'Delete QR', icon: <FiTrash2 size={15} />, className: 'text-red-600', onClick: () => setShowDeleteModal(row) },
    ];

    return (
        <div className="min-h-screen">
            <div className="max-w-8xl mx-auto">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg text-white shadow-lg shadow-indigo-500/20">
                            <QrCode size={26} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent flex items-center gap-2.5">
                                Project QR Code Management
                                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                                    Admin Only
                                </span>
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Generate, monitor, print, and manage project-wise QR codes. Mobile users scanning these codes are auto-registered and mapped to the project chatroom.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchAllQrCodes}
                            disabled={loading}
                            className="inline-flex h-10 items-center justify-center gap-2 px-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-600 dark:text-gray-300 shadow-md shadow-gray-300/30 dark:shadow-black/20 hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-lg active:translate-y-px transition-all"
                            title="Refresh"
                        >
                            <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
                        </button>

                        <button
                            onClick={() => { setEditingQr(null); setNewQrCount('1'); setShowCreateModal(true); }}
                            className="inline-flex h-10 items-center justify-center gap-2 px-4 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-lg whitespace-nowrap text-sm font-medium shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl active:translate-y-px"
                        >
                            <FiPlus size={16} />
                            Generate QR
                        </button>
                    </div>
                </div>

                {/* Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-shadow flex items-center justify-between">
                        <div>
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total QR Codes</span>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{qrList.length}</div>
                        </div>
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                            <QrCode size={22} />
                        </div>
                    </div>

                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-shadow flex items-center justify-between">
                        <div>
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Active QR Points</span>
                            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{activeCount}</div>
                        </div>
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                            <FiCheckCircle size={22} />
                        </div>
                    </div>

                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-shadow flex items-center justify-between">
                        <div>
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total User Scans</span>
                            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{totalScans}</div>
                        </div>
                        <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                            <FiActivity size={22} />
                        </div>
                    </div>

                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-shadow flex items-center justify-between">
                        <div>
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Covered Projects</span>
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{projectCount}</div>
                        </div>
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                            <FiBriefcase size={22} />
                        </div>
                    </div>
                </div>

                {/* Filter & Search Bar */}
                <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-2 mb-2 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full max-w-[600px]">
                        <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                        <input
                            type="text"
                            placeholder="Search by QR number or project..."
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                            className="w-full pl-10 pr-4 h-10 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        {/* Status Filter */}
                        <div className="flex items-center gap-2">
                            <SelectField
                                value={[
                                    { value: 'ALL', label: 'All Mapping' },
                                    { value: '1', label: 'Mapped' },
                                    { value: '0', label: 'Unmapped' },
                                ].find((option) => option.value === statusFilter)}
                                onChange={(option) => { setStatusFilter(option?.value || 'ALL'); setPage(1); }}
                                options={[
                                    { value: 'ALL', label: 'All Mapping' },
                                    { value: '1', label: 'Mapped' },
                                    { value: '0', label: 'Unmapped' },
                                ]}
                                isSearchable={false}
                                className="min-w-[150px] text-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* QR Codes Grid / Table */}
                {loading ? (
                    <div className="py-20 text-center text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <FiRefreshCw className="animate-spin inline-block mr-2" size={18} /> Loading QR codes...
                    </div>
                ) : filteredQrCodes.length === 0 ? (
                    <div className="py-16 text-center bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-8">
                        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg inline-block mb-3 text-indigo-500">
                            <QrCode size={36} />
                        </div>
                        <h3 className="text-base font-bold text-gray-800 dark:text-gray-200 mb-1">
                            No QR Codes Found
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-5">
                            {searchQuery || statusFilter !== 'ALL'
                                ? 'No QR codes match your filter criteria. Try resetting filters.'
                                : 'No project QR codes have been created yet. Generate the first one below.'}
                        </p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="inline-flex h-10 items-center justify-center gap-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl active:translate-y-px"
                        >
                            <FiPlus size={15} />
                            Generate QR Code
                        </button>
                    </div>
                ) : (
                    <>
                        <ManagementTable
                            rows={filteredQrCodes}
                            columns={qrColumns}
                            rowKey="qr_id"
                            getActions={qrActions}
                            activeId={activeAction}
                            onToggleAction={(event, id) => setActiveAction(id)}
                            accent="indigo"
                            emptyState={<div />}
                        />
                        <Pagination
                            currentPage={page}
                            totalItems={pagination.total}
                            itemsPerPage={pageSize}
                            onPageChange={setPage}
                            onLimitChange={(limit) => { setPageSize(limit); setPage(1); }}
                            className="mt-4"
                        />
                        <div className="hidden grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {filteredQrCodes.map((item) => {
                                const scanUrl = `${portalUrl}/qr/${item.qr_id}`;
                                const isItemActive = item.status === '1';

                                return (
                                    <div
                                        key={item.qr_id}
                                        className="group bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all hover:shadow-xl hover:shadow-indigo-500/5 flex flex-col justify-between"
                                    >
                                        <div>
                                            {/* Top Row: Thumbnail + Info + Status */}
                                            <div className="flex items-start justify-between gap-3 mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        onClick={() => setSelectedQrModal(item)}
                                                        className="cursor-pointer p-2 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 hover:scale-105 transition-transform"
                                                        title="Click to view/print QR"
                                                    >
                                                        <QRCodeCanvas
                                                            value={scanUrl}
                                                            size={64}
                                                            level="M"
                                                        />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                                                            QR Code
                                                        </h4>
                                                        <div className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                                                            <FiBriefcase size={11} />
                                                            <span>{item.project_name || 'Project'}</span>
                                                        </div>
                                                        <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500 block">
                                                            ID: {item.qr_id}
                                                        </span>
                                                    </div>
                                                </div>

                                                <span
                                                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${isItemActive
                                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                                                        }`}
                                                >
                                                    {isItemActive ? 'Active' : 'Disabled'}
                                                </span>
                                            </div>

                                            {/* Stats Row */}
                                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/40 p-2.5 rounded-lg border border-gray-100 dark:border-gray-700 mb-4">
                                                <div>
                                                    <span className="text-[10px] uppercase text-gray-400 block font-medium">Scans</span>
                                                    <span className="font-bold text-gray-900 dark:text-white text-sm">
                                                        {item.scan_count || 0}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] uppercase text-gray-400 block font-medium">Created</span>
                                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                                        {item.create_date ? new Date(item.create_date).toLocaleDateString() : '-'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Bar */}
                                        <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                                            <button
                                                onClick={() => setSelectedQrModal(item)}
                                                className="inline-flex h-10 items-center justify-center gap-1.5 px-4 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg text-sm font-semibold shadow-md shadow-indigo-500/10 hover:shadow-lg active:translate-y-px transition-all"
                                            >
                                                <FiEye size={13} />
                                                View / Print
                                            </button>

                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => handleCopyUrl(item.qr_id)}
                                                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 shadow-md shadow-gray-300/20 hover:text-indigo-600 hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-lg active:translate-y-px transition-all"
                                                    title="Copy scan link"
                                                >
                                                    {copiedId === item.qr_id ? (
                                                        <FiCheck size={15} className="text-emerald-500" />
                                                    ) : (
                                                        <FiCopy size={15} />
                                                    )}
                                                </button>

                                                {!item.project_id && <button
                                                    onClick={() => openEditQr(item)}
                                                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 shadow-md shadow-gray-300/20 hover:text-indigo-600 hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-lg active:translate-y-px transition-all"
                                                    title="Map QR to project"
                                                >
                                                    <FiBriefcase size={15} />
                                                </button>}

                                                <button
                                                    onClick={() => setShowDeleteModal(item)}
                                                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 shadow-md shadow-gray-300/20 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:shadow-lg active:translate-y-px transition-all"
                                                    title="Delete QR code"
                                                >
                                                    <FiTrash2 size={15} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* Modal: View & Download QR */}
            {selectedQrModal && (
                <QRCodeModal
                    isOpen={!!selectedQrModal}
                    onClose={() => setSelectedQrModal(null)}
                    qrData={selectedQrModal}
                    projectName={selectedQrModal.project_name}
                />
            )}

            {/* Modal: Generate or edit QR Code */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-100 dark:border-gray-700 p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                <QrCode size={22} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                    {editingQr ? 'Map QR to Project' : 'Generate QR Code'}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {editingQr ? 'Choose an unmapped project for this generated QR number.' : 'Generate an unassigned numeric QR number.'}
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleCreateQR} className="space-y-4 mt-4">
                            {editingQr && <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                    Select Project {editingQr && <span className="text-red-500">*</span>}
                                </label>
                                <SelectField
                                    value={newProjectId
                                        ? mappingProjects.map((proj) => ({ value: proj.project_id, label: `${proj.project_name} (${proj.project_id})` })).find((option) => option.value === newProjectId) || null
                                        : { value: '', label: '-- Unmapped QR --' }}
                                    onChange={(option) => setNewProjectId(option?.value || '')}
                                    options={[
                                        { value: '', label: '-- Unmapped QR --' },
                                        ...mappingProjects.map((proj) => ({ value: proj.project_id, label: `${proj.project_name} (${proj.project_id})` }))
                                    ]}
                                    required={Boolean(editingQr && editingQr.project_id)}
                                    isSearchable
                                    placeholder="Select project"
                                />
                            </div>}

                            {!editingQr && <div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Number of QR codes</label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]+"
                                        value={newQrCount}
                                        onChange={(e) => setNewQrCount(e.target.value.replace(/\D/g, '').slice(0, 3))}
                                        onBlur={() => {
                                            if (!newQrCount || Number(newQrCount) < 1) setNewQrCount('1');
                                            else if (Number(newQrCount) > 500) setNewQrCount('500');
                                        }}
                                        className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3.5 py-2.5 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        required
                                    />
                                </div>
                            </div>}

                            <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="inline-flex h-10 items-center justify-center px-4 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg shadow-md shadow-gray-300/20 hover:shadow-lg active:translate-y-px transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className="inline-flex h-10 items-center justify-center gap-1.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-all shadow-lg shadow-indigo-500/25 hover:shadow-xl active:translate-y-px disabled:opacity-50"
                                >
                                    {isCreating ? <FiRefreshCw className="animate-spin" size={13} /> : <FiPlus size={14} />}
                                    {isCreating ? 'Saving...' : (editingQr ? 'Save Mapping' : 'Generate QR Code')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Delete Confirmation */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-100 dark:border-gray-700 p-6 text-center">
                        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-3">
                            <FiAlertTriangle size={24} />
                        </div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                            Delete QR Code?
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
                            Are you sure you want to delete QR code <strong className="font-mono text-gray-800 dark:text-gray-200">{showDeleteModal.qr_id}</strong>? Anyone scanning this printed code will no longer be connected.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setShowDeleteModal(null)}
                                className="inline-flex h-10 items-center justify-center px-4 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg shadow-md shadow-gray-300/20 hover:shadow-lg active:translate-y-px transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteQR}
                                disabled={isDeleting}
                                className="inline-flex h-10 items-center justify-center px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-all shadow-lg shadow-red-500/25 hover:shadow-xl active:translate-y-px disabled:opacity-50"
                            >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QrCodes;
