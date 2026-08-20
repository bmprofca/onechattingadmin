import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FiDollarSign,
    FiTrendingUp,
    FiTrendingDown,
    FiPlus,
    FiRefreshCw,
    FiEdit2,
    FiTrash2,
    FiX,
    FiTag,
    FiAlertTriangle,
    FiArrowDownCircle,
    FiArrowUpCircle
} from 'react-icons/fi';
import { apiCall } from '../utils/apiCall';
import toast from 'react-hot-toast';
import SelectField from '../component/common/SelectField';
import ManagementTable from '../component/common/ManagementTable';

/* -------------------------------------------------------------------------- */
/*  Constants & helpers                                                       */
/* -------------------------------------------------------------------------- */

// Single source of truth for supported providers — must mirror the
// providers the auto-reply engine actually knows how to call, and the
// KNOWN_PROVIDERS list validated against on the backend.
const providerOptions = [
    { value: "openai", label: "OpenAI" },
    { value: "anthropic", label: "Claude" },
    { value: "gemini", label: "Google Gemini" },
    { value: "groq", label: "Groq" },
];

// Derived from providerOptions so nothing can drift out of sync.
const KNOWN_PROVIDERS = providerOptions.map((opt) => opt.value);
const PROVIDER_LABELS = providerOptions.reduce((acc, opt) => {
    acc[opt.value] = opt.label;
    return acc;
}, {});

const PROVIDER_STYLES = {
    gemini: 'from-blue-500 to-blue-600 shadow-blue-500/20',
    openai: 'from-emerald-500 to-emerald-600 shadow-emerald-500/20',
    anthropic: 'from-orange-500 to-orange-600 shadow-orange-500/20',
    groq: 'from-fuchsia-500 to-fuchsia-600 shadow-fuchsia-500/20',
};

const providerBadgeClass = (provider) =>
    `bg-gradient-to-br ${PROVIDER_STYLES[provider] || 'from-gray-400 to-gray-500 shadow-gray-500/20'}`;

const formatRate = (val) => {
    const num = Number(val);
    if (Number.isNaN(num)) return '—';
    return `₹${num.toFixed(4)}`;
};

const formatDate = (val) => {
    if (!val) return '—';
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

/* -------------------------------------------------------------------------- */
/*  Add / Edit Modal                                                          */
/* -------------------------------------------------------------------------- */

const PricingFormModal = ({ isOpen, onClose, tokens, editingRow, onSaved }) => {
    const isEdit = !!editingRow;
    const [provider, setProvider] = useState(providerOptions[0].value);
    const [inputPrice, setInputPrice] = useState('');
    const [outputPrice, setOutputPrice] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setProvider(editingRow?.provider || providerOptions[0].value);
            setInputPrice(editingRow ? String(editingRow.input_price_per_1k ?? '') : '');
            setOutputPrice(editingRow ? String(editingRow.output_price_per_1k ?? '') : '');
            setError('');
        }
    }, [isOpen, editingRow]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const inputNum = Number(inputPrice);
        const outputNum = Number(outputPrice);
        if (inputPrice === '' || Number.isNaN(inputNum) || inputNum < 0) {
            toast.error('Input price must be a non-negative number.');
            return;
        }
        if (outputPrice === '' || Number.isNaN(outputNum) || outputNum < 0) {
            toast.error('Output price must be a non-negative number.');
            return;
        }

        setSaving(true);

        try {
            const headers = {
                'x-token': tokens?.token,
                username: tokens?.username,
            };

            let response;
            if (isEdit) {
                // Backend PUT route is keyed on unique_id, not provider.
                response = await apiCall(
                    `/admin/ai-model-pricing/${encodeURIComponent(editingRow.unique_id)}`,
                    'PUT',
                    { input_price_per_1k: inputNum, output_price_per_1k: outputNum },
                    headers,
                );
            } else {
                response = await apiCall(
                    '/admin/ai-model-pricing',
                    'POST',
                    {
                        provider,
                        input_price_per_1k: inputNum,
                        output_price_per_1k: outputNum,
                    },
                    headers,
                );
            }
            const responseData = await response.json();

            if (response.ok && !responseData?.error) {
                toast.success(isEdit ? 'Pricing updated.' : 'Pricing added.');
                onSaved();
                onClose();
            } else {
                const message = responseData?.message || responseData?.error || 'Something went wrong.';
                setError(message);
                toast.error(message);
            }
        } catch (err) {
            toast.error(err?.message || 'Server error. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
                onClick={saving ? undefined : onClose}
            />
            <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-teal-500/5 to-cyan-600/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-lg shadow-lg shadow-teal-500/20">
                            <FiDollarSign className="text-white" size={18} />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                            {isEdit ? 'Edit Provider Pricing' : 'Add Provider Pricing'}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                        <FiX size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                    {error && (
                        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
                            <FiAlertTriangle className="flex-shrink-0" size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-2">
                            Provider
                        </label>
                        <SelectField
                            options={providerOptions}
                            value={providerOptions.find((opt) => opt.value === provider) || null}
                            onChange={(selected) => setProvider(selected ? selected.value : "")}
                            isDisabled={isEdit}
                            isSearchable={false}
                        />
                        {isEdit && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                                Provider can't be changed here — delete and re-add to set a different provider.
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-2">
                                <FiArrowDownCircle size={12} />
                                Input ₹ / 1K
                            </label>
                            <input
                                type="number"
                                step="0.0001"
                                min="0"
                                value={inputPrice}
                                onChange={(e) => setInputPrice(e.target.value)}
                                placeholder="0.2500"
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 dark:text-white text-sm font-mono transition-all"
                            />
                        </div>
                        <div>
                            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-2">
                                <FiArrowUpCircle size={12} />
                                Output ₹ / 1K
                            </label>
                            <input
                                type="number"
                                step="0.0001"
                                min="0"
                                value={outputPrice}
                                onChange={(e) => setOutputPrice(e.target.value)}
                                placeholder="1.2500"
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 dark:text-white text-sm font-mono transition-all"
                            />
                        </div>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 -mt-2">
                        Rupees charged per 1,000 tokens, before the platform's 10% markup is added at billing time.
                    </p>

                    <div className="flex items-center gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className="flex-1 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-600 text-white text-sm font-medium shadow-lg shadow-teal-500/20 hover:shadow-xl hover:shadow-teal-500/30 transition-all disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Pricing'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

/* -------------------------------------------------------------------------- */
/*  Delete Confirmation Modal                                                 */
/* -------------------------------------------------------------------------- */

const DeleteConfirmModal = ({ isOpen, onClose, tokens, row, onDeleted }) => {
    const [deleting, setDeleting] = useState(false);

    if (!isOpen) return null;

    const handleDelete = async () => {
        setDeleting(true);

        try {
            // Backend DELETE route is keyed on unique_id, not provider.
            const response = await apiCall(
                `/admin/ai-model-pricing/${encodeURIComponent(row.unique_id)}`,
                'DELETE',
                null,
                {
                    'x-token': tokens?.token,
                    username: tokens?.username,
                },
            );
            const responseData = await response.json();
            if (response.ok && !responseData?.error) {
                toast.success('Pricing deleted.');
                onDeleted(row);
                onClose();
            } else {
                toast.error(responseData?.message || responseData?.error || 'Failed to delete pricing.');
            }
        } catch (err) {
            toast.error(err?.message || 'Server error. Please try again.');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
                onClick={deleting ? undefined : onClose}
            />
            <div className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
                <div className="px-6 py-6 text-center">
                    <div className="mx-auto mb-4 p-3 w-fit bg-red-50 dark:bg-red-900/30 rounded-full">
                        <FiTrash2 className="text-red-500 dark:text-red-400" size={22} />
                    </div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">
                        Delete pricing for {PROVIDER_LABELS[row?.provider] || row?.provider}?
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Usage logged against {PROVIDER_LABELS[row?.provider] || row?.provider} after this
                        won't be billed until pricing is added again.
                    </p>
                </div>
                <div className="flex items-center gap-3 px-6 pb-6">
                    <button
                        onClick={onClose}
                        disabled={deleting}
                        className="flex-1 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-red-500 to-rose-600 text-white text-sm font-medium shadow-lg shadow-red-500/20 hover:shadow-xl transition-all disabled:opacity-50"
                    >
                        {deleting ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
};

/* -------------------------------------------------------------------------- */
/*  Main Page                                                                 */
/* -------------------------------------------------------------------------- */

const AiModelPricing = () => {
    const navigate = useNavigate();

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tokens, setTokens] = useState(null);

    const [formModalOpen, setFormModalOpen] = useState(false);
    const [editingRow, setEditingRow] = useState(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deletingRow, setDeletingRow] = useState(null);

    useEffect(() => {
        const data = localStorage.getItem('user_data') || localStorage.getItem('userData') || sessionStorage.getItem('userData');
        if (data) {
            setTokens(JSON.parse(data));
        } else {
            navigate('/login');
        }
    }, [navigate]);

    const fetchPricing = useCallback(async () => {
        if (!tokens?.token) return;
        setLoading(true);

        try {
            // GET /admin/ai-model-pricing supports ?provider, ?search, ?page & ?limit —
            // fetching a generous page here since the table isn't paginated in the UI yet.
            const response = await apiCall('/admin/ai-model-pricing?limit=100', 'GET', null, {
                'x-token': tokens.token,
                username: tokens.username,
            });
            const responseData = await response.json();

            if (response.ok && !responseData?.error) {
                setRows(responseData.data || []);
            } else {
                toast.error(responseData?.message || responseData?.error || 'Failed to fetch pricing');
            }
        } catch (err) {
            toast.error('Authorization failed or server error');
        } finally {
            setLoading(false);
        }
    }, [tokens]);

    useEffect(() => {
        fetchPricing();
    }, [fetchPricing]);

    const totalRows = rows.length;
    const avgInputPrice = totalRows
        ? rows.reduce((sum, r) => sum + Number(r.input_price_per_1k || 0), 0) / totalRows
        : 0;
    const avgOutputPrice = totalRows
        ? rows.reduce((sum, r) => sum + Number(r.output_price_per_1k || 0), 0) / totalRows
        : 0;

    const openAddModal = () => {
        setEditingRow(null);
        setFormModalOpen(true);
    };

    const openEditModal = (row) => {
        setEditingRow(row);
        setFormModalOpen(true);
    };

    const openDeleteModal = (row) => {
        setDeletingRow(row);
        setDeleteModalOpen(true);
    };

    // Match by unique_id — that's the identity key the backend actually
    // operates on (provider is just a field on the row).
    const handleDeleted = (row) => {
        setRows((prev) => prev.filter((r) => r.unique_id !== row.unique_id));
    };

    const pricingColumns = [
        {
            key: 'provider',
            label: 'Provider',
            render: (row) => (
                <div className="flex items-center justify-start gap-3">
                    <div className={`h-9 w-9 rounded-lg text-white flex items-center justify-center font-bold text-sm shadow-lg ${providerBadgeClass(row.provider)}`}>
                        {(PROVIDER_LABELS[row.provider] || row.provider || '?').charAt(0)}
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {PROVIDER_LABELS[row.provider] || row.provider}
                    </span>
                </div>
            ),
        },
        {
            key: 'input_price_per_1k',
            label: 'Input ₹/1K',
            render: (row) => (
                <span className="inline-flex items-center gap-1.5 text-sm font-mono font-semibold text-gray-900 dark:text-white">
                    <FiArrowDownCircle className="text-teal-500" size={13} />
                    {formatRate(row.input_price_per_1k)}
                </span>
            ),
        },
        {
            key: 'output_price_per_1k',
            label: 'Output ₹/1K',
            render: (row) => (
                <span className="inline-flex items-center gap-1.5 text-sm font-mono font-semibold text-gray-900 dark:text-white">
                    <FiArrowUpCircle className="text-cyan-600" size={13} />
                    {formatRate(row.output_price_per_1k)}
                </span>
            ),
        },
        {
            key: 'create_date',
            label: 'Created',
            render: (row) => (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(row.create_date)}
                </span>
            ),
        },
        {
            key: 'update_date',
            label: 'Updated',
            render: (row) => (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(row.update_date)}
                </span>
            ),
        },
    ];

    const pricingActions = (row) => [
        { label: 'Edit pricing', icon: <FiEdit2 />, onClick: () => openEditModal(row) },
        { label: 'Delete pricing', icon: <FiTrash2 />, className: 'text-rose-600 dark:text-rose-400', onClick: () => openDeleteModal(row) },
    ];

    return (
        <div className="min-h-screen">
            <div className="transition-all duration-300 ease-in-out">
                <div className="max-w-8xl mx-auto">
                    {/* Page Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-lg shadow-lg shadow-teal-500/20">
                                <FiDollarSign className="text-white" size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                                    AI Provider Pricing
                                </h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Set the per-token rate used to bill auto-reply usage, before the platform's markup
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button type="button" onClick={fetchPricing} disabled={loading} title="Refresh pricing" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600 shadow-md shadow-gray-300/30 transition-all hover:bg-gray-50 hover:shadow-lg active:translate-y-px disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:shadow-black/20 dark:hover:bg-gray-700">
                                <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                                <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
                            </button>
                            <button onClick={openAddModal} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-600 px-4 text-sm font-medium text-white shadow-lg shadow-teal-500/25 transition-all hover:shadow-xl active:translate-y-px">
                                <FiPlus size={16} /> Add Pricing
                            </button>
                        </div>
                    </div>

                    {/* Stats Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Providers Priced</p>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{totalRows}</h3>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">of {KNOWN_PROVIDERS.length} supported</p>
                                </div>
                                <div className="p-4 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg shadow-lg shadow-teal-500/20">
                                    <FiTag className="text-white" size={24} />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Avg Input ₹/1K</p>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{formatRate(avgInputPrice)}</h3>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Across priced providers</p>
                                </div>
                                <div className="p-4 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-lg shadow-lg shadow-teal-500/20">
                                    <FiTrendingDown className="text-white" size={24} />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Avg Output ₹/1K</p>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{formatRate(avgOutputPrice)}</h3>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Across priced providers</p>
                                </div>
                                <div className="p-4 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg shadow-lg shadow-cyan-500/20">
                                    <FiTrendingUp className="text-white" size={24} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="w-full overflow-x-auto">
                        <ManagementTable
                            rows={rows}
                            columns={pricingColumns}
                            rowKey={(row) => row.unique_id}
                            getActions={pricingActions}
                            onRowClick={openEditModal}
                            accent="teal"
                            loading={loading}
                            emptyState={
                                <div className="py-20 text-center">
                                    <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-4 mx-auto w-fit">
                                        <FiDollarSign className="text-gray-400 dark:text-gray-500" size={32} />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                        No provider pricing found
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                        Add a rate for each provider your projects use — until it's here, that usage won't be billed.
                                    </p>
                                    <button
                                        onClick={openAddModal}
                                        className="px-4 py-2 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600 transition-colors"
                                    >
                                        Add Pricing
                                    </button>
                                </div>
                            }
                        />
                    </div>

                    <PricingFormModal
                        isOpen={formModalOpen}
                        onClose={() => setFormModalOpen(false)}
                        tokens={tokens}
                        editingRow={editingRow}
                        onSaved={fetchPricing}
                    />

                    <DeleteConfirmModal
                        isOpen={deleteModalOpen}
                        onClose={() => setDeleteModalOpen(false)}
                        tokens={tokens}
                        row={deletingRow}
                        onDeleted={handleDeleted}
                    />
                </div>
            </div>
        </div>
    );
};

export default AiModelPricing;
