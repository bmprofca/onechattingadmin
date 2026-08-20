import React, { useEffect, useState } from 'react';
import { Briefcase, Check, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiCall } from '../utils/apiCall';
import ManagementTable from '../component/common/ManagementTable';

const QrProjectMapping = () => {
  const [qrCodes, setQrCodes] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapping, setMapping] = useState({});
  const [saving, setSaving] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const response = await apiCall('/qrcode/admin/all');
      const data = await response.json();
      if (!response.ok || data?.error) throw new Error(data?.error || 'Failed to load QR mappings');
      setQrCodes((data.qr_codes || []).filter((qr) => !qr.project_id));
      setProjects(data.projects || []);
    } catch (error) {
      toast.error(error.message || 'Failed to load QR mappings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const mapQr = async (qr) => {
    const projectId = mapping[qr.qr_id];
    if (!projectId) return toast.error('Select an unmapped project first');
    setSaving(qr.qr_id);
    try {
      const response = await apiCall('/qrcode/admin/map', 'POST', { qr_id: qr.qr_id, project_id: projectId });
      const data = await response.json();
      if (!response.ok || data?.error) throw new Error(data?.error || 'Failed to map QR code');
      toast.success('QR code mapped successfully');
      setQrCodes((rows) => rows.filter((row) => row.qr_id !== qr.qr_id));
      setProjects((rows) => rows.filter((row) => row.project_id !== projectId));
    } catch (error) {
      toast.error(error.message || 'Failed to map QR code');
    } finally {
      setSaving(null);
    }
  };

  const columns = [
    { key: 'qr_id', label: 'QR Number', render: (row) => <span className="font-mono font-semibold">{row.qr_id}</span> },
    { key: 'status', label: 'QR Status', render: (row) => row.status === '1' ? 'Active' : 'Disabled' },
    {
      key: 'project_id',
      label: 'Map to Unmapped Project',
      render: (row) => (
        <div className="flex items-center gap-2">
          <select
            value={mapping[row.qr_id] || ''}
            onChange={(event) => setMapping((current) => ({ ...current, [row.qr_id]: event.target.value }))}
            className="min-w-52 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-900"
          >
            <option value="">Select project</option>
            {projects.map((project) => <option key={project.project_id} value={project.project_id}>{project.project_name}</option>)}
          </select>
          <button type="button" onClick={() => mapQr(row)} disabled={saving === row.qr_id} className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">
            {saving === row.qr_id ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />} Map
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center gap-3"><Briefcase className="text-indigo-600" /><div><h1 className="text-xl font-bold dark:text-white">QR Project Mapping</h1><p className="text-xs text-gray-500">Map generated QR numbers to projects that do not have a QR yet.</p></div></div>
          <button type="button" onClick={load} disabled={loading} className="rounded-lg border p-2 text-gray-600 dark:border-gray-600 dark:text-gray-300"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /></button>
        </div>
        {loading ? <div className="py-20 text-center text-gray-500">Loading unmapped QR codes...</div> : (
          <ManagementTable
            rows={qrCodes}
            columns={columns}
            rowKey="qr_id"
            accent="indigo"
            emptyState={<div className="rounded-lg border border-gray-200 bg-white py-20 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800">No unmapped QR codes available.</div>}
          />
        )}
      </div>
    </div>
  );
};

export default QrProjectMapping;
