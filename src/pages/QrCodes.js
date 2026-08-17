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
    FiToggleLeft,
    FiToggleRight,
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

const QrCodes = () => {
    const navigate = useNavigate();
    const [tokens, setTokens] = useState(null);
    const [qrList, setQrList] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProjectFilter, setSelectedProjectFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');

    // Modals
    const [selectedQrModal, setSelectedQrModal] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(null);

    // Form inputs for creating QR
    const [newProjectId, setNewProjectId] = useState('');
    const [newQrLabel, setNewQrLabel] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [copiedId, setCopiedId] = useState(null);

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
            const response = await apiCall('/qrcode/admin/all');
            const data = await response.json();
            if (response.ok && !data?.error) {
                setQrList(data.qr_codes || []);
                setProjects(data.projects || []);
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tokens]);

    // Handle Create QR Code
    const handleCreateQR = async (e) => {
        e.preventDefault();
        if (!newProjectId) {
            toast.error('Please select a project');
            return;
        }

        setIsCreating(true);
        try {
            const response = await apiCall('/qrcode/admin/generate', 'POST', {
                project_id: newProjectId,
                label: newQrLabel.trim() || undefined
            });
            const data = await response.json();

            if (response.ok && !data?.error) {
                toast.success('QR Code generated successfully!');
                setNewQrLabel('');
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

    // Handle Toggle Status
    const handleToggleStatus = async (qr_id, currentStatus) => {
        const nextStatus = currentStatus === '1' ? '0' : '1';
        try {
            const response = await apiCall('/qrcode/admin/toggle-status', 'POST', {
                qr_id,
                status: nextStatus
            });
            const data = await response.json();

            if (response.ok && !data?.error) {
                toast.success(`QR code ${nextStatus === '1' ? 'activated' : 'deactivated'}`);
                setQrList((prev) =>
                    prev.map((item) => (item.qr_id === qr_id ? { ...item, status: nextStatus } : item))
                );
            } else {
                toast.error(data?.error || 'Failed to update status');
            }
        } catch (err) {
            toast.error('Error updating QR status');
        }
    };

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
    const filteredQrCodes = useMemo(() => {
        return qrList.filter((item) => {
            const matchesSearch =
                !searchQuery.trim() ||
                (item.label && item.label.toLowerCase().includes(searchQuery.toLowerCase())) ||
                item.qr_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.project_name && item.project_name.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesProject =
                selectedProjectFilter === 'ALL' || item.project_id === selectedProjectFilter;

            const matchesStatus =
                statusFilter === 'ALL' || item.status === statusFilter;

            return matchesSearch && matchesProject && matchesStatus;
        });
    }, [qrList, searchQuery, selectedProjectFilter, statusFilter]);

    // Analytics summary
    const totalScans = qrList.reduce((sum, item) => sum + (Number(item.scan_count) || 0), 0);
    const activeCount = qrList.filter((item) => item.status === '1').length;
    const projectCount = new Set(qrList.map((item) => item.project_id)).size;

    const portalUrl = (process.env.REACT_APP_PORTAL_URL || 'http://localhost:3000').replace(/\/$/, '');

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-8xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl text-white shadow-lg shadow-indigo-500/20">
                            <QrCode size={26} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
                                Project QR Code Management
                                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                                    Admin Only
                                </span>
                            </h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Generate, monitor, print, and manage project-wise QR codes. Mobile users scanning these codes are auto-registered and mapped to the project chatroom.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchAllQrCodes}
                            disabled={loading}
                            className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
                            title="Refresh"
                        >
                            <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        </button>

                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl whitespace-nowrap text-xs font-bold shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <FiPlus size={16} />
                            Generate QR
                        </button>
                    </div>
                </div>

                {/* Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total QR Codes</span>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{qrList.length}</div>
                        </div>
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                            <QrCode size={22} />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Active QR Points</span>
                            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{activeCount}</div>
                        </div>
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                            <FiCheckCircle size={22} />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total User Scans</span>
                            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{totalScans}</div>
                        </div>
                        <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
                            <FiActivity size={22} />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Covered Projects</span>
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{projectCount}</div>
                        </div>
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                            <FiBriefcase size={22} />
                        </div>
                    </div>
                </div>

                {/* Filter & Search Bar */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
                    <div className="relative w-full md:w-80">
                        <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                        <input
                            type="text"
                            placeholder="Search by label, ID, or project..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        {/* Project Filter */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Project:</span>
                            <select
                                value={selectedProjectFilter}
                                onChange={(e) => setSelectedProjectFilter(e.target.value)}
                                className="px-3 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-xs text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="ALL">All Projects ({projects.length})</option>
                                {projects.map((proj) => (
                                    <option key={proj.project_id} value={proj.project_id}>
                                        {proj.project_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Status Filter */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Status:</span>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-3 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-xs text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="ALL">All Status</option>
                                <option value="1">Active Only</option>
                                <option value="0">Disabled Only</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* QR Codes Grid / Table */}
                {loading ? (
                    <div className="py-20 text-center text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                        <FiRefreshCw className="animate-spin inline-block mr-2" size={18} /> Loading QR codes...
                    </div>
                ) : filteredQrCodes.length === 0 ? (
                    <div className="py-16 text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-8">
                        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl inline-block mb-3 text-indigo-500">
                            <QrCode size={36} />
                        </div>
                        <h3 className="text-base font-bold text-gray-800 dark:text-gray-200 mb-1">
                            No QR Codes Found
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-5">
                            {searchQuery || selectedProjectFilter !== 'ALL' || statusFilter !== 'ALL'
                                ? 'No QR codes match your filter criteria. Try resetting filters.'
                                : 'No project QR codes have been created yet. Generate the first one below.'}
                        </p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md transition-all active:scale-95"
                        >
                            <FiPlus size={15} />
                            Generate QR Code
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filteredQrCodes.map((item) => {
                            const scanUrl = `${portalUrl}/qr/${item.qr_id}`;
                            const isItemActive = item.status === '1';

                            return (
                                <div
                                    key={item.qr_id}
                                    className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all hover:shadow-xl hover:shadow-indigo-500/5 flex flex-col justify-between"
                                >
                                    <div>
                                        {/* Top Row: Thumbnail + Info + Status */}
                                        <div className="flex items-start justify-between gap-3 mb-4">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    onClick={() => setSelectedQrModal(item)}
                                                    className="cursor-pointer p-2 bg-gray-50 dark:bg-gray-700 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600 hover:scale-105 transition-transform"
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
                                                        {item.label || 'Project QR Code'}
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
                                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                                                    isItemActive
                                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                                                }`}
                                            >
                                                {isItemActive ? 'Active' : 'Disabled'}
                                            </span>
                                        </div>

                                        {/* Stats Row */}
                                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/40 p-2.5 rounded-xl border border-gray-100 dark:border-gray-700 mb-4">
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
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-semibold transition-colors"
                                        >
                                            <FiEye size={13} />
                                            View / Print
                                        </button>

                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleCopyUrl(item.qr_id)}
                                                className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                title="Copy scan link"
                                            >
                                                {copiedId === item.qr_id ? (
                                                    <FiCheck size={15} className="text-emerald-500" />
                                                ) : (
                                                    <FiCopy size={15} />
                                                )}
                                            </button>

                                            <button
                                                onClick={() => handleToggleStatus(item.qr_id, item.status)}
                                                className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                title={isItemActive ? 'Disable QR code' : 'Enable QR code'}
                                            >
                                                {isItemActive ? (
                                                    <FiToggleRight size={19} className="text-emerald-500" />
                                                ) : (
                                                    <FiToggleLeft size={19} className="text-gray-400" />
                                                )}
                                            </button>

                                            <button
                                                onClick={() => setShowDeleteModal(item)}
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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

            {/* Modal: Generate New QR Code */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
                                <QrCode size={22} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                    Generate Project QR Code
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Only administrators can generate official QR codes.
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleCreateQR} className="space-y-4 mt-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                    Select Project <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={newProjectId}
                                    onChange={(e) => setNewProjectId(e.target.value)}
                                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    required
                                >
                                    <option value="" disabled>-- Select a Project --</option>
                                    {projects.map((proj) => (
                                        <option key={proj.project_id} value={proj.project_id}>
                                            {proj.project_name} ({proj.project_id})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                    QR Code Label / Placement (Optional)
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Front Reception, Summer Campaign Poster, Website Header"
                                    value={newQrLabel}
                                    onChange={(e) => setNewQrLabel(e.target.value)}
                                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating || !newProjectId}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all shadow-md disabled:opacity-50"
                                >
                                    {isCreating ? <FiRefreshCw className="animate-spin" size={13} /> : <FiPlus size={14} />}
                                    {isCreating ? 'Generating...' : 'Generate QR Code'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Delete Confirmation */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 p-6 text-center">
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
                                className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteQR}
                                disabled={isDeleting}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-md disabled:opacity-50"
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
