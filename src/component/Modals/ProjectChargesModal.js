import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiX, FiDollarSign, FiSave, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { apiCall } from '../../utils/apiCall';
import toast from 'react-hot-toast';

const ProjectChargesModal = ({ isOpen, onClose, project, tokens, onUpdated }) => {

  const [marketingCharge, setMarketingCharge] = useState('');
  const [utilityCharge, setUtilityCharge] = useState('');
  const [authenticationCharge, setAuthenticationCharge] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // hydrate form when project changes / modal opens
  useEffect(() => {
    if (isOpen && project) {
      setMarketingCharge(project.marketing_charge ?? '');
      setUtilityCharge(project.utility_charge ?? '');
      setAuthenticationCharge(project.authentication_charge ?? '');


    }
  }, [isOpen, project]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!project?.project_id || !tokens?.token) return;

    // basic client validation: at least one field filled
    if (
      marketingCharge === '' &&
      utilityCharge === '' &&
      authenticationCharge === ''
    ) {
      toast.error('Please set at least one charge before saving.');

      return;
    }

    setSubmitting(true);



    try {
      const body = {
        marketing_charge: marketingCharge,
        utility_charge: utilityCharge,
        authentication_charge: authenticationCharge
      };

      const response = await apiCall(
        `/admin/projects/${project.project_id}/prices`,
        'PATCH',
        body,
      );
      const data = await response.json();

      if (!response.ok || data?.error) {
        toast.error(data?.message || data?.error || 'Failed to update charges.');
      } else {
        toast.success('Charges updated successfully.');
        const updatedProject = data?.data || project;
        if (onUpdated) {
          onUpdated(updatedProject);
        }
      }
    } catch (err) {
      const msg = err?.message || 'Server error while updating prices.';
      toast.error(typeof msg === 'string' ? msg : 'Server error while updating prices.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;


    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && project && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.25 }}
            className="w-full max-w-md rounded-lg bg-white dark:bg-gray-900 shadow-2xl border border-gray-200/80 dark:border-gray-700 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <FiDollarSign size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Edit Charges
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {project.project_name} &mdash; {project.project_id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="px-5 pt-4 pb-5 space-y-4">
              {(error || success) && (
                <div
                  className={`flex items-start gap-2 text-xs rounded-lg px-3 py-2 border ${error
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
                      : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                    }`}
                >
                  {error ? (
                    <FiAlertCircle className="mt-0.5" size={14} />
                  ) : (
                    <FiCheckCircle className="mt-0.5" size={14} />
                  )}
                  <span>{error || success}</span>
                </div>
              )}

              <div className="space-y-3 text-sm">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Marketing Charge (per message)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={marketingCharge}
                    onChange={(e) => setMarketingCharge(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
                    placeholder="e.g. 0.20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Utility Charge (per message)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={utilityCharge}
                    onChange={(e) => setUtilityCharge(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
                    placeholder="e.g. 0.20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Authentication Charge (per message)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={authenticationCharge}
                    onChange={(e) => setAuthenticationCharge(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
                    placeholder="e.g. 0.20"
                  />
                </div>

                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                  Leave a field blank to keep the current price unchanged. Values must be valid
                  numbers.
                </p>
              </div>

              {/* Footer */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                >
                  <FiSave size={14} />
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProjectChargesModal;


