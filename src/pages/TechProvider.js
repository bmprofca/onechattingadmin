import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    FiServer,
    FiCheckCircle,
    FiActivity,
    FiSave,
    FiRefreshCw,
    FiEye,
    FiEyeOff,
    FiZap,
    FiGlobe,
    FiInfo,
    FiShield,
    FiCopy,
    FiCheck,
    FiSliders,
    FiEdit3,
    FiX,
    FiAlertCircle,
    FiArrowRight,
    FiLock,
    FiKey,
    FiLayers,
    FiCpu
} from 'react-icons/fi';
import { AnimatePresence, motion } from 'framer-motion';
import { apiCall } from '../utils/apiCall';
import toast from 'react-hot-toast';

export default function TechProvider() {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState(null);

    // Active Saved Configuration State (from DB)
    const [savedConfig, setSavedConfig] = useState({
        provider_type: 'aisensy',
        aisensy: { partner_id: '', api_key: '', solution_id: '', has_api_key: false },
        own_meta: {
            app_id: '',
            app_secret: '',
            config_id: '',
            system_user_token: '',
            webhook_verify_token: '',
            graph_version: 'v21.0',
            has_app_secret: false,
            has_system_user_token: false,
            has_webhook_verify_token: false
        },
        modify_date: null,
        modify_by: ''
    });

    // Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [activeModalTab, setActiveModalTab] = useState('aisensy');

    // Form Draft State (used in Edit Modal)
    const [draftProviderType, setDraftProviderType] = useState('aisensy');
    const [draftAisensyPartnerId, setDraftAisensyPartnerId] = useState('');
    const [draftAisensyApiKey, setDraftAisensyApiKey] = useState('');
    const [draftAisensySolutionId, setDraftAisensySolutionId] = useState('');

    const [draftMetaAppId, setDraftMetaAppId] = useState('');
    const [draftMetaAppSecret, setDraftMetaAppSecret] = useState('');
    const [draftMetaConfigId, setDraftMetaConfigId] = useState('');
    const [draftMetaSystemUserToken, setDraftMetaSystemUserToken] = useState('');
    const [draftMetaWebhookVerifyToken, setDraftMetaWebhookVerifyToken] = useState('');
    const [draftMetaGraphVersion, setDraftMetaGraphVersion] = useState('v21.0');

    // Visibility toggles in modal
    const [showAisensyKey, setShowAisensyKey] = useState(false);
    const [showMetaSecret, setShowMetaSecret] = useState(false);
    const [showSystemToken, setShowSystemToken] = useState(false);
    const [showWebhookToken, setShowWebhookToken] = useState(false);

    // Copy indicator state
    const [copiedField, setCopiedField] = useState(null);

    const handleCopy = (text, fieldName) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        toast.success('Copied to clipboard');
        setTimeout(() => setCopiedField(null), 2000);
    };

    // Load Tech Provider Config from API
    const loadConfig = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiCall('/admin/tech-provider/config', 'GET');
            const data = await res.json();
            if (data && !data.error) {
                const d = data.data || {};
                const loaded = {
                    provider_type: d.provider_type || 'aisensy',
                    aisensy: {
                        partner_id: d.aisensy?.partner_id || '',
                        api_key: d.aisensy?.api_key_masked || d.aisensy?.api_key || '',
                        solution_id: d.aisensy?.solution_id || '',
                        has_api_key: Boolean(d.aisensy?.has_api_key)
                    },
                    own_meta: {
                        app_id: d.own_meta?.app_id || '',
                        app_secret: d.own_meta?.app_secret_masked || d.own_meta?.app_secret || '',
                        config_id: d.own_meta?.config_id || '',
                        system_user_token: d.own_meta?.system_user_token_masked || d.own_meta?.system_user_token || '',
                        webhook_verify_token: d.own_meta?.webhook_verify_token_masked || d.own_meta?.webhook_verify_token || '',
                        graph_version: d.own_meta?.graph_version || 'v21.0',
                        has_app_secret: Boolean(d.own_meta?.has_app_secret),
                        has_system_user_token: Boolean(d.own_meta?.has_system_user_token),
                        has_webhook_verify_token: Boolean(d.own_meta?.has_webhook_verify_token)
                    },
                    modify_date: d.modify_date,
                    modify_by: d.modify_by
                };

                setSavedConfig(loaded);
            } else {
                toast.error(data.error || 'Failed to load tech provider configuration.');
            }
        } catch (err) {
            console.error('Fetch tech provider error:', err);
            toast.error('Network error loading tech provider settings.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadConfig();
    }, [loadConfig]);

    // Open Edit Modal and sync draft state with savedConfig
    const handleOpenEditModal = (preferredTab = null) => {
        setDraftProviderType(savedConfig.provider_type || 'aisensy');
        setDraftAisensyPartnerId(savedConfig.aisensy.partner_id || '');
        setDraftAisensyApiKey(savedConfig.aisensy.api_key || '');
        setDraftAisensySolutionId(savedConfig.aisensy.solution_id || '');

        setDraftMetaAppId(savedConfig.own_meta.app_id || '');
        setDraftMetaAppSecret(savedConfig.own_meta.app_secret || '');
        setDraftMetaConfigId(savedConfig.own_meta.config_id || '');
        setDraftMetaSystemUserToken(savedConfig.own_meta.system_user_token || '');
        setDraftMetaWebhookVerifyToken(savedConfig.own_meta.webhook_verify_token || '');
        setDraftMetaGraphVersion(savedConfig.own_meta.graph_version || 'v21.0');

        setActiveModalTab(preferredTab || savedConfig.provider_type || 'aisensy');
        setTestResult(null);
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setTestResult(null);
    };

    // Calculate dirty / changed state
    const isDirty = useMemo(() => {
        return (
            draftProviderType !== savedConfig.provider_type ||
            draftAisensyPartnerId !== savedConfig.aisensy.partner_id ||
            draftAisensyApiKey !== savedConfig.aisensy.api_key ||
            draftAisensySolutionId !== savedConfig.aisensy.solution_id ||
            draftMetaAppId !== savedConfig.own_meta.app_id ||
            draftMetaAppSecret !== savedConfig.own_meta.app_secret ||
            draftMetaConfigId !== savedConfig.own_meta.config_id ||
            draftMetaSystemUserToken !== savedConfig.own_meta.system_user_token ||
            draftMetaWebhookVerifyToken !== savedConfig.own_meta.webhook_verify_token ||
            draftMetaGraphVersion !== savedConfig.own_meta.graph_version
        );
    }, [
        draftProviderType,
        draftAisensyPartnerId,
        draftAisensyApiKey,
        draftAisensySolutionId,
        draftMetaAppId,
        draftMetaAppSecret,
        draftMetaConfigId,
        draftMetaSystemUserToken,
        draftMetaWebhookVerifyToken,
        draftMetaGraphVersion,
        savedConfig
    ]);

    // Save Configuration
    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                provider_type: draftProviderType,
                aisensy_partner_id: draftAisensyPartnerId,
                aisensy_api_key: draftAisensyApiKey,
                aisensy_solution_id: draftAisensySolutionId,
                meta_app_id: draftMetaAppId,
                meta_app_secret: draftMetaAppSecret,
                meta_config_id: draftMetaConfigId,
                meta_system_user_token: draftMetaSystemUserToken,
                meta_webhook_verify_token: draftMetaWebhookVerifyToken,
                meta_graph_version: draftMetaGraphVersion
            };

            const res = await apiCall('/admin/tech-provider/config', 'POST', payload);
            const data = await res.json();

            if (data && !data.error) {
                toast.success(data.message || 'Tech Provider configuration saved successfully!');
                await loadConfig();
                setIsEditModalOpen(false);
            } else {
                toast.error(data.error || 'Failed to save settings.');
            }
        } catch (err) {
            console.error('Save error:', err);
            toast.error('Failed to save tech provider settings.');
        } finally {
            setSaving(false);
        }
    };

    // Test Connection for specified provider (either from modal draft or active)
    const handleTestConnection = async (providerToTest = null) => {
        const target = providerToTest || (isEditModalOpen ? activeModalTab : savedConfig.provider_type);
        setTesting(true);
        setTestResult(null);

        try {
            const payload = {
                provider_type: target,
                aisensy: {
                    partner_id: isEditModalOpen ? draftAisensyPartnerId : savedConfig.aisensy.partner_id,
                    api_key: isEditModalOpen ? draftAisensyApiKey : savedConfig.aisensy.api_key,
                    solution_id: isEditModalOpen ? draftAisensySolutionId : savedConfig.aisensy.solution_id
                },
                own_meta: {
                    app_id: isEditModalOpen ? draftMetaAppId : savedConfig.own_meta.app_id,
                    app_secret: isEditModalOpen ? draftMetaAppSecret : savedConfig.own_meta.app_secret,
                    system_user_token: isEditModalOpen ? draftMetaSystemUserToken : savedConfig.own_meta.system_user_token,
                    graph_version: isEditModalOpen ? draftMetaGraphVersion : savedConfig.own_meta.graph_version
                }
            };

            const res = await apiCall('/admin/tech-provider/test-connection', 'POST', payload);
            const data = await res.json();

            if (data && !data.error && data.success) {
                setTestResult({
                    success: true,
                    provider: target,
                    message: data.message || 'Connection verified successfully!'
                });
                toast.success(`${target === 'aisensy' ? 'AiSensy' : 'Meta'} connection verified!`);
            } else {
                const msg = data.message || data.error || 'Connection failed';
                setTestResult({
                    success: false,
                    provider: target,
                    message: msg
                });
                toast.error(msg);
            }
        } catch (err) {
            const errorMsg = 'Failed to test connection. Server error.';
            setTestResult({
                success: false,
                provider: target,
                message: errorMsg
            });
            toast.error(errorMsg);
        } finally {
            setTesting(false);
        }
    };

    const isAisensyConfigured = Boolean(savedConfig.aisensy.partner_id && savedConfig.aisensy.api_key);
    const isMetaConfigured = Boolean(
        savedConfig.own_meta.app_id &&
        savedConfig.own_meta.app_secret &&
        savedConfig.own_meta.config_id &&
        savedConfig.own_meta.system_user_token
    );
    const isCurrentConfigured = savedConfig.provider_type === 'aisensy' ? isAisensyConfigured : isMetaConfigured;

    return (
        <div className="min-h-screen pb-12">
            <div className="max-w-8xl mx-auto space-y-8">

                {/* Top Header Banner */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/70 dark:bg-gray-800/70 backdrop-blur-md p-6 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-4 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 ring-4 ring-indigo-500/10">
                            <FiServer className="w-7 h-7" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 flex-wrap">
                                <h1 className="text-2xl font-black bg-gradient-to-r from-gray-900 via-gray-800 to-gray-600 dark:from-white dark:via-gray-100 dark:to-gray-300 bg-clip-text text-transparent tracking-tight">
                                    WhatsApp Tech Provider & Embedded Login
                                </h1>
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase shadow-sm ${savedConfig.provider_type === 'aisensy'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                                    : 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800'
                                    }`}>
                                    <span className={`w-2 h-2 rounded-full ${savedConfig.provider_type === 'aisensy' ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500 animate-pulse'}`} />
                                    {savedConfig.provider_type === 'aisensy' ? 'AiSensy Partner Mode' : 'Direct Meta Cloud Mode'}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">
                                Manage WhatsApp Business Onboarding & Cloud API credentials. Choose whether client onboarding runs through AiSensy Partner or your direct Meta Developer Tech Provider App.
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
                        <button
                            type="button"
                            onClick={loadConfig}
                            disabled={loading}
                            className="inline-flex h-11 items-center justify-center gap-2 px-4 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl shadow-sm hover:shadow active:scale-95 transition-all disabled:opacity-50"
                        >
                            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleOpenEditModal()}
                            className="inline-flex h-11 items-center justify-center gap-2 px-5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 rounded-xl shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 active:scale-95 transition-all"
                        >
                            <FiEdit3 className="w-4 h-4" />
                            <span>Edit Configuration</span>
                        </button>
                    </div>
                </div>

                {/* Main Active Provider Showcase Card */}
                <div className={`relative overflow-hidden rounded-3xl p-8 border-2 transition-all duration-300 shadow-xl ${savedConfig.provider_type === 'aisensy'
                    ? 'bg-gradient-to-br from-emerald-500/5 via-emerald-500/10 to-transparent dark:from-emerald-950/30 dark:via-emerald-900/10 dark:to-gray-900 border-emerald-500/40 shadow-emerald-500/5'
                    : 'bg-gradient-to-br from-blue-500/5 via-blue-500/10 to-transparent dark:from-blue-950/30 dark:via-blue-900/10 dark:to-gray-900 border-blue-500/40 shadow-blue-500/5'
                    }`}>

                    {/* Decorative Background Blob */}
                    <div className={`absolute -right-16 -top-16 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none ${savedConfig.provider_type === 'aisensy' ? 'bg-emerald-500' : 'bg-blue-500'
                        }`} />

                    <div className="relative z-10">
                        {/* Header Inside Card */}
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-gray-200/60 dark:border-gray-700/60">
                            <div className="flex items-center gap-4">
                                <div className={`p-4 rounded-2xl text-white shadow-lg ${savedConfig.provider_type === 'aisensy'
                                    ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/30'
                                    : 'bg-gradient-to-br from-blue-600 to-indigo-600 shadow-blue-500/30'
                                    }`}>
                                    {savedConfig.provider_type === 'aisensy' ? <FiZap className="w-8 h-8" /> : <FiGlobe className="w-8 h-8" />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                            Currently Selected & Active
                                        </span>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                                            LIVE IN PRODUCTION
                                        </span>
                                    </div>
                                    <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                                        {savedConfig.provider_type === 'aisensy' ? 'AiSensy Partner Infrastructure' : 'Direct Meta Cloud Tech Provider'}
                                    </h2>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                                        {savedConfig.provider_type === 'aisensy'
                                            ? 'All user signups & WABA onboarding are automatically managed via the AiSensy Partner API ecosystem.'
                                            : 'Signups use direct Meta Facebook Embedded Login Popup with zero intermediary partner dependencies.'}
                                    </p>
                                </div>
                            </div>                            
                        </div>

                        {/* Test Connection Banner (if triggered) */}
                        {testResult && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`mt-6 p-4 rounded-xl border flex items-start gap-3 ${testResult.success
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                                    : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-900 dark:text-red-200'
                                    }`}
                            >
                                {testResult.success ? (
                                    <FiCheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                                ) : (
                                    <FiAlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                                )}
                                <div className="flex-1 text-xs sm:text-sm">
                                    <span className="font-bold">
                                        {testResult.success ? 'Verification Successful: ' : 'Verification Failed: '}
                                    </span>
                                    <span>{testResult.message}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setTestResult(null)}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                >
                                    <FiX className="w-4 h-4" />
                                </button>
                            </motion.div>
                        )}

                        {/* Credential Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
                            {savedConfig.provider_type === 'aisensy' ? (
                                <>
                                    {/* Partner ID */}
                                    <div className="p-4 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/80 dark:border-gray-700/80 shadow-sm flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-1">
                                                <span>AiSensy Partner ID</span>
                                                <FiKey className="w-3.5 h-3.5 text-emerald-500" />
                                            </div>
                                            <p className="text-sm font-mono font-bold text-gray-900 dark:text-white break-all">
                                                {savedConfig.aisensy.partner_id || (
                                                    <span className="text-amber-500 font-sans italic font-normal">Not configured</span>
                                                )}
                                            </p>
                                        </div>
                                        {savedConfig.aisensy.partner_id && (
                                            <button
                                                type="button"
                                                onClick={() => handleCopy(savedConfig.aisensy.partner_id, 'partner_id')}
                                                className="self-end mt-2 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1"
                                            >
                                                {copiedField === 'partner_id' ? <FiCheck className="w-3.5 h-3.5" /> : <FiCopy className="w-3.5 h-3.5" />}
                                                <span>{copiedField === 'partner_id' ? 'Copied' : 'Copy'}</span>
                                            </button>
                                        )}
                                    </div>

                                    {/* Solution ID */}
                                    <div className="p-4 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/80 dark:border-gray-700/80 shadow-sm flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-1">
                                                <span>AiSensy Solution ID</span>
                                                <FiLayers className="w-3.5 h-3.5 text-emerald-500" />
                                            </div>
                                            <p className="text-sm font-mono font-bold text-gray-900 dark:text-white break-all">
                                                {savedConfig.aisensy.solution_id || (
                                                    <span className="text-gray-400 font-sans italic font-normal">Not specified</span>
                                                )}
                                            </p>
                                        </div>
                                        {savedConfig.aisensy.solution_id && (
                                            <button
                                                type="button"
                                                onClick={() => handleCopy(savedConfig.aisensy.solution_id, 'solution_id')}
                                                className="self-end mt-2 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1"
                                            >
                                                {copiedField === 'solution_id' ? <FiCheck className="w-3.5 h-3.5" /> : <FiCopy className="w-3.5 h-3.5" />}
                                                <span>{copiedField === 'solution_id' ? 'Copied' : 'Copy'}</span>
                                            </button>
                                        )}
                                    </div>

                                    {/* API Key Status */}
                                    <div className="p-4 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/80 dark:border-gray-700/80 shadow-sm flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-1">
                                                <span>Partner API Key</span>
                                                <FiLock className="w-3.5 h-3.5 text-emerald-500" />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-mono font-bold text-gray-900 dark:text-white">
                                                    {savedConfig.aisensy.api_key || (
                                                        <span className="text-amber-500 font-sans italic font-normal">Missing API Key</span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-2 flex items-center justify-between text-xs">
                                            <span className={`font-semibold flex items-center gap-1 ${savedConfig.aisensy.has_api_key ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${savedConfig.aisensy.has_api_key ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                                {savedConfig.aisensy.has_api_key ? 'Encrypted & Active' : 'Not Configured'}
                                            </span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* Meta App ID */}
                                    <div className="p-4 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/80 dark:border-gray-700/80 shadow-sm flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-1">
                                                <span>Meta App ID</span>
                                                <FiKey className="w-3.5 h-3.5 text-blue-500" />
                                            </div>
                                            <p className="text-sm font-mono font-bold text-gray-900 dark:text-white break-all">
                                                {savedConfig.own_meta.app_id || (
                                                    <span className="text-amber-500 font-sans italic font-normal">Not configured</span>
                                                )}
                                            </p>
                                        </div>
                                        {savedConfig.own_meta.app_id && (
                                            <button
                                                type="button"
                                                onClick={() => handleCopy(savedConfig.own_meta.app_id, 'meta_app_id')}
                                                className="self-end mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
                                            >
                                                {copiedField === 'meta_app_id' ? <FiCheck className="w-3.5 h-3.5" /> : <FiCopy className="w-3.5 h-3.5" />}
                                                <span>{copiedField === 'meta_app_id' ? 'Copied' : 'Copy'}</span>
                                            </button>
                                        )}
                                    </div>

                                    {/* Meta Config ID */}
                                    <div className="p-4 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/80 dark:border-gray-700/80 shadow-sm flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-1">
                                                <span>Embedded Config ID</span>
                                                <FiSliders className="w-3.5 h-3.5 text-blue-500" />
                                            </div>
                                            <p className="text-sm font-mono font-bold text-gray-900 dark:text-white break-all">
                                                {savedConfig.own_meta.config_id || (
                                                    <span className="text-amber-500 font-sans italic font-normal">Not configured</span>
                                                )}
                                            </p>
                                        </div>
                                        {savedConfig.own_meta.config_id && (
                                            <button
                                                type="button"
                                                onClick={() => handleCopy(savedConfig.own_meta.config_id, 'meta_config_id')}
                                                className="self-end mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
                                            >
                                                {copiedField === 'meta_config_id' ? <FiCheck className="w-3.5 h-3.5" /> : <FiCopy className="w-3.5 h-3.5" />}
                                                <span>{copiedField === 'meta_config_id' ? 'Copied' : 'Copy'}</span>
                                            </button>
                                        )}
                                    </div>

                                    {/* Meta Graph Version */}
                                    <div className="p-4 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/80 dark:border-gray-700/80 shadow-sm flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-1">
                                                <span>Graph API Version</span>
                                                <FiCpu className="w-3.5 h-3.5 text-blue-500" />
                                            </div>
                                            <p className="text-sm font-mono font-bold text-gray-900 dark:text-white">
                                                {savedConfig.own_meta.graph_version || 'v21.0'}
                                            </p>
                                        </div>
                                        <div className="mt-2 text-xs text-gray-400">
                                            Meta Official Graph Endpoint
                                        </div>
                                    </div>

                                    {/* App Secret */}
                                    <div className="p-4 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/80 dark:border-gray-700/80 shadow-sm flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-1">
                                                <span>App Secret</span>
                                                <FiLock className="w-3.5 h-3.5 text-blue-500" />
                                            </div>
                                            <p className="text-sm font-mono font-bold text-gray-900 dark:text-white">
                                                {savedConfig.own_meta.app_secret || (
                                                    <span className="text-amber-500 font-sans italic font-normal">Not configured</span>
                                                )}
                                            </p>
                                        </div>
                                        <div className="mt-2 text-xs font-semibold flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            <span>{savedConfig.own_meta.has_app_secret ? 'Secret Saved' : 'Missing'}</span>
                                        </div>
                                    </div>

                                    {/* System User Token */}
                                    <div className="p-4 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/80 dark:border-gray-700/80 shadow-sm flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-1">
                                                <span>System User Token</span>
                                                <FiShield className="w-3.5 h-3.5 text-blue-500" />
                                            </div>
                                            <p className="text-sm font-mono font-bold text-gray-900 dark:text-white">
                                                {savedConfig.own_meta.system_user_token || (
                                                    <span className="text-amber-500 font-sans italic font-normal">Not configured</span>
                                                )}
                                            </p>
                                        </div>
                                        <div className="mt-2 text-xs font-semibold flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            <span>{savedConfig.own_meta.has_system_user_token ? 'Permanent Token Set' : 'Missing'}</span>
                                        </div>
                                    </div>

                                    {/* Webhook Verify Token */}
                                    <div className="p-4 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/80 dark:border-gray-700/80 shadow-sm flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-1">
                                                <span>Webhook Verify Token</span>
                                                <FiActivity className="w-3.5 h-3.5 text-blue-500" />
                                            </div>
                                            <p className="text-sm font-mono font-bold text-gray-900 dark:text-white break-all">
                                                {savedConfig.own_meta.webhook_verify_token || (
                                                    <span className="text-amber-500 font-sans italic font-normal">Not configured</span>
                                                )}
                                            </p>
                                        </div>
                                        {savedConfig.own_meta.webhook_verify_token && (
                                            <button
                                                type="button"
                                                onClick={() => handleCopy(savedConfig.own_meta.webhook_verify_token, 'meta_webhook_verify_token')}
                                                className="self-end mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
                                            >
                                                {copiedField === 'meta_webhook_verify_token' ? <FiCheck className="w-3.5 h-3.5" /> : <FiCopy className="w-3.5 h-3.5" />}
                                                <span>{copiedField === 'meta_webhook_verify_token' ? 'Copied' : 'Copy'}</span>
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Card Footer Info */}
                        <div className="flex items-center justify-between flex-wrap gap-4 mt-6 pt-4 border-t border-gray-200/60 dark:border-gray-700/60 text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-4 flex-wrap">
                                <span>Status: <strong className={isCurrentConfigured ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}>{isCurrentConfigured ? 'Fully Ready' : 'Incomplete'}</strong></span>
                                {savedConfig.modify_date && (
                                    <span>Last Modified: <strong>{new Date(savedConfig.modify_date).toLocaleString()}</strong></span>
                                )}
                                {savedConfig.modify_by && (
                                    <span>Updated by: <strong className="font-mono">{savedConfig.modify_by}</strong></span>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={() => handleOpenEditModal(savedConfig.provider_type === 'aisensy' ? 'own' : 'aisensy')}
                                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                            >
                                <span>Switch or configure alternate provider</span>
                                <FiArrowRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Side-by-side Overview / Switcher Cards */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                All Infrastructure Providers
                            </h2>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                Compare settings and switch between AiSensy Partner and Direct Meta Tech Provider.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* AiSensy Partner Card */}
                        <div className={`p-6 rounded-2xl border-2 transition-all duration-200 flex flex-col justify-between ${savedConfig.provider_type === 'aisensy'
                            ? 'bg-white dark:bg-gray-800 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                            : 'bg-white/70 dark:bg-gray-800/70 border-gray-200 dark:border-gray-700 hover:border-gray-300'
                            }`}>
                            <div>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                                            <FiZap className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                AiSensy Partner
                                                {savedConfig.provider_type === 'aisensy' && (
                                                    <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                                                        Active
                                                    </span>
                                                )}
                                            </h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Turnkey partner ecosystem with automated WABA linking
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`w-3 h-3 rounded-full ${savedConfig.provider_type === 'aisensy' ? 'bg-emerald-500 ring-4 ring-emerald-500/20' : 'bg-gray-300 dark:bg-gray-600'}`} />
                                </div>

                                <div className="mt-4 space-y-2 text-xs text-gray-600 dark:text-gray-300 border-t border-gray-100 dark:border-gray-700/60 pt-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Partner ID:</span>
                                        <span className="font-mono font-bold">{savedConfig.aisensy.partner_id || 'Not set'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Solution ID:</span>
                                        <span className="font-mono font-bold">{savedConfig.aisensy.solution_id || 'Not set'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">API Key:</span>
                                        <span className="font-mono">{savedConfig.aisensy.has_api_key ? '••••••••' : 'Missing'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-gray-700/60">
                                <button
                                    type="button"
                                    onClick={() => handleTestConnection('aisensy')}
                                    disabled={testing}
                                    className="text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1.5"
                                >
                                    <FiActivity className="w-3.5 h-3.5" />
                                    <span>Test AiSensy</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleOpenEditModal('aisensy')}
                                    className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-all flex items-center gap-1"
                                >
                                    <FiEdit3 className="w-3.5 h-3.5" />
                                    <span>Configure</span>
                                </button>
                            </div>
                        </div>

                        {/* Direct Meta Cloud Provider Card */}
                        <div className={`p-6 rounded-2xl border-2 transition-all duration-200 flex flex-col justify-between ${savedConfig.provider_type === 'own'
                            ? 'bg-white dark:bg-gray-800 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                            : 'bg-white/70 dark:bg-gray-800/70 border-gray-200 dark:border-gray-700 hover:border-gray-300'
                            }`}>
                            <div>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                                            <FiGlobe className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                Direct Meta Cloud Provider
                                                {savedConfig.provider_type === 'own' && (
                                                    <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                                                        Active
                                                    </span>
                                                )}
                                            </h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Direct Meta Developer App with custom Embedded Login Popup
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`w-3 h-3 rounded-full ${savedConfig.provider_type === 'own' ? 'bg-blue-500 ring-4 ring-blue-500/20' : 'bg-gray-300 dark:bg-gray-600'}`} />
                                </div>

                                <div className="mt-4 space-y-2 text-xs text-gray-600 dark:text-gray-300 border-t border-gray-100 dark:border-gray-700/60 pt-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Meta App ID:</span>
                                        <span className="font-mono font-bold">{savedConfig.own_meta.app_id || 'Not set'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Config ID:</span>
                                        <span className="font-mono font-bold">{savedConfig.own_meta.config_id || 'Not set'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Graph Version:</span>
                                        <span className="font-mono">{savedConfig.own_meta.graph_version || 'v21.0'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-gray-700/60">
                                <button
                                    type="button"
                                    onClick={() => handleTestConnection('own')}
                                    disabled={testing}
                                    className="text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1.5"
                                >
                                    <FiActivity className="w-3.5 h-3.5" />
                                    <span>Test Meta</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleOpenEditModal('own')}
                                    className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-all flex items-center gap-1"
                                >
                                    <FiEdit3 className="w-3.5 h-3.5" />
                                    <span>Configure</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* ========================================================================= */}
            {/* BIG EDIT MODAL - TAB-WISE CONFIGURATION WITH DIRTY TRACKING */}
            {/* ========================================================================= */}
            <AnimatePresence>
                {isEditModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleCloseEditModal}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                        />

                        {/* Modal Dialog Card */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 16 }}
                            className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 z-10 overflow-hidden"
                            role="dialog"
                        >
                            {/* Modal Header */}
                            <div className="shrink-0 p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/60 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/25">
                                        <FiSliders className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-black text-gray-900 dark:text-white">
                                                Edit WhatsApp Tech Provider Configuration
                                            </h3>
                                            {isDirty && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                                                    Unsaved Changes
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Configure credentials, update Solution IDs, or switch the production WhatsApp backend.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleCloseEditModal}
                                    className="p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800 transition-all"
                                >
                                    <FiX className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Active Provider Selector Banner in Modal */}
                            <div className="px-6 pt-5 pb-3 bg-indigo-50/40 dark:bg-indigo-950/20 border-b border-indigo-100 dark:border-indigo-900/30">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-200">
                                            Selected Active Provider For All User Projects:
                                        </span>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Determines whether Embedded Signup calls AiSensy or launches Meta Popup SDK.
                                        </p>
                                    </div>
                                    <div className="flex items-center bg-white dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => setDraftProviderType('aisensy')}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${draftProviderType === 'aisensy'
                                                ? 'bg-emerald-500 text-white shadow-sm'
                                                : 'text-gray-600 dark:text-gray-300 hover:text-emerald-600'
                                                }`}
                                        >
                                            <FiZap className="w-3.5 h-3.5" />
                                            <span>AiSensy Partner</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDraftProviderType('own')}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${draftProviderType === 'own'
                                                ? 'bg-blue-600 text-white shadow-sm'
                                                : 'text-gray-600 dark:text-gray-300 hover:text-blue-600'
                                                }`}
                                        >
                                            <FiGlobe className="w-3.5 h-3.5" />
                                            <span>Direct Meta Cloud</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Tabs Bar */}
                            <div className="flex border-b border-gray-200 dark:border-gray-800 px-6 bg-white dark:bg-gray-900 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setActiveModalTab('aisensy')}
                                    className={`py-3.5 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-2 ${activeModalTab === 'aisensy'
                                        ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                        }`}
                                >
                                    <FiZap className="w-4 h-4" />
                                    <span>AiSensy Partner Settings</span>
                                    {draftProviderType === 'aisensy' && (
                                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setActiveModalTab('own')}
                                    className={`py-3.5 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-2 ${activeModalTab === 'own'
                                        ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                        }`}
                                >
                                    <FiGlobe className="w-4 h-4" />
                                    <span>Direct Meta Cloud App Settings</span>
                                    {draftProviderType === 'own' && (
                                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                                    )}
                                </button>
                            </div>

                            {/* Modal Scrollable Form Body */}
                            <div className="overflow-y-auto flex-1 p-6 space-y-6 custom-scrollbar">

                                {/* Tab 1: AiSensy Form */}
                                {activeModalTab === 'aisensy' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-5"
                                    >
                                        <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
                                            <div>
                                                <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                                                    AiSensy Partner Credentials
                                                </h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    Obtain these from your AiSensy Partner Dashboard.
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleTestConnection('aisensy')}
                                                disabled={testing || !draftAisensyPartnerId}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 disabled:opacity-50 transition-all"
                                            >
                                                <FiActivity className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                                                <span>Test AiSensy Credentials</span>
                                            </button>
                                        </div>

                                        {/* Partner ID */}
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                                                Partner ID <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={draftAisensyPartnerId}
                                                onChange={(e) => setDraftAisensyPartnerId(e.target.value)}
                                                placeholder="e.g. 660c1d2e3f4a5b6c7d8e9f0a"
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/80 text-gray-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                            />
                                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                                Your unique AiSensy Partner Organization ID.
                                            </p>
                                        </div>

                                        {/* Solution ID (New Field) */}
                                        <div>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                    AiSensy Solution ID
                                                </label>
                                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded">
                                                    Optional
                                                </span>
                                            </div>
                                            <input
                                                type="text"
                                                value={draftAisensySolutionId}
                                                onChange={(e) => setDraftAisensySolutionId(e.target.value)}
                                                placeholder="e.g. sol_99281203"
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/80 text-gray-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                            />
                                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                                Custom solution / template pack identifier passed during WABA onboarding links.
                                            </p>
                                        </div>

                                        {/* Partner API Key */}
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                                                Partner API Key <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative flex items-center">
                                                <input
                                                    type={showAisensyKey ? 'text' : 'password'}
                                                    value={draftAisensyApiKey}
                                                    onChange={(e) => setDraftAisensyApiKey(e.target.value)}
                                                    placeholder="Enter or paste AiSensy Partner API Key"
                                                    className="w-full px-4 py-2.5 pr-20 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/80 text-gray-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                                />
                                                <div className="absolute right-2 flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowAisensyKey(!showAisensyKey)}
                                                        className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                                                        title={showAisensyKey ? 'Hide key' : 'Show key'}
                                                    >
                                                        {showAisensyKey ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4 text-emerald-600" />}
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                                Secured with server-side encryption. Leave masked to keep the existing key.
                                            </p>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Tab 2: Direct Meta Form */}
                                {activeModalTab === 'own' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-5"
                                    >
                                        <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
                                            <div>
                                                <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                                                    Direct Meta Developer App Credentials
                                                </h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    Configure your Facebook Developer Business App and Embedded Signup.
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleTestConnection('own')}
                                                disabled={testing || !draftMetaAppId}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 disabled:opacity-50 transition-all"
                                            >
                                                <FiActivity className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                                                <span>Test Meta App API</span>
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            {/* Meta App ID */}
                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                                                    Meta App ID <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={draftMetaAppId}
                                                    onChange={(e) => setDraftMetaAppId(e.target.value)}
                                                    placeholder="e.g. 123456789012345"
                                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/80 text-gray-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                                />
                                            </div>

                                            {/* Meta Embedded Config ID */}
                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                                                    Embedded Signup Config ID <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={draftMetaConfigId}
                                                    onChange={(e) => setDraftMetaConfigId(e.target.value)}
                                                    placeholder="e.g. 987654321098765"
                                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/80 text-gray-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            {/* Meta App Secret */}
                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                                                    Meta App Secret <span className="text-red-500">*</span>
                                                </label>
                                                <div className="relative flex items-center">
                                                    <input
                                                        type={showMetaSecret ? 'text' : 'password'}
                                                        value={draftMetaAppSecret}
                                                        onChange={(e) => setDraftMetaAppSecret(e.target.value)}
                                                        placeholder="App Secret from Basic Settings"
                                                        className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/80 text-gray-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowMetaSecret(!showMetaSecret)}
                                                        className="absolute right-2 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                                    >
                                                        {showMetaSecret ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4 text-blue-600" />}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Graph API Version */}
                                            <div>
                                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                                                    Graph API Version
                                                </label>
                                                <input
                                                    type="text"
                                                    value={draftMetaGraphVersion}
                                                    onChange={(e) => setDraftMetaGraphVersion(e.target.value)}
                                                    placeholder="v21.0"
                                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/80 text-gray-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                                />
                                            </div>
                                        </div>

                                        {/* System User Permanent Token */}
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                                                System User Permanent Token <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative flex items-center">
                                                <input
                                                    type={showSystemToken ? 'text' : 'password'}
                                                    value={draftMetaSystemUserToken}
                                                    onChange={(e) => setDraftMetaSystemUserToken(e.target.value)}
                                                    placeholder="EAAB..."
                                                    className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/80 text-gray-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowSystemToken(!showSystemToken)}
                                                    className="absolute right-2 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                                >
                                                    {showSystemToken ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4 text-blue-600" />}
                                                </button>
                                            </div>
                                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                                Permanent System User Token with <code className="text-blue-600 dark:text-blue-400 font-mono bg-blue-50 dark:bg-blue-900/30 px-1 py-0.5 rounded">whatsapp_business_management</code> and <code className="text-blue-600 dark:text-blue-400 font-mono bg-blue-50 dark:bg-blue-900/30 px-1 py-0.5 rounded">whatsapp_business_messaging</code> permissions.
                                            </p>
                                        </div>

                                        {/* Webhook Verify Token */}
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                                                Webhook Verify Token <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative flex items-center">
                                                <input
                                                    type={showWebhookToken ? 'text' : 'password'}
                                                    value={draftMetaWebhookVerifyToken}
                                                    onChange={(e) => setDraftMetaWebhookVerifyToken(e.target.value)}
                                                    placeholder="custom_verify_token"
                                                    className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/80 text-gray-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowWebhookToken(!showWebhookToken)}
                                                    className="absolute right-2 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                                >
                                                    {showWebhookToken ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4 text-blue-600" />}
                                                </button>
                                            </div>
                                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                                Secret token matched with your Meta Webhook subscription URL configuration.
                                            </p>
                                        </div>
                                    </motion.div>
                                )}

                            </div>

                            {/* Modal Footer Actions */}
                            <div className="shrink-0 p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/80 flex items-center justify-between gap-4">
                                <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                                    {isDirty ? (
                                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                            Changes ready to be saved
                                        </span>
                                    ) : (
                                        <span>No unsaved modifications</span>
                                    )}
                                </div>

                                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                                    <button
                                        type="button"
                                        onClick={handleCloseEditModal}
                                        className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleSave}
                                        disabled={saving || !isDirty}
                                        className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 shadow-lg shadow-indigo-600/30 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        <FiSave className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
                                        <span>{saving ? 'Saving Changes...' : 'Save Configuration'}</span>
                                    </button>
                                </div>
                            </div>

                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
}
