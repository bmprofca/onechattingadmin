import React, { useState, useEffect, useCallback } from 'react';
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
    FiAlertCircle,
    FiSliders
} from 'react-icons/fi';
import { apiCall } from '../utils/apiCall';
import toast from 'react-hot-toast';

export default function TechProvider() {
    const [loading, setLoading] = useState(false);
    const [testing, setTesting] = useState(false);
    const [saving, setSaving] = useState(false);
    const [providerType, setProviderType] = useState('aisensy');

    // Credentials State
    const [aisensyPartnerId, setAisensyPartnerId] = useState('');
    const [aisensyApiKey, setAisensyApiKey] = useState('');

    const [metaAppId, setMetaAppId] = useState('');
    const [metaAppSecret, setMetaAppSecret] = useState('');
    const [metaConfigId, setMetaConfigId] = useState('');
    const [metaSystemUserToken, setMetaSystemUserToken] = useState('');
    const [metaWebhookVerifyToken, setMetaWebhookVerifyToken] = useState('');
    const [metaGraphVersion, setMetaGraphVersion] = useState('v21.0');

    // Visibility toggles
    const [showAisensyKey, setShowAisensyKey] = useState(false);
    const [showMetaSecret, setShowMetaSecret] = useState(false);
    const [showSystemToken, setShowSystemToken] = useState(false);
    const [showWebhookToken, setShowWebhookToken] = useState(false);

    // Copy states
    const [copiedField, setCopiedField] = useState(null);

    // Connection test state
    const [lastTestResult, setLastTestResult] = useState(null);

    const handleCopy = (text, fieldName) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        toast.success('Copied to clipboard');
        setTimeout(() => setCopiedField(null), 2000);
    };

    const loadConfig = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiCall('/admin/tech-provider/config', 'GET');
            const data = await res.json();
            if (data && !data.error) {
                const d = data.data || {};
                setProviderType(d.provider_type || 'aisensy');

                setAisensyPartnerId(d.aisensy?.partner_id || '');
                setAisensyApiKey(d.aisensy?.api_key_masked || d.aisensy?.api_key || '');

                setMetaAppId(d.own_meta?.app_id || '');
                setMetaAppSecret(d.own_meta?.app_secret_masked || d.own_meta?.app_secret || '');
                setMetaConfigId(d.own_meta?.config_id || '');
                setMetaSystemUserToken(d.own_meta?.system_user_token_masked || d.own_meta?.system_user_token || '');
                setMetaWebhookVerifyToken(d.own_meta?.webhook_verify_token_masked || d.own_meta?.webhook_verify_token || '');
                setMetaGraphVersion(d.own_meta?.graph_version || 'v21.0');
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

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                provider_type: providerType,
                aisensy_partner_id: aisensyPartnerId,
                aisensy_api_key: aisensyApiKey,
                meta_app_id: metaAppId,
                meta_app_secret: metaAppSecret,
                meta_config_id: metaConfigId,
                meta_system_user_token: metaSystemUserToken,
                meta_webhook_verify_token: metaWebhookVerifyToken,
                meta_graph_version: metaGraphVersion
            };

            const res = await apiCall('/admin/tech-provider/config', 'POST', payload);
            const data = await res.json();

            if (data && !data.error) {
                toast.success(data.message || 'Tech Provider configuration saved successfully!');
                loadConfig();
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

    const handleTest = async () => {
        setTesting(true);
        setLastTestResult(null);
        try {
            const payload = {
                provider_type: providerType,
                aisensy: { partner_id: aisensyPartnerId, api_key: aisensyApiKey },
                own_meta: {
                    app_id: metaAppId,
                    app_secret: metaAppSecret,
                    system_user_token: metaSystemUserToken,
                    graph_version: metaGraphVersion
                }
            };

            const res = await apiCall('/admin/tech-provider/test-connection', 'POST', payload);
            const data = await res.json();

            if (data?.success || data?.error === false) {
                setLastTestResult({ success: true, message: data.message || 'Connection verified successfully!' });
                toast.success(data.message || 'Connection test successful!');
            } else {
                const errMsg = data.message || data.error || 'Connection test failed.';
                setLastTestResult({ success: false, message: errMsg });
                toast.error(errMsg);
            }
        } catch (err) {
            console.error('Test error:', err);
            const msg = 'Failed to execute connection test.';
            setLastTestResult({ success: false, message: msg });
            toast.error(msg);
        } finally {
            setTesting(false);
        }
    };

    // Calculate configuration status
    const isAisensyConfigured = Boolean(aisensyPartnerId && aisensyApiKey);
    const isMetaConfigured = Boolean(metaAppId && metaAppSecret && metaConfigId && metaSystemUserToken);
    const isCurrentConfigured = providerType === 'aisensy' ? isAisensyConfigured : isMetaConfigured;

    return (
        <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto space-y-8">
                
                {/* Header Banner */}
                <div className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-8 border border-gray-200/80 dark:border-gray-700/80 shadow-xl shadow-gray-100/50 dark:shadow-none">
                    <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-gradient-to-br from-indigo-500/10 via-blue-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-start sm:items-center gap-4">
                            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
                                <FiServer className="w-7 h-7" />
                            </div>
                            <div>
                                <div className="flex items-center gap-3 flex-wrap">
                                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                                        Tech Provider & Embedded Login
                                    </h1>
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase shadow-sm ${
                                        providerType === 'aisensy'
                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                                            : 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800'
                                    }`}>
                                        <span className={`w-2 h-2 rounded-full ${providerType === 'aisensy' ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500 animate-pulse'}`} />
                                        {providerType === 'aisensy' ? 'AiSensy Partner Mode' : 'Direct Meta Mode'}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 max-w-2xl">
                                    Manage WhatsApp Business Onboarding & Cloud API credentials. Choose whether client onboarding runs through AiSensy Partner or your direct Meta Developer Tech Provider App.
                                </p>
                            </div>
                        </div>

                        {/* Top Action Buttons */}
                        <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
                            <button
                                type="button"
                                onClick={loadConfig}
                                disabled={loading}
                                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-xl transition-all disabled:opacity-50"
                            >
                                <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={saving}
                                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] rounded-xl shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50"
                            >
                                <FiSave className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
                                <span>{saving ? 'Saving...' : 'Save Settings'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100 dark:border-gray-700/60">
                        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800">
                            <div className="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                <FiSliders className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Active Provider</p>
                                <p className="text-sm font-bold text-gray-900 dark:text-white capitalize">
                                    {providerType === 'aisensy' ? 'AiSensy Partner' : 'Direct Meta Cloud'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800">
                            <div className={`p-2.5 rounded-lg ${isCurrentConfigured ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'}`}>
                                <FiShield className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Configuration Status</p>
                                <p className={`text-sm font-bold ${isCurrentConfigured ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                    {isCurrentConfigured ? 'Fully Configured' : 'Incomplete / Missing Keys'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800">
                            <div className="p-2.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                                <FiActivity className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Graph API Version</p>
                                <p className="text-sm font-bold text-gray-900 dark:text-white font-mono">
                                    {metaGraphVersion || 'v21.0'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Provider Selection Cards */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                Choose Active WhatsApp Provider
                            </h2>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                Select which infrastructure handles client onboarding & WhatsApp API routing.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* AiSensy Partner Option */}
                        <div
                            onClick={() => setProviderType('aisensy')}
                            className={`group relative cursor-pointer p-6 rounded-2xl border-2 transition-all duration-200 ${
                                providerType === 'aisensy'
                                    ? 'bg-gradient-to-b from-emerald-50/50 to-white dark:from-emerald-950/20 dark:to-gray-800 border-emerald-500 dark:border-emerald-500 shadow-lg shadow-emerald-500/10'
                                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md'
                            }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3.5">
                                    <div className={`p-3 rounded-xl transition-colors ${
                                        providerType === 'aisensy'
                                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                                            : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                                    }`}>
                                        <FiZap className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-gray-900 dark:text-white">
                                            AiSensy Partner
                                        </h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                            Official Partner Infrastructure
                                        </p>
                                    </div>
                                </div>

                                {providerType === 'aisensy' ? (
                                    <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-emerald-500 text-white shadow-sm">
                                        <FiCheckCircle className="w-3.5 h-3.5" /> ACTIVE
                                    </span>
                                ) : (
                                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-colors">
                                        Select
                                    </span>
                                )}
                            </div>

                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-4 leading-relaxed">
                                Route client embedded signups through AiSensy's partner link and automated token verification APIs.
                            </p>

                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/60 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                <span className="flex items-center gap-1 font-medium">
                                    <FiCheck className="w-3.5 h-3.5 text-emerald-500" /> Automated Onboarding
                                </span>
                                <span className="flex items-center gap-1 font-medium">
                                    <FiCheck className="w-3.5 h-3.5 text-emerald-500" /> Partner Console
                                </span>
                            </div>
                        </div>

                        {/* Own Meta Option */}
                        <div
                            onClick={() => setProviderType('own')}
                            className={`group relative cursor-pointer p-6 rounded-2xl border-2 transition-all duration-200 ${
                                providerType === 'own'
                                    ? 'bg-gradient-to-b from-blue-50/50 to-white dark:from-blue-950/20 dark:to-gray-800 border-blue-600 dark:border-blue-500 shadow-lg shadow-blue-500/10'
                                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md'
                            }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3.5">
                                    <div className={`p-3 rounded-xl transition-colors ${
                                        providerType === 'own'
                                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                                            : 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                                    }`}>
                                        <FiGlobe className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-gray-900 dark:text-white">
                                            Own Meta Tech Provider
                                        </h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                            Direct Meta Cloud API & Embedded Signup
                                        </p>
                                    </div>
                                </div>

                                {providerType === 'own' ? (
                                    <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-blue-600 text-white shadow-sm">
                                        <FiCheckCircle className="w-3.5 h-3.5" /> ACTIVE
                                    </span>
                                ) : (
                                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-colors">
                                        Select
                                    </span>
                                )}
                            </div>

                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-4 leading-relaxed">
                                Direct Meta WhatsApp Embedded Signup using your own Meta Developer App ID, Config ID, and System User Token.
                            </p>

                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/60 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                <span className="flex items-center gap-1 font-medium">
                                    <FiCheck className="w-3.5 h-3.5 text-blue-500" /> Direct Cloud API
                                </span>
                                <span className="flex items-center gap-1 font-medium">
                                    <FiCheck className="w-3.5 h-3.5 text-blue-500" /> Full App Control
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Configuration Details Card */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200/80 dark:border-gray-700/80 p-6 sm:p-8 shadow-xl shadow-gray-100/50 dark:shadow-none space-y-6">
                    
                    {/* AISENSY FORM */}
                    {providerType === 'aisensy' && (
                        <div className="space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-gray-100 dark:border-gray-700/80 gap-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                            AiSensy Partner Credentials
                                        </h2>
                                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                            Partner API
                                        </span>
                                    </div>
                                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        Enter your Partner ID and API Secret obtained from your AiSensy Partner Console.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                                        AiSensy Partner ID <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={aisensyPartnerId}
                                            onChange={(e) => setAisensyPartnerId(e.target.value)}
                                            placeholder="e.g. prt_1234567890"
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                        />
                                        {aisensyPartnerId && (
                                            <button
                                                type="button"
                                                onClick={() => handleCopy(aisensyPartnerId, 'aisensyPartnerId')}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5"
                                                title="Copy Partner ID"
                                            >
                                                {copiedField === 'aisensyPartnerId' ? <FiCheck className="w-4 h-4 text-emerald-500" /> : <FiCopy className="w-4 h-4" />}
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                                        Identifies your partner account for onboarding URL generation.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                                        AiSensy Partner API Key <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative flex items-center">
                                        <input
                                            type={showAisensyKey ? 'text' : 'password'}
                                            value={aisensyApiKey}
                                            onChange={(e) => setAisensyApiKey(e.target.value)}
                                            placeholder="••••••••••••••••••••••••"
                                            className="w-full px-4 py-3 pr-20 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                        />
                                        <div className="absolute right-2 flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => setShowAisensyKey(!showAisensyKey)}
                                                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                                title={showAisensyKey ? 'Hide key' : 'Show key'}
                                            >
                                                {showAisensyKey ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4 text-emerald-600" />}
                                            </button>
                                            {aisensyApiKey && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleCopy(aisensyApiKey, 'aisensyApiKey')}
                                                    className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                                    title="Copy API key"
                                                >
                                                    {copiedField === 'aisensyApiKey' ? <FiCheck className="w-4 h-4 text-emerald-500" /> : <FiCopy className="w-4 h-4" />}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                                        Secret key used to verify and exchange client WABA tokens.
                                    </p>
                                </div>
                            </div>

                            {/* AiSensy Info Card */}
                            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/40 text-xs sm:text-sm text-emerald-900 dark:text-emerald-200 space-y-2">
                                <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300">
                                    <FiInfo className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                    <span>How AiSensy Partner Integration Works:</span>
                                </div>
                                <p className="text-emerald-700 dark:text-emerald-300/90 leading-relaxed pl-6">
                                    When a user initiates WhatsApp Embedded Signup, they are redirected using your AiSensy Partner link. Upon successful authorization, the server captures their WABA ID and Access Token via the AiSensy partner callback.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* OWN META FORM */}
                    {providerType === 'own' && (
                        <div className="space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-gray-100 dark:border-gray-700/80 gap-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                            Meta Developer App Configuration
                                        </h2>
                                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                            Cloud API v21.0
                                        </span>
                                    </div>
                                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        Direct Meta Developer App with WhatsApp Product & Embedded Signup (FBE) configuration.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                                        Meta App ID <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={metaAppId}
                                            onChange={(e) => setMetaAppId(e.target.value)}
                                            placeholder="e.g. 104829482910394"
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        />
                                        {metaAppId && (
                                            <button
                                                type="button"
                                                onClick={() => handleCopy(metaAppId, 'metaAppId')}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5"
                                                title="Copy App ID"
                                            >
                                                {copiedField === 'metaAppId' ? <FiCheck className="w-4 h-4 text-blue-500" /> : <FiCopy className="w-4 h-4" />}
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                                        Found in your Meta Developer App Dashboard.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                                        Embedded Signup Configuration ID <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={metaConfigId}
                                            onChange={(e) => setMetaConfigId(e.target.value)}
                                            placeholder="e.g. 98402948192039"
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        />
                                        {metaConfigId && (
                                            <button
                                                type="button"
                                                onClick={() => handleCopy(metaConfigId, 'metaConfigId')}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5"
                                                title="Copy Config ID"
                                            >
                                                {copiedField === 'metaConfigId' ? <FiCheck className="w-4 h-4 text-blue-500" /> : <FiCopy className="w-4 h-4" />}
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                                        Config ID created under WhatsApp &gt; Quickstart &gt; Embedded Signup.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                                        Meta App Secret <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative flex items-center">
                                        <input
                                            type={showMetaSecret ? 'text' : 'password'}
                                            value={metaAppSecret}
                                            onChange={(e) => setMetaAppSecret(e.target.value)}
                                            placeholder="••••••••••••••••••••••••"
                                            className="w-full px-4 py-3 pr-20 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        />
                                        <div className="absolute right-2 flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => setShowMetaSecret(!showMetaSecret)}
                                                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                                title={showMetaSecret ? 'Hide secret' : 'Show secret'}
                                            >
                                                {showMetaSecret ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4 text-blue-600" />}
                                            </button>
                                            {metaAppSecret && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleCopy(metaAppSecret, 'metaAppSecret')}
                                                    className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                                    title="Copy App Secret"
                                                >
                                                    {copiedField === 'metaAppSecret' ? <FiCheck className="w-4 h-4 text-blue-500" /> : <FiCopy className="w-4 h-4" />}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                                        Found in App Settings &gt; Basic &gt; App Secret.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                                        Graph API Version
                                    </label>
                                    <input
                                        type="text"
                                        value={metaGraphVersion}
                                        onChange={(e) => setMetaGraphVersion(e.target.value)}
                                        placeholder="v21.0"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    />
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                                        Default is v21.0 (recommended by Meta).
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                                    System User Permanent Access Token <span className="text-red-500">*</span>
                                </label>
                                <div className="relative flex items-center">
                                    <input
                                        type={showSystemToken ? 'text' : 'password'}
                                        value={metaSystemUserToken}
                                        onChange={(e) => setMetaSystemUserToken(e.target.value)}
                                        placeholder="EAAB..."
                                        className="w-full px-4 py-3 pr-20 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    />
                                    <div className="absolute right-2 flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => setShowSystemToken(!showSystemToken)}
                                            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                            title={showSystemToken ? 'Hide token' : 'Show token'}
                                        >
                                            {showSystemToken ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4 text-blue-600" />}
                                        </button>
                                        {metaSystemUserToken && (
                                            <button
                                                type="button"
                                                onClick={() => handleCopy(metaSystemUserToken, 'metaSystemUserToken')}
                                                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                                title="Copy System User Token"
                                            >
                                                {copiedField === 'metaSystemUserToken' ? <FiCheck className="w-4 h-4 text-blue-500" /> : <FiCopy className="w-4 h-4" />}
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                                    System User Token with <code className="text-blue-600 dark:text-blue-400 font-mono bg-blue-50 dark:bg-blue-900/30 px-1 py-0.5 rounded">whatsapp_business_management</code> and <code className="text-blue-600 dark:text-blue-400 font-mono bg-blue-50 dark:bg-blue-900/30 px-1 py-0.5 rounded">whatsapp_business_messaging</code> permissions.
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                                    Webhook Verify Token <span className="text-red-500">*</span>
                                </label>
                                <div className="relative flex items-center">
                                    <input
                                        type={showWebhookToken ? 'text' : 'password'}
                                        value={metaWebhookVerifyToken}
                                        onChange={(e) => setMetaWebhookVerifyToken(e.target.value)}
                                        placeholder="custom_verify_token"
                                        className="w-full px-4 py-3 pr-20 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    />
                                    <div className="absolute right-2 flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => setShowWebhookToken(!showWebhookToken)}
                                            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                            title={showWebhookToken ? 'Hide token' : 'Show token'}
                                        >
                                            {showWebhookToken ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4 text-blue-600" />}
                                        </button>
                                        {metaWebhookVerifyToken && (
                                            <button
                                                type="button"
                                                onClick={() => handleCopy(metaWebhookVerifyToken, 'metaWebhookVerifyToken')}
                                                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                                title="Copy Webhook Verify Token"
                                            >
                                                {copiedField === 'metaWebhookVerifyToken' ? <FiCheck className="w-4 h-4 text-blue-500" /> : <FiCopy className="w-4 h-4" />}
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                                    Token specified when configuring Meta Webhook endpoint in Meta Developer App.
                                </p>
                            </div>

                            {/* Meta Checklist Card */}
                            <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50/70 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200/80 dark:border-blue-900/40 text-xs sm:text-sm text-blue-900 dark:text-blue-200 space-y-3">
                                <div className="flex items-center gap-2 font-bold text-blue-800 dark:text-blue-300">
                                    <FiInfo className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    <span>Direct Meta Embedded Signup Checklist:</span>
                                </div>
                                <ul className="list-disc list-inside space-y-1.5 text-gray-600 dark:text-gray-300 pl-1 leading-relaxed">
                                    <li>Create a <strong>Meta Developer Business App</strong> with <strong>WhatsApp</strong> product enabled.</li>
                                    <li>Set up <strong>Embedded Signup Configuration</strong> in WhatsApp Manager and note the <strong>Configuration ID</strong>.</li>
                                    <li>Create a <strong>System User</strong> with Admin access in <strong>Meta Business Manager</strong> and generate a permanent token with <code className="text-blue-600 dark:text-blue-300 bg-white/70 dark:bg-gray-800 px-1 py-0.5 rounded">whatsapp_business_management</code> permission.</li>
                                    <li>Subscribe to WhatsApp Webhooks (<code className="text-blue-600 dark:text-blue-300 bg-white/70 dark:bg-gray-800 px-1 py-0.5 rounded">messages</code>, <code className="text-blue-600 dark:text-blue-300 bg-white/70 dark:bg-gray-800 px-1 py-0.5 rounded">account_update</code>) using your Verify Token.</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Test Results Message */}
                    {lastTestResult && (
                        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
                            lastTestResult.success
                                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : 'bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                        }`}>
                            {lastTestResult.success ? (
                                <FiCheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            ) : (
                                <FiAlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                            )}
                            <div className="flex-1">
                                <span className="font-bold">{lastTestResult.success ? 'Success: ' : 'Failed: '}</span>
                                <span>{lastTestResult.message}</span>
                            </div>
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-100 dark:border-gray-700/80">
                        <button
                            type="button"
                            onClick={handleTest}
                            disabled={testing}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-xl transition-all disabled:opacity-50"
                        >
                            <FiActivity className={`w-4 h-4 ${testing ? 'animate-spin text-blue-500' : 'text-gray-500'}`} />
                            <span>{testing ? 'Testing Connection...' : 'Test Connection'}</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] rounded-xl shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50"
                        >
                            <FiSave className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
                            <span>{saving ? 'Saving Changes...' : 'Save Configuration'}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
