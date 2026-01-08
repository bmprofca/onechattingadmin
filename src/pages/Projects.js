import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, Sidebar } from '../component/Menu';
import {
    FiSearch,
    FiBriefcase,
    FiActivity,
    FiToggleRight
} from 'react-icons/fi';
import axios from 'axios';

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
    const [tokens, setTokens] = useState(null);
    const [error, setError] = useState('');

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
            const response = await axios.get('https://api.w1chat.com/admin/projects', {
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

    const filteredProjects = projects.filter(project => {
        const term = searchTerm.toLowerCase();
        return (
            project.project_name?.toLowerCase().includes(term) ||
            project.project_id?.toString().toLowerCase().includes(term) ||
            project.business_id?.toString().toLowerCase().includes(term)
        );
    });

    const totalProjects = projects.length;
    const activeProjects = projects.filter(
        p => p.status === '1' || p.status === 1 || p.status === 'active'
    ).length;
    const wabaConnected = projects.filter(
        p => p.is_waba_connected === 1 || p.is_waba_connected === '1' || p.is_waba_connected === true
    ).length;

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
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Projects</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                List of all client projects configured in the system.
                            </p>
                        </div>
                    </div>

                    {/* Stats Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Projects</p>
                                    <h3 className="text-2xl font-bold dark:text-white">{totalProjects}</h3>
                                </div>
                                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                    <FiBriefcase size={24} />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Active Projects</p>
                                    <h3 className="text-2xl font-bold dark:text-white">{activeProjects}</h3>
                                </div>
                                <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
                                    <FiActivity size={24} />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">WABA Connected</p>
                                    <h3 className="text-2xl font-bold dark:text-white">{wabaConnected}</h3>
                                </div>
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                    <FiToggleRight size={24} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by project name, project ID or business ID..."
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        {error && (
                            <div className="px-6 py-3 bg-red-50 dark:bg-red-900/30 text-sm text-red-700 dark:text-red-300 border-b border-red-100 dark:border-red-800">
                                {error}
                            </div>
                        )}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Project
                                        </th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            IDs
                                        </th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            WABA
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {loading ? (
                                        [...Array(5)].map((_, i) => (
                                            <tr key={i} className="animate-pulse">
                                                <td colSpan="4" className="px-6 py-8">
                                                    <div className="h-8 bg-gray-100 dark:bg-gray-700 rounded w-full" />
                                                </td>
                                            </tr>
                                        ))
                                    ) : filteredProjects.length > 0 ? (
                                        filteredProjects.map((project) => {
                                            const isActive =
                                                project.status === '1' ||
                                                project.status === 1 ||
                                                project.status === 'active';
                                            const isConnected =
                                                project.is_waba_connected === 1 ||
                                                project.is_waba_connected === '1' ||
                                                project.is_waba_connected === true;

                                            return (
                                                <tr
                                                    key={project.id || project.project_id}
                                                    className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors"
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center">
                                                            <div className="h-10 w-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-sm">
                                                                {project.project_name?.charAt(0) || 'P'}
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                                                    {project.project_name}
                                                                </div>
                                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                    {project.business_id && `Business ID: ${project.business_id}`}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                                                        <div className="space-y-1">
                                                            <div>
                                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                    Project ID:
                                                                </span>{' '}
                                                                <span className="font-mono text-xs">
                                                                    {project.project_id}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                    Internal ID:
                                                                </span>{' '}
                                                                <span className="font-mono text-xs">
                                                                    {project.id}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {isActive ? (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                                                                Active
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400">
                                                                Inactive
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span
                                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                isConnected
                                                                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400'
                                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                                                            }`}
                                                        >
                                                            {isConnected ? 'Connected' : 'Not Connected'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan="4"
                                                className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                                            >
                                                No projects found matching your search.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Projects;


