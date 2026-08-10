import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, Sidebar } from '../component/Menu';
import {
    FiSearch,
    FiBriefcase,
    FiActivity,
    FiToggleRight,
    FiDollarSign,
    FiChevronRight,
    FiDatabase,
    FiCheckCircle,
    FiXCircle,
    FiWifi,
    FiWifiOff,
    FiFilter
} from 'react-icons/fi';
import axios from 'axios';
import ProjectChargesModal from '../component/Modals/ProjectChargesModal';
import { API_BASE_URL } from '../config/api';

const Projects = () => {
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(() => {
        const saved = localStorage.getItem('sidebarMinimized');
        return saved ? JSON.parse(saved) : false;
    });

    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [wabaFilter, setWabaFilter] = useState('all');
    const [tokens, setTokens] = useState(null);
    const [error, setError] = useState('');
    const [chargesModalOpen, setChargesModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);

    // Sync Sidebar State
    useEffect(() => {
        localStorage.setItem('sidebarMinimized', JSON.stringify(isMinimized));
    }, [isMinimized]);

    // Load tokens
    useEffect(() => {
        const data = localStorage.getItem('userData') || sessionStorage.getItem('userData');
        if (data) {
            setTokens(JSON.parse(data));
        } else {
            navigate('/login');
        }
    }, [navigate]);

    // Fetch Projects
    const fetchProjects = useCallback(async () => {
        if (!tokens?.token) return;
        setLoading(true);
        setError('');
        try {
            const response = await axios.get(`${API_BASE_URL}/admin/projects`, {
                headers: {
                    'x-token': tokens.token,
                    'username': tokens.username
                }
            });

            if (!response.data.error) {
                setProjects(response.data.data || []);
            } else {
                setError(response.data.message || 'Failed to fetch projects');
            }
        } catch (err) {
            setError('Authorization failed or server error');
        } finally {
            setLoading(false);
        }
    }, [tokens]);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    // Apply filters
    const filteredProjects = projects.filter(project => {
        const term = searchTerm.toLowerCase();
        
        // Search filter
        const matchesSearch = 
            project.project_name?.toLowerCase().includes(term) ||
            project.project_id?.toString().toLowerCase().includes(term) ||
            project.business_id?.toString().toLowerCase().includes(term) ||
            project.id?.toString().toLowerCase().includes(term);
        
        if (!matchesSearch) return false;

        // Status filter
        const isActive = project.status === '1' || project.status === 1 || project.status === 'active';
        if (statusFilter !== 'all') {
            if (statusFilter === 'active' && !isActive) return false;
            if (statusFilter === 'inactive' && isActive) return false;
        }

        // WABA Connection filter
        const isConnected = project.is_waba_connected === 1 || 
                           project.is_waba_connected === '1' || 
                           project.is_waba_connected === true;
        if (wabaFilter !== 'all') {
            if (wabaFilter === 'connected' && !isConnected) return false;
            if (wabaFilter === 'not_connected' && isConnected) return false;
        }

        return true;
    });

    const totalProjects = projects.length;
    const activeProjects = projects.filter(
        p => p.status === '1' || p.status === 1 || p.status === 'active'
    ).length;
    const wabaConnected = projects.filter(
        p => p.is_waba_connected === 1 || p.is_waba_connected === '1' || p.is_waba_connected === true
    ).length;

    const handleOpenCharges = (project, e) => {
        if (e) {
            e.stopPropagation();
        }
        setSelectedProject(project);
        setChargesModalOpen(true);
    };

    const handleChargesUpdated = (updatedProject) => {
        if (!updatedProject) return;
        setProjects(prev =>
            prev.map(p =>
                p.project_id === updatedProject.project_id ? { ...p, ...updatedProject } : p
            )
        );
    };

    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setWabaFilter('all');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
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
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20">
                                    <FiDatabase className="text-white" size={24} />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                                        Projects
                                    </h1>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        List of all client projects configured in the system
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                                <span className="text-sm text-gray-600 dark:text-gray-300">
                                    Last updated: {new Date().toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Stats Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Projects</p>
                                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{totalProjects}</h3>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">All time</p>
                                </div>
                                <div className="p-4 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/20">
                                    <FiBriefcase className="text-white" size={24} />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Active Projects</p>
                                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{activeProjects}</h3>
                                    <p className="text-xs text-green-500 dark:text-green-400 mt-1">{((activeProjects/totalProjects)*100 || 0).toFixed(1)}% of total</p>
                                </div>
                                <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg shadow-green-500/20">
                                    <FiActivity className="text-white" size={24} />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">WABA Connected</p>
                                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{wabaConnected}</h3>
                                    <p className="text-xs text-emerald-500 dark:text-emerald-400 mt-1">{((wabaConnected/totalProjects)*100 || 0).toFixed(1)}% connected</p>
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
                            {/* Search Bar */}
                            <div className="relative flex-1">
                                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search by project name, project ID or business ID..."
                                    className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            
                            {/* Filter Row */}
                            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                    <FiFilter size={16} />
                                    <span>Filters:</span>
                                </div>
                                
                                {/* Status Filter */}
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white text-sm"
                                >
                                    <option value="all">All Status</option>
                                    <option value="active">Active Only</option>
                                    <option value="inactive">Inactive Only</option>
                                </select>

                                {/* WABA Connection Filter */}
                                <select
                                    value={wabaFilter}
                                    onChange={(e) => setWabaFilter(e.target.value)}
                                    className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white text-sm"
                                >
                                    <option value="all">All Connections</option>
                                    <option value="connected">WABA Connected</option>
                                    <option value="not_connected">WABA Not Connected</option>
                                </select>

                                {/* Active Filters Count */}
                                {(statusFilter !== 'all' || wabaFilter !== 'all' || searchTerm) && (
                                    <button
                                        onClick={clearFilters}
                                        className="px-4 py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors"
                                    >
                                        Clear Filters
                                    </button>
                                )}
                            </div>

                            {/* Active Filter Indicators */}
                            {(statusFilter !== 'all' || wabaFilter !== 'all') && (
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {statusFilter !== 'all' && (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs">
                                            <span>Status: {statusFilter === 'active' ? 'Active' : 'Inactive'}</span>
                                            <button onClick={() => setStatusFilter('all')} className="ml-1 hover:text-indigo-900 dark:hover:text-indigo-100">
                                                ×
                                            </button>
                                        </span>
                                    )}
                                    {wabaFilter !== 'all' && (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-xs">
                                            <span>WABA: {wabaFilter === 'connected' ? 'Connected' : 'Not Connected'}</span>
                                            <button onClick={() => setWabaFilter('all')} className="ml-1 hover:text-emerald-900 dark:hover:text-emerald-100">
                                                ×
                                            </button>
                                        </span>
                                    )}
                                </div>
                            )}
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
                    
                    {/* Professional Table - No Card, No Horizontal Scroll */}
                    <div className="w-full overflow-x-visible">
                        <table className="w-full text-center border-separate border-spacing-0">
                            <thead className="bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900">
                                <tr>
                                    <th className="px-6 py-5 text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider border-b-2 border-gray-200 dark:border-gray-700 rounded-tl-2xl">
                                        Project Details
                                    </th>
                                    <th className="px-6 py-5 text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider border-b-2 border-gray-200 dark:border-gray-700">
                                        IDs & References
                                    </th>
                                    <th className="px-6 py-5 text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider border-b-2 border-gray-200 dark:border-gray-700">
                                        Status
                                    </th>
                                    <th className="px-6 py-5 text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider border-b-2 border-gray-200 dark:border-gray-700">
                                        WABA Connection
                                    </th>
                                    <th className="px-6 py-5 text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider border-b-2 border-gray-200 dark:border-gray-700 rounded-tr-2xl">
                                        Charges
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800">
                                {loading ? (
                                    [...Array(8)].map((_, i) => (
                                        <tr key={i} className="animate-pulse hover:bg-gray-50/50 dark:hover:bg-gray-700/30 border-b border-gray-100 dark:border-gray-700">
                                            <td className="px-6 py-5" colSpan="5">
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
                                ) : filteredProjects.length > 0 ? (
                                    filteredProjects.map((project, index) => {
                                        const isActive =
                                            project.status === '1' ||
                                            project.status === 1 ||
                                            project.status === 'active';
                                        const isConnected =
                                            project.is_waba_connected === 1 ||
                                            project.is_waba_connected === '1' ||
                                            project.is_waba_connected === true;
                                        
                                        const isLast = index === filteredProjects.length - 1;

                                        return (
                                            <tr
                                                key={project.id || project.project_id}
                                                className={`hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-blue-50/50 dark:hover:from-indigo-900/20 dark:hover:to-blue-900/20 transition-all duration-200 cursor-pointer group border-b border-gray-100 dark:border-gray-700 ${
                                                    isLast ? 'border-b-0' : ''
                                                }`}
                                                onClick={() => navigate(`/projects/${project.project_id}`)}
                                            >
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center justify-center">
                                                        <div className="flex items-center">
                                                            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                                                                {project.project_name?.charAt(0) || 'P'}
                                                            </div>
                                                            <div className="ml-4 text-left">
                                                                <div className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                                    {project.project_name}
                                                                </div>
                                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                    {project.business_id ? `Business ID: ${project.business_id}` : 'No Business ID'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col items-center space-y-2">
                                                        <div className="px-3 py-1.5 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                                                            <span className="text-xs text-gray-500 dark:text-gray-400 block">Project ID</span>
                                                            <span className="text-sm font-mono font-medium text-gray-900 dark:text-white">
                                                                {project.project_id}
                                                            </span>
                                                        </div>
                                                        <div className="px-3 py-1.5 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                                                            <span className="text-xs text-gray-500 dark:text-gray-400 block">Internal ID</span>
                                                            <span className="text-sm font-mono font-medium text-gray-900 dark:text-white">
                                                                {project.id}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center justify-center">
                                                        {isActive ? (
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
                                                    <div className="flex items-center justify-center">
                                                        {isConnected ? (
                                                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-200 dark:border-emerald-800">
                                                                <FiWifi className="text-emerald-500 dark:text-emerald-400" size={14} />
                                                                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Connected</span>
                                                            </div>
                                                        ) : (
                                                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-gray-500/10 to-gray-600/10 border border-gray-200 dark:border-gray-700">
                                                                <FiWifiOff className="text-gray-500 dark:text-gray-400" size={14} />
                                                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-400">Not Connected</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center justify-center">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => handleOpenCharges(project, e)}
                                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-medium shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 hover:scale-105 transition-all duration-200"
                                                        >
                                                            <FiDollarSign size={14} />
                                                            View Charges
                                                            <FiChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-20 text-center border-b border-gray-100 dark:border-gray-700">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                                                    <FiDatabase className="text-gray-400 dark:text-gray-500" size={32} />
                                                </div>
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No projects found</h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                                    No projects match your search criteria. Try adjusting your filters.
                                                </p>
                                                <button
                                                    onClick={clearFilters}
                                                    className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors"
                                                >
                                                    Clear All Filters
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            
                            {/* Table Footer */}
                            {filteredProjects.length > 0 && (
                                <tfoot>
                                    <tr>
                                        <td colSpan="5" className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-t-2 border-gray-200 dark:border-gray-700 rounded-b-2xl">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                                    Showing <span className="font-semibold">{filteredProjects.length}</span> of <span className="font-semibold">{totalProjects}</span> projects
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        {activeProjects} active, {wabaConnected} WABA connected
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>

                    <ProjectChargesModal
                        isOpen={chargesModalOpen}
                        onClose={() => setChargesModalOpen(false)}
                        project={selectedProject}
                        tokens={tokens}
                        onUpdated={handleChargesUpdated}
                    />
                </div>
            </div>
        </div>
    );
};

export default Projects;