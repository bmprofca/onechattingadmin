import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiPlus, FiRefreshCw, FiSave, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { apiCall } from '../utils/apiCall';

const emptySetting = {
    setting_group: 'general',
    setting_key: '',
    label: '',
    setting_value: '',
    value_type: 'text',
    is_public: false,
    sort_order: 0,
};

export default function Settings() {
    const [settings, setSettings] = useState([]);
    const [groupFilter, setGroupFilter] = useState('all');
    const [draft, setDraft] = useState(emptySetting);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const response = await apiCall('/admin/settings', 'GET');
            const data = await response.json();
            if (!response.ok || data.error) throw new Error(data.error || 'Failed to load settings');
            setSettings(data.settings || []);
        } catch (error) {
            toast.error(error.message || 'Failed to load settings');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const groups = useMemo(() => {
        return [...new Set(settings.map((item) => item.setting_group))].sort();
    }, [settings]);

    const visible = groupFilter === 'all'
        ? settings
        : settings.filter((item) => item.setting_group === groupFilter);

    const startNew = () => setDraft({ ...emptySetting, setting_group: groupFilter === 'all' ? 'general' : groupFilter });

    const save = async (event) => {
        event.preventDefault();
        setSaving(true);
        try {
            const isNew = !draft.id;
            const response = await apiCall(
                isNew ? '/admin/settings' : `/admin/settings/${draft.id}`,
                isNew ? 'POST' : 'PUT',
                draft
            );
            const data = await response.json();
            if (!response.ok || data.error) throw new Error(data.error || 'Failed to save setting');
            toast.success('Setting saved');
            setDraft(data.setting || emptySetting);
            await load();
        } catch (error) {
            toast.error(error.message || 'Failed to save setting');
        } finally {
            setSaving(false);
        }
    };

    const remove = async () => {
        if (!draft.id) return;
        if (!window.confirm(`Delete ${draft.setting_group}.${draft.setting_key}?`)) return;
        try {
            const response = await apiCall(`/admin/settings/${draft.id}`, 'DELETE');
            const data = await response.json();
            if (!response.ok || data.error) throw new Error(data.error || 'Failed to delete setting');
            toast.success('Setting deleted');
            setDraft(emptySetting);
            await load();
        } catch (error) {
            toast.error(error.message || 'Failed to delete setting');
        }
    };

    return (
        <div className="p-4 md:p-6 space-y-6">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Settings</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Each value is stored as its own row. Use a group such as website, billing, or general to organise configs.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={load}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm"
                >
                    <FiRefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {loading ? (
                <div className="py-16 text-center text-sm text-gray-500">Loading settings...</div>
            ) : (
                <div className="grid lg:grid-cols-[1fr_360px] gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
                            <select
                                value={groupFilter}
                                onChange={(event) => setGroupFilter(event.target.value)}
                                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                            >
                                <option value="all">All groups</option>
                                {groups.map((group) => (
                                    <option key={group} value={group}>{group}</option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={startNew}
                                className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600"
                            >
                                <FiPlus className="w-4 h-4" /> New setting
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="text-left text-gray-500">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Group</th>
                                        <th className="px-4 py-3 font-medium">Key</th>
                                        <th className="px-4 py-3 font-medium">Value</th>
                                        <th className="px-4 py-3 font-medium">Public</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visible.map((item) => (
                                        <tr
                                            key={item.id}
                                            onClick={() => setDraft(item)}
                                            className={`border-t border-gray-100 dark:border-gray-700 cursor-pointer ${
                                                draft.id === item.id ? 'bg-indigo-50 dark:bg-indigo-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700/40'
                                            }`}
                                        >
                                            <td className="px-4 py-3 text-gray-500">{item.setting_group}</td>
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-gray-900 dark:text-white">{item.label}</div>
                                                <div className="text-xs text-gray-400">{item.setting_key}</div>
                                            </td>
                                            <td className="px-4 py-3 max-w-[280px] truncate text-gray-600 dark:text-gray-300">{item.setting_value}</td>
                                            <td className="px-4 py-3 text-gray-500">{item.is_public ? 'Yes' : 'No'}</td>
                                        </tr>
                                    ))}
                                    {!visible.length ? (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-10 text-center text-gray-500">No settings in this group.</td>
                                        </tr>
                                    ) : null}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <form onSubmit={save} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 space-y-4 h-fit">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {draft.id ? 'Edit setting' : 'New setting'}
                        </h2>
                        <label className="block text-sm">
                            <span className="text-gray-600 dark:text-gray-300">Group</span>
                            <input
                                required
                                value={draft.setting_group}
                                onChange={(event) => setDraft((prev) => ({ ...prev, setting_group: event.target.value }))}
                                placeholder="general"
                                className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                            />
                        </label>
                        <label className="block text-sm">
                            <span className="text-gray-600 dark:text-gray-300">Key</span>
                            <input
                                required
                                value={draft.setting_key}
                                onChange={(event) => setDraft((prev) => ({ ...prev, setting_key: event.target.value }))}
                                placeholder="support_email"
                                className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                            />
                        </label>
                        <label className="block text-sm">
                            <span className="text-gray-600 dark:text-gray-300">Label</span>
                            <input
                                value={draft.label || ''}
                                onChange={(event) => setDraft((prev) => ({ ...prev, label: event.target.value }))}
                                className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                            />
                        </label>
                        <label className="block text-sm">
                            <span className="text-gray-600 dark:text-gray-300">Type</span>
                            <select
                                value={draft.value_type || 'text'}
                                onChange={(event) => setDraft((prev) => ({ ...prev, value_type: event.target.value }))}
                                className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                            >
                                <option value="text">Text</option>
                                <option value="textarea">Long text</option>
                                <option value="number">Number</option>
                                <option value="boolean">Yes / No</option>
                            </select>
                        </label>
                        <label className="block text-sm">
                            <span className="text-gray-600 dark:text-gray-300">Value</span>
                            {draft.value_type === 'textarea' ? (
                                <textarea
                                    rows={5}
                                    value={draft.setting_value || ''}
                                    onChange={(event) => setDraft((prev) => ({ ...prev, setting_value: event.target.value }))}
                                    className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                                />
                            ) : draft.value_type === 'boolean' ? (
                                <select
                                    value={draft.setting_value === '1' || draft.setting_value === 'true' ? '1' : '0'}
                                    onChange={(event) => setDraft((prev) => ({ ...prev, setting_value: event.target.value }))}
                                    className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                                >
                                    <option value="1">Yes</option>
                                    <option value="0">No</option>
                                </select>
                            ) : (
                                <input
                                    type={draft.value_type === 'number' ? 'number' : 'text'}
                                    value={draft.setting_value || ''}
                                    onChange={(event) => setDraft((prev) => ({ ...prev, setting_value: event.target.value }))}
                                    className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                                />
                            )}
                        </label>
                        <label className="block text-sm">
                            <span className="text-gray-600 dark:text-gray-300">Sort order</span>
                            <input
                                type="number"
                                value={draft.sort_order ?? 0}
                                onChange={(event) => setDraft((prev) => ({ ...prev, sort_order: Number(event.target.value) }))}
                                className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                            />
                        </label>
                        <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                            <input
                                type="checkbox"
                                checked={!!draft.is_public}
                                onChange={(event) => setDraft((prev) => ({ ...prev, is_public: event.target.checked }))}
                            />
                            Public on the website
                        </label>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="submit"
                                disabled={saving}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium disabled:opacity-60"
                            >
                                <FiSave className="w-4 h-4" />
                                {saving ? 'Saving...' : 'Save setting'}
                            </button>
                            {draft.id ? (
                                <button
                                    type="button"
                                    onClick={remove}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm"
                                >
                                    <FiTrash2 className="w-4 h-4" />
                                    Delete
                                </button>
                            ) : null}
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
