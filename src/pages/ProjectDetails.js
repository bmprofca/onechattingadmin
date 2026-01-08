import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header, Sidebar } from '../component/Menu';
import {
    FiArrowLeft, FiBriefcase, FiClock, FiCheckCircle,
    FiAlertTriangle, FiPhone, FiMail, FiGlobe,
    FiMapPin, FiLink, FiInfo, FiActivity, FiShield, FiSettings
} from 'react-icons/fi';
import axios from 'axios';

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
                    `https://api.w1chat.com/admin/projects/${project_id}/meta-details`,
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
    const DetailRow = ({ label, value, icon: Icon }) => (
        <div className="flex flex-col py-3 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
            <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                {Icon && <Icon className="text-indigo-400" size={14} />} {label}
            </dt>
            <dd className="text-sm font-semibold text-gray-900 dark:text-gray-100">{value || '-'}</dd>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] text-gray-900 dark:text-gray-100">
            <Header mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} isMinimized={isMinimized} setIsMinimized={setIsMinimized} />
            <Sidebar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} isMinimized={isMinimized} setIsMinimized={setIsMinimized} />

            <main className={`pt-20 transition-all duration-300 ${isMinimized ? 'md:pl-20' : 'md:pl-72'}`}>
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    
                    {/* Breadcrumb & Navigation */}
                    <button 
                        onClick={() => navigate('/admin/projects')}
                        className="group mb-6 flex items-center text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors"
                    >
                        <FiArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" />
                        Back to Project List
                    </button>

                    {loading ? (
                        <div className="animate-pulse space-y-6">
                            <div className="h-32 bg-white dark:bg-gray-800 rounded-2xl shadow-sm" />
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="md:col-span-2 h-96 bg-white dark:bg-gray-800 rounded-2xl shadow-sm" />
                                <div className="h-96 bg-white dark:bg-gray-800 rounded-2xl shadow-sm" />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Hero Header Card */}
                            <div className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 sm:p-8">
                                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex items-center gap-5">
                                        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none">
                                            {project.name?.charAt(0) || 'P'}
                                        </div>
                                        <div>
                                            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                                                {project.name}
                                            </h1>
                                            <div className="flex items-center gap-2 mt-1 text-gray-500 dark:text-gray-400">
                                                <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">ID: {project_id}</span>
                                                <span className="text-gray-300">•</span>
                                                <span className="text-sm">{project.timezone}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-3">
                                        <StatusBadge condition={isActive} trueLabel="Active" falseLabel="Inactive" icon={FiActivity} />
                                        <StatusBadge condition={isWabaConnected} trueLabel="WABA Connected" falseLabel="WABA Disconnected" icon={FiBriefcase} />
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
                                {/* Left Column: Configuration */}
                                <div className="lg:col-span-8 space-y-6">
                                    <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2 font-bold">
                                            <FiSettings className="text-indigo-500" />
                                            Configuration Details
                                        </div>
                                        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-2">
                                            <DetailRow label="Messaging Tier" value={project.wa_messaging_tier} icon={FiActivity} />
                                            <DetailRow label="Quality Rating" value={project.wa_quality_rating} icon={FiCheckCircle} />
                                            <DetailRow label="Display Name" value={project.wa_display_name} />
                                            <DetailRow label="Daily Limit" value={project.daily_template_limit} />
                                            <DetailRow label="BM Status" value={project.fb_business_manager_status} />
                                            <DetailRow label="Currency" value={project.billing_currency} />
                                        </div>
                                    </section>
                                </div>

                                {/* Right Column: Business Profile */}
                                <div className="lg:col-span-4 space-y-6">
                                    <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 text-center">
                                        <div className="relative inline-block mb-4">
                                            <div className="h-24 w-24 rounded-full border-4 border-indigo-50 dark:border-gray-700 overflow-hidden mx-auto bg-gray-50">
                                                <img
                                                    src={profile.profile_picture_url || 'https://www.shutterstock.com/image-vector/sad-confused-moon-404-board-260nw-1900423471.jpg'}
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = 'https://www.shutterstock.com/image-vector/sad-confused-moon-404-board-260nw-1900423471.jpg';
                                                    }}
                                                    alt="Profile"
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{profile.about || 'Business Profile'}</h3>
                                        <p className="text-sm text-gray-500 mb-6">{profile.description}</p>

                                        <div className="text-left space-y-4">
                                            <ContactItem icon={FiPhone} text={profile.wa_number} />
                                            <ContactItem icon={FiMail} text={profile.email} />
                                            <ContactItem icon={FiMapPin} text={profile.address} />
                                            <ContactItem icon={FiGlobe} text={profile.vertical} />
                                        </div>

                                        {profile.websites?.length > 0 && (
                                            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                                                <div className="flex flex-wrap gap-2 justify-center">
                                                    {profile.websites.map((site, i) => (
                                                        <a key={i} href={site} target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-indigo-600 transition-colors">
                                                            <FiLink size={16} />
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
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
    const theme = condition 
        ? `bg-${color}-50 text-${color}-700 border-${color}-100 dark:bg-${color}-900/20 dark:text-${color}-400 dark:border-${color}-800`
        : `bg-gray-50 text-gray-600 border-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700`;
    
    return (
        <span className={`inline-flex items-center px-3 py-1.5 rounded-lg border text-xs font-semibold ${theme}`}>
            <Icon className="mr-2" size={14} />
            {condition ? trueLabel : falseLabel}
        </span>
    );
};

const ContactItem = ({ icon: Icon, text }) => {
    if (!text) return null;
    return (
        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
            <div className="p-2 rounded-md bg-gray-50 dark:bg-gray-700/50">
                <Icon size={14} className="text-indigo-500" />
            </div>
            <span className="truncate">{text}</span>
        </div>
    );
};

export default ProjectDetails;