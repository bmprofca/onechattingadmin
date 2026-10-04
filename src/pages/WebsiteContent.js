import React, { useCallback, useEffect, useState } from 'react';
import { FiFileText, FiPlus, FiRefreshCw, FiSave, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { apiCall } from '../utils/apiCall';

const emptyPage = {
    slug: '',
    title: '',
    subtitle: '',
    footer_label: '',
    content_html: '',
    show_in_footer: true,
    is_published: true,
    sort_order: 0,
};

const contactFields = [
    ['company_name', 'Company name'],
    ['legal_name', 'Legal name shown in footer'],
    ['cin', 'CIN'],
    ['address', 'Address'],
    ['phone', 'Phone'],
    ['phone_note', 'Phone note'],
    ['email', 'Email'],
    ['email_note', 'Email note'],
    ['website', 'Website URL'],
    ['website_label', 'Website label'],
    ['website_note', 'Website note'],
    ['footer_address', 'Footer address'],
    ['copyright', 'Copyright line'],
    ['cta_title', 'Contact page button title'],
    ['cta_button', 'Contact page button text'],
];

export default function WebsiteContent() {
    const [contact, setContact] = useState({});
    const [pages, setPages] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [draft, setDraft] = useState(emptyPage);
    const [loading, setLoading] = useState(true);
    const [savingContact, setSavingContact] = useState(false);
    const [savingPage, setSavingPage] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const response = await apiCall('/admin/website', 'GET');
            const data = await response.json();
            if (!response.ok || data.error) {
                throw new Error(data.error || 'Failed to load website content');
            }
            setContact(data.contact || {});
            setPages(data.pages || []);
            setSelectedId((current) => {
                if (current && (data.pages || []).some((page) => page.id === current)) return current;
                return data.pages?.[0]?.id || null;
            });
        } catch (error) {
            toast.error(error.message || 'Failed to load website content');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        const page = pages.find((item) => item.id === selectedId);
        setDraft(page ? { ...page } : emptyPage);
    }, [pages, selectedId]);

    const saveContact = async (event) => {
        event.preventDefault();
        setSavingContact(true);
        try {
            const response = await apiCall('/admin/website/contact', 'PUT', contact);
            const data = await response.json();
            if (!response.ok || data.error) throw new Error(data.error || 'Failed to save contact');
            setContact(data.contact || contact);
            toast.success('Contact details saved');
        } catch (error) {
            toast.error(error.message || 'Failed to save contact');
        } finally {
            setSavingContact(false);
        }
    };

    const savePage = async (event) => {
        event.preventDefault();
        setSavingPage(true);
        try {
            const isNew = !draft.id;
            const response = await apiCall(
                isNew ? '/admin/website/pages' : `/admin/website/pages/${draft.id}`,
                isNew ? 'POST' : 'PUT',
                draft
            );
            const data = await response.json();
            if (!response.ok || data.error) throw new Error(data.error || 'Failed to save page');
            toast.success(isNew ? 'Page created' : 'Page saved');
            await load();
            if (data.page?.id) setSelectedId(data.page.id);
        } catch (error) {
            toast.error(error.message || 'Failed to save page');
        } finally {
            setSavingPage(false);
        }
    };

    const removePage = async () => {
        if (!draft.id) return;
        if (!window.confirm(`Delete "${draft.title}"? This removes it from the website.`)) return;
        try {
            const response = await apiCall(`/admin/website/pages/${draft.id}`, 'DELETE');
            const data = await response.json();
            if (!response.ok || data.error) throw new Error(data.error || 'Failed to delete page');
            toast.success('Page deleted');
            setSelectedId(null);
            await load();
        } catch (error) {
            toast.error(error.message || 'Failed to delete page');
        }
    };

    return (
        <div className="p-4 md:p-6 space-y-6">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Website content</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Contact details and legal pages shown on the public website. Changes apply as soon as they are saved.
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
                <div className="py-16 text-center text-sm text-gray-500">Loading website content...</div>
            ) : (
                <>
                    <form onSubmit={saveContact} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Contact details</h2>
                        <div className="grid md:grid-cols-2 gap-4">
                            {contactFields.map(([key, label]) => (
                                <label key={key} className="block text-sm">
                                    <span className="text-gray-600 dark:text-gray-300">{label}</span>
                                    <input
                                        value={contact[key] || ''}
                                        onChange={(event) => setContact((prev) => ({ ...prev, [key]: event.target.value }))}
                                        className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                                    />
                                </label>
                            ))}
                            <label className="block text-sm md:col-span-2">
                                <span className="text-gray-600 dark:text-gray-300">Footer description</span>
                                <textarea
                                    rows={3}
                                    value={contact.footer_blurb || ''}
                                    onChange={(event) => setContact((prev) => ({ ...prev, footer_blurb: event.target.value }))}
                                    className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                                />
                            </label>
                            <label className="block text-sm md:col-span-2">
                                <span className="text-gray-600 dark:text-gray-300">Contact page intro</span>
                                <textarea
                                    rows={3}
                                    value={contact.cta_text || ''}
                                    onChange={(event) => setContact((prev) => ({ ...prev, cta_text: event.target.value }))}
                                    className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                                />
                            </label>
                        </div>
                        <button
                            type="submit"
                            disabled={savingContact}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium disabled:opacity-60"
                        >
                            <FiSave className="w-4 h-4" />
                            {savingContact ? 'Saving...' : 'Save contact details'}
                        </button>
                    </form>

                    <div className="grid lg:grid-cols-[280px_1fr] gap-4">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-3">
                            <div className="flex items-center justify-between mb-3 px-1">
                                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Legal pages</h2>
                                <button
                                    type="button"
                                    onClick={() => { setSelectedId(null); setDraft(emptyPage); }}
                                    className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600"
                                >
                                    <FiPlus className="w-3.5 h-3.5" /> New
                                </button>
                            </div>
                            <div className="space-y-1">
                                {pages.map((page) => (
                                    <button
                                        key={page.id}
                                        type="button"
                                        onClick={() => setSelectedId(page.id)}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                                            selectedId === page.id
                                                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200'
                                                : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'
                                        }`}
                                    >
                                        <span className="flex items-center gap-2">
                                            <FiFileText className="w-4 h-4 shrink-0" />
                                            <span className="truncate">{page.title}</span>
                                        </span>
                                        <span className="block text-[11px] text-gray-400 mt-0.5">/{page.slug}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <form onSubmit={savePage} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <label className="block text-sm">
                                    <span className="text-gray-600 dark:text-gray-300">Title</span>
                                    <input
                                        required
                                        value={draft.title}
                                        onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
                                        className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                                    />
                                </label>
                                <label className="block text-sm">
                                    <span className="text-gray-600 dark:text-gray-300">URL slug</span>
                                    <input
                                        required
                                        value={draft.slug}
                                        onChange={(event) => setDraft((prev) => ({ ...prev, slug: event.target.value }))}
                                        placeholder="privacy-policy"
                                        className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                                    />
                                </label>
                                <label className="block text-sm">
                                    <span className="text-gray-600 dark:text-gray-300">Subtitle / last updated</span>
                                    <input
                                        value={draft.subtitle || ''}
                                        onChange={(event) => setDraft((prev) => ({ ...prev, subtitle: event.target.value }))}
                                        className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                                    />
                                </label>
                                <label className="block text-sm">
                                    <span className="text-gray-600 dark:text-gray-300">Footer label</span>
                                    <input
                                        value={draft.footer_label || ''}
                                        onChange={(event) => setDraft((prev) => ({ ...prev, footer_label: event.target.value }))}
                                        className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                                    />
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
                                <div className="flex items-center gap-4 pt-6 text-sm">
                                    <label className="inline-flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={draft.is_published !== false}
                                            onChange={(event) => setDraft((prev) => ({ ...prev, is_published: event.target.checked }))}
                                        />
                                        Published
                                    </label>
                                    <label className="inline-flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={draft.show_in_footer !== false}
                                            onChange={(event) => setDraft((prev) => ({ ...prev, show_in_footer: event.target.checked }))}
                                        />
                                        Show in footer
                                    </label>
                                </div>
                            </div>
                            <label className="block text-sm">
                                <span className="text-gray-600 dark:text-gray-300">Page HTML</span>
                                <textarea
                                    rows={18}
                                    value={draft.content_html || ''}
                                    onChange={(event) => setDraft((prev) => ({ ...prev, content_html: event.target.value }))}
                                    className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm font-mono"
                                    placeholder="<h2>Section</h2><p>Write the page content in HTML.</p>"
                                />
                            </label>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="submit"
                                    disabled={savingPage}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium disabled:opacity-60"
                                >
                                    <FiSave className="w-4 h-4" />
                                    {savingPage ? 'Saving...' : draft.id ? 'Save page' : 'Create page'}
                                </button>
                                {draft.id ? (
                                    <button
                                        type="button"
                                        onClick={removePage}
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm"
                                    >
                                        <FiTrash2 className="w-4 h-4" />
                                        Delete
                                    </button>
                                ) : null}
                            </div>
                        </form>
                    </div>
                </>
            )}
        </div>
    );
}
