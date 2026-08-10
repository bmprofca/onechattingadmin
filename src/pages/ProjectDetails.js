import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header, Sidebar } from '../component/Menu';
import {
    FiArrowLeft, FiBriefcase, FiClock, FiCheckCircle,
    FiAlertTriangle, FiPhone, FiMail, FiGlobe,
    FiMapPin, FiLink, FiInfo, FiActivity, FiShield, FiSettings,
    FiDollarSign, FiStar, FiCpu, FiHash, FiCalendar,
    FiThumbsUp, FiTrendingUp, FiAward, FiLock, FiUnlock
} from 'react-icons/fi';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const ProjectDetails = () => {
    const { project_id } = useParams();
    const navigate = useNavigate();

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(() => {
        const saved = localStorage.getItem('sidebarMinimized');
        return saved ? JSON.parse(saved) : false;
    });

    const [tokens, setTokens] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [metaDetails, setMetaDetails] = useState(null);

    useEffect(() => {
        localStorage.setItem('sidebarMinimized', JSON.stringify(isMinimized));
    }, [isMinimized]);

    useEffect(() => {
        const data = localStorage.getItem('userData') || sessionStorage.getItem('userData');
        if (data) {
            setTokens(JSON.parse(data));
        } else {
            navigate('/login');
        }
    }, [navigate]);

    useEffect(() => {
        const fetchMetaDetails = async () => {
            if (!tokens?.token || !project_id) return;
            setLoading(true);
            setError('');
            try {
                const response = await axios.get(
                    `${API_BASE_URL}/admin/projects/${project_id}/meta-details`,
                    { headers: { 'x-token': tokens.token, 'username': tokens.username } }
                );
                if (!response.data.error) {
                    setMetaDetails(response.data.data);
                } else {
                    setError(response.data.message || 'Failed to fetch project details');
                }
            } catch (err) {
                setError('Authorization failed or server error');
            } finally {
                setLoading(false);
            }
        };
        fetchMetaDetails();
    }, [tokens, project_id]);

    const project = metaDetails?.project || {};
    const profile = metaDetails?.profile || {};
    const isActive = project.status === '1' || project.status === 1 || project.status === 'active';
    const isWabaConnected = metaDetails?.is_waba_connected === true;

    // Helper component for detail rows
    const DetailRow = ({ label, value, icon: Icon, badge = false }) => (
        <div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-gray-700/50 last:border-0 group hover:bg-gray-50/50 dark:hover:bg-gray-700/10 px-3 rounded-lg transition-colors">
            <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                {Icon && <Icon className="text-indigo-500 dark:text-indigo-400" size={14} />} 
                <span>{label}</span>
            </dt>
            <dd className="text-sm font-semibold text-gray-900 dark:text-white">
                {badge ? (
                    <span className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 font-mono">
                        {value || '-'}
                    </span>
                ) : (
                    <span className="font-medium">{value || '-'}</span>
                )}
            </dd>
        </div>
    );

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

            <main className={`pt-20 transition-all duration-300 ${isMinimized ? 'md:pl-20' : 'md:pl-72'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    
                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 px-6 py-4 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-900/20 rounded-2xl border border-red-200 dark:border-red-800">
                            <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
                                <FiAlertTriangle className="flex-shrink-0" size={16} />
                                <span>{error}</span>
                            </div>
                        </div>
                    )}

                    {/* Breadcrumb & Navigation */}
                    <button 
                        onClick={() => navigate('/projects')}
                        className="group mb-6 flex items-center text-sm font-medium text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-all duration-200"
                    >
                        <div className="p-1.5 rounded-lg bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 mr-3 group-hover:border-indigo-200 dark:group-hover:border-indigo-800 group-hover:-translate-x-1 transition-all">
                            <FiArrowLeft className="text-indigo-500 dark:text-indigo-400" size={14} />
                        </div>
                        Back to Project List
                    </button>

                    {loading ? (
                        <div className="space-y-6">
                            {/* Loading Skeleton - Hero */}
                            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl p-8">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex items-center gap-5">
                                        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-indigo-200 to-purple-200 dark:from-indigo-900/50 dark:to-purple-900/50 animate-pulse"></div>
                                        <div className="space-y-3">
                                            <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                                            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                                        <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Loading Skeleton - Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                <div className="lg:col-span-8">
                                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl p-6 h-96 animate-pulse">
                                        <div className="h-8 w-40 bg-gray-200 dark:bg-gray-700 rounded-lg mb-6"></div>
                                        <div className="grid grid-cols-2 gap-4">
                                            {[...Array(6)].map((_, i) => (
                                                <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="lg:col-span-4">
                                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl p-6 h-96 animate-pulse">
                                        <div className="flex flex-col items-center">
                                            <div className="h-24 w-24 rounded-full bg-gray-200 dark:bg-gray-700 mb-4"></div>
                                            <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg mb-2"></div>
                                            <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded-lg mb-6"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Hero Header Card - Premium Design */}
                            <div className="relative overflow-hidden bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl p-8">
                                {/* Decorative Gradient Background */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 dark:from-indigo-500/10 dark:to-purple-500/10 rounded-full blur-3xl -translate-y-32 translate-x-32"></div>
                                <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-emerald-500/5 to-teal-500/5 dark:from-emerald-500/10 dark:to-teal-500/10 rounded-full blur-3xl translate-y-16 -translate-x-16"></div>
                                
                                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex items-center gap-6">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                                            <div className="relative h-20 w-20 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-indigo-500/20">
                                                {project.project_name?.charAt(0) || project.name?.charAt(0) || 'P'}
                                            </div>
                                        </div>
                                        <div>
                                            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                                                {project.project_name || project.name}
                                            </h1>
                                            <div className="flex flex-wrap items-center gap-3 mt-2">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700/80 rounded-lg border border-gray-200 dark:border-gray-600">
                                                    <FiHash className="text-indigo-500 dark:text-indigo-400" size={12} />
                                                    <span className="text-xs font-mono font-medium text-gray-700 dark:text-gray-300">
                                                        ID: {project_id}
                                                    </span>
                                                </span>
                                                {project.timezone && (
                                                    <>
                                                        <span className="text-gray-300 dark:text-gray-600">•</span>
                                                        <span className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                                                            <FiClock size={14} className="text-gray-400" />
                                                            {project.timezone}
                                                        </span>
                                                    </>
                                                )}
                                                {project.business_id && (
                                                    <>
                                                        <span className="text-gray-300 dark:text-gray-600">•</span>
                                                        <span className="inline-flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                                                            <FiBriefcase size={12} className="text-gray-400" />
                                                            Business: {project.business_id}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-3">
                                        <StatusBadge 
                                            condition={isActive} 
                                            trueLabel="Active" 
                                            falseLabel="Inactive" 
                                            icon={FiActivity} 
                                            color="green"
                                        />
                                        <StatusBadge 
                                            condition={isWabaConnected} 
                                            trueLabel="WABA Connected" 
                                            falseLabel="WABA Disconnected" 
                                            icon={FiBriefcase} 
                                            color="emerald"
                                        />
                                        <StatusBadge 
                                            condition={project.is_whatsapp_verified} 
                                            trueLabel="Verified" 
                                            falseLabel="Unverified" 
                                            icon={FiShield} 
                                            color="blue" 
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                {/* Left Column: Configuration & Details */}
                                <div className="lg:col-span-8 space-y-6">
                                    {/* Configuration Details Card */}
                                    <section className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl overflow-hidden">
                                        <div className="px-6 py-5 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <div className="p-2 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg shadow-lg shadow-indigo-500/20">
                                                    <FiSettings className="text-white" size={16} />
                                                </div>
                                                <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                    Configuration Details
                                                </h2>
                                            </div>
                                            <span className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600">
                                                WhatsApp Settings
                                            </span>
                                        </div>
                                        <div className="p-6">
                                            <dl className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                                <DetailRow 
                                                    label="Messaging Tier" 
                                                    value={project.wa_messaging_tier || 'Standard'} 
                                                    icon={FiTrendingUp} 
                                                    badge 
                                                />
                                                <DetailRow 
                                                    label="Quality Rating" 
                                                    value={project.wa_quality_rating || 'High'} 
                                                    icon={FiStar} 
                                                    badge 
                                                />
                                                <DetailRow 
                                                    label="Display Name" 
                                                    value={project.wa_display_name || project.project_name || '-'} 
                                                    icon={FiAward} 
                                                />
                                                <DetailRow 
                                                    label="Daily Template Limit" 
                                                    value={project.daily_template_limit || 'Unlimited'} 
                                                    icon={FiCpu} 
                                                    badge 
                                                />
                                                <DetailRow 
                                                    label="Business Manager Status" 
                                                    value={project.fb_business_manager_status || 'Active'} 
                                                    icon={project.fb_business_manager_status === 'Active' ? FiUnlock : FiLock} 
                                                    badge 
                                                />
                                                <DetailRow 
                                                    label="Billing Currency" 
                                                    value={project.billing_currency || 'USD'} 
                                                    icon={FiDollarSign} 
                                                    badge 
                                                />
                                                <DetailRow 
                                                    label="Created Date" 
                                                    value={project.created_at ? new Date(project.created_at).toLocaleDateString() : '-'} 
                                                    icon={FiCalendar} 
                                                />
                                                {project.updated_at && (
                                                    <DetailRow 
                                                        label="Last Updated" 
                                                        value={new Date(project.updated_at).toLocaleDateString()} 
                                                        icon={FiClock} 
                                                    />
                                                )}
                                            </dl>
                                        </div>
                                    </section>

                                    {/* Additional Information Card */}
                                    <section className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl overflow-hidden">
                                        <div className="px-6 py-5 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2.5">
                                            <div className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow-lg shadow-purple-500/20">
                                                <FiInfo className="text-white" size={16} />
                                            </div>
                                            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                Additional Information
                                            </h2>
                                        </div>
                                        <div className="p-6">
                                            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="flex flex-col p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700">
                                                    <dt className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1.5">
                                                        <FiThumbsUp size={12} className="text-indigo-500" />
                                                        WhatsApp Verified
                                                    </dt>
                                                    <dd className="text-sm font-semibold text-gray-900 dark:text-white">
                                                        {project.is_whatsapp_verified ? 'Yes' : 'No'}
                                                    </dd>
                                                </div>
                                                <div className="flex flex-col p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700">
                                                    <dt className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1.5">
                                                        <FiBriefcase size={12} className="text-indigo-500" />
                                                        Business ID
                                                    </dt>
                                                    <dd className="text-sm font-mono font-semibold text-gray-900 dark:text-white">
                                                        {project.business_id || '-'}
                                                    </dd>
                                                </div>
                                            </dl>
                                        </div>
                                    </section>
                                </div>

                                {/* Right Column: Business Profile */}
                                <div className="lg:col-span-4 space-y-6">
                                    <section className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl overflow-hidden sticky top-24">
                                        <div className="px-6 py-5 bg-gradient-to-r from-emerald-500 to-teal-600">
                                            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                                <FiGlobe size={16} />
                                                Business Profile
                                            </h2>
                                        </div>
                                        
                                        <div className="p-6 text-center">
                                            <div className="relative inline-block mb-5">
                                                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full blur-xl opacity-20"></div>
                                                <div className="relative h-28 w-28 rounded-full border-4 border-white dark:border-gray-800 overflow-hidden mx-auto bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 shadow-xl">
                                                    <img
                                                        src={profile.profile_picture_url || 'https://ui-avatars.com/api/?name=' + (profile.about || 'Business') + '&background=6366f1&color=fff&size=128'}
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = `https://ui-avatars.com/api/?name=${profile.about || 'Business'}&background=6366f1&color=fff&size=128`;
                                                        }}
                                                        alt="Profile"
                                                        className="h-full w-full object-cover"
                                                    />
                                                </div>
                                                {isWabaConnected && (
                                                    <div className="absolute bottom-1 right-1 bg-emerald-500 rounded-full p-1.5 border-2 border-white dark:border-gray-800">
                                                        <FiCheckCircle size={12} className="text-white" />
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                                                {profile.about || profile.name || 'Business Profile'}
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 line-clamp-2">
                                                {profile.description || 'No description available'}
                                            </p>

                                            <div className="text-left space-y-3">
                                                {profile.wa_number && (
                                                    <ContactItem icon={FiPhone} text={profile.wa_number} />
                                                )}
                                                {profile.email && (
                                                    <ContactItem icon={FiMail} text={profile.email} />
                                                )}
                                                {profile.address && (
                                                    <ContactItem icon={FiMapPin} text={profile.address} />
                                                )}
                                                {profile.vertical && (
                                                    <ContactItem icon={FiGlobe} text={profile.vertical} />
                                                )}
                                            </div>

                                            {profile.websites?.length > 0 && (
                                                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 text-left">Websites</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {profile.websites.map((site, i) => (
                                                            <a 
                                                                key={i} 
                                                                href={site} 
                                                                target="_blank" 
                                                                rel="noreferrer" 
                                                                className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-200"
                                                            >
                                                                <FiLink size={16} />
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {!profile.wa_number && !profile.email && !profile.address && (
                                                <div className="py-8 text-center">
                                                    <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full inline-block mb-3">
                                                        <FiInfo className="text-gray-400 dark:text-gray-500" size={24} />
                                                    </div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        No business profile information available
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </section>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

// Sub-components for cleaner code
const StatusBadge = ({ condition, trueLabel, falseLabel, icon: Icon, color = "green" }) => {
    const getColorClasses = () => {
        if (!condition) {
            return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
        }
        
        switch(color) {
            case 'green':
                return 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 text-green-700 border-green-200 dark:text-green-400 dark:border-green-800';
            case 'emerald':
                return 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-emerald-700 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800';
            case 'blue':
                return 'bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-700 border-blue-200 dark:text-blue-400 dark:border-blue-800';
            case 'purple':
                return 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-700 border-purple-200 dark:text-purple-400 dark:border-purple-800';
            default:
                return `bg-${color}-50 text-${color}-700 border-${color}-100 dark:bg-${color}-900/20 dark:text-${color}-400 dark:border-${color}-800`;
        }
    };

    return (
        <span className={`inline-flex items-center px-4 py-2 rounded-xl border text-xs font-semibold ${getColorClasses()}`}>
            <Icon className="mr-1.5" size={14} />
            {condition ? trueLabel : falseLabel}
        </span>
    );
};

const ContactItem = ({ icon: Icon, text }) => {
    if (!text) return null;
    return (
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors group">
            <div className="p-2 rounded-lg bg-white dark:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-600 group-hover:border-indigo-200 dark:group-hover:border-indigo-700 transition-colors">
                <Icon size={14} className="text-indigo-500 dark:text-indigo-400" />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{text}</span>
        </div>
    );
};

export default ProjectDetails;