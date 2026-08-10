import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiX, FiCheckCircle, FiRefreshCw, FiEdit, FiSave, FiAlertCircle, FiPackage, FiChevronRight, FiTrash2 } from 'react-icons/fi';
import axios from 'axios';
import { Encrypt } from '../../pages/encryption/payload-encryption';
import { API_BASE_URL } from '../../config/api';

const UserBillingModal = ({ isOpen, onClose, user, tokens, onUpdated }) => {
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingPack, setEditingPack] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [isActive, setIsActive] = useState('1');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState({ total_packs: 0, active_subscriptions: 0 });

  useEffect(() => {
    if (isOpen && user && tokens?.token) {
      fetchUserPlans();
      setError('');
      setSuccess('');
      setEditingPack(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, user, tokens?.token]);

  const fetchUserPlans = async () => {
    if (!user?.username || !tokens?.token) return;
    
    setLoading(true);
    setError('');
    
    try {
      const url = `${API_BASE_URL}/admin/subscription/user-plans/${user.username}`;
      const response = await axios.get(url, {
        headers: { 'x-token': tokens.token }
      });

      if (response.data?.error) {
        setError(response.data.message || 'Failed to fetch plans.');
      } else {
        setPacks(response.data?.data || []);
        setStats({
          total_packs: response.data?.total_packs || 0,
          active_subscriptions: response.data?.active_subscriptions || 0
        });
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to fetch plans.';
      setError(msg);
      setPacks([]);
    } finally {
      setLoading(false);
    }
  };

  const isSubscriptionExpired = (endDate) => {
    if (!endDate) return false;
    try {
      const end = new Date(endDate);
      const now = new Date();
      return end < now;
    } catch {
      return false;
    }
  };

  const handleSetCustomPricing = async (pack) => {
    if (!user?.username || !tokens?.token || customAmount === '') {
      setError('Please enter a valid amount.');
      return;
    }

    if (!pack.pack_id) {
      setError('Invalid Pack ID.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        username: user.username,
        pack_id: pack.pack_id,
        custom_amount: parseFloat(customAmount),
        is_active: isActive
      };

      const { data, key } = Encrypt(payload);
      
      const response = await axios.post(
        `${API_BASE_URL}/admin/subscription/set-user-pricing`,
        { data, key },
        {
          headers: {
            'x-token': tokens.token,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data?.error) {
        setError(response.data.message || 'Update failed.');
      } else {
        setSuccess('Pricing updated.');
        setEditingPack(null);
        setCustomAmount('');
        setIsActive('1');
        setTimeout(() => {
          fetchUserPlans();
          if (onUpdated) onUpdated();
        }, 800);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Update failed.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveCustomPricing = async (pack) => {
    if (!window.confirm(`Remove custom pricing for ${pack.pack_name}?`)) return;
    if (!user?.username || !tokens?.token || !pack.pack_id) return;

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        username: user.username,
        pack_id: pack.pack_id
      };

      const { data, key } = Encrypt(payload);
      
      const response = await axios.post(
        `${API_BASE_URL}/admin/subscription/remove-user-pricing`,
        { data, key },
        {
          headers: {
            'x-token': tokens.token,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data?.error) {
        setError(response.data.message || 'Failed to remove pricing.');
      } else {
        setSuccess('Custom pricing removed successfully.');
        setTimeout(() => {
          fetchUserPlans();
          if (onUpdated) onUpdated();
        }, 800);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to remove pricing.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const startEditing = (pack) => {
    setEditingPack(pack);
    setCustomAmount(parseFloat(pack.final_amount || pack.default_amount || 0));
    setIsActive(pack.is_active?.toString() || '1');
    setError('');
    setSuccess('');
  };

  const cancelEditing = () => {
    setEditingPack(null);
    setCustomAmount('');
    setIsActive('1');
    setError('');
    setSuccess('');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', { 
        day: 'numeric', month: 'short', year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || amount === '') return '₹0';
    return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
  };

  const parseFeatures = (featuresString) => {
    if (!featuresString) return [];
    try {
      if (typeof featuresString === 'string') {
        return JSON.parse(featuresString);
      }
      return Array.isArray(featuresString) ? featuresString : [];
    } catch {
      return [];
    }
  };

  const getStatusBadge = (isActive) => {
    const active = isActive === '1' || isActive === 1 || isActive === true;
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${
        active 
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
          : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
      }`}>
        {active ? 'Active' : 'Inactive'}
      </span>
    );
  };

  const handleClose = () => {
    if (submitting) return;
    setError('');
    setSuccess('');
    setEditingPack(null);
    onClose();
  };

  // Sort packs: Active first, then inactive
  const sortedPacks = [...packs].sort((a, b) => {
    const aActive = a.is_active === '1' || a.is_active === 1;
    const bActive = b.is_active === '1' || b.is_active === 1;
    if (aActive === bActive) return 0;
    return aActive ? -1 : 1;
  });

  return (
    <AnimatePresence>
      {isOpen && user && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.98, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="w-full max-w-5xl max-h-[90vh] rounded-xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-700 dark:text-gray-200">
                  <FiPackage size={20} />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                    Subscriptions
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {user.username}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchUserPlans}
                  disabled={loading}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                >
                  <FiRefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                >
                  <FiX size={20} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-gray-950">
              <div className="max-w-4xl mx-auto px-6 py-6">
                
                {/* Stats & Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      {stats.active_subscriptions} Active Subscriptions
                    </span>
                    <span className="w-px h-3 bg-gray-300 dark:bg-gray-700"></span>
                    <span>{stats.total_packs} Total Packs</span>
                  </div>
                </div>

                {/* Notifications */}
                <AnimatePresence>
                  {(error || success) && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg border mb-6 text-sm ${
                        error
                          ? 'bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-900/10 dark:border-rose-900/20 dark:text-rose-400'
                          : 'bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-900/10 dark:border-emerald-900/20 dark:text-emerald-400'
                      }`}
                    >
                      {error ? <FiAlertCircle size={16} /> : <FiCheckCircle size={16} />}
                      <span className="font-medium">{error || success}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Loading State */}
                {loading && (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <div className="w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin mb-3"></div>
                    <p className="text-sm">Loading plans...</p>
                  </div>
                )}

                {/* Empty State */}
                {!loading && packs.length === 0 && (
                  <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
                    <FiPackage className="mx-auto text-gray-300 dark:text-gray-700 mb-3" size={32} />
                    <p className="text-gray-500 dark:text-gray-400 font-medium">No subscription packs found</p>
                  </div>
                )}

                {/* Packs Grid */}
                <div className="space-y-4">
                  {sortedPacks.map((pack) => {
                    const features = parseFeatures(pack.features);
                    const hasSubscriptions = pack.subscriptions && pack.subscriptions.length > 0;
                    const isEditing = editingPack?.pack_id === pack.pack_id;

                    return (
                      <div
                        key={pack.pack_id}
                        className={`bg-white dark:bg-gray-900 rounded-xl border transition-all duration-200 overflow-hidden ${
                          isEditing
                            ? 'border-indigo-500 ring-1 ring-indigo-500 shadow-lg'
                            : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 shadow-sm'
                        }`}
                      >
                        {isEditing ? (
                          // Edit Form
                          <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                              <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                                Edit {pack.pack_name}
                              </h3>
                              <button onClick={cancelEditing} className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-200">
                                Cancel
                              </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                              <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
                                  Custom Price (₹)
                                </label>
                                <div className="relative">
                                  <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={customAmount}
                                    onChange={(e) => setCustomAmount(e.target.value)}
                                    className="w-full pl-3 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium"
                                    placeholder="0"
                                  />
                                </div>
                                <p className="text-xs text-gray-400 mt-2">
                                  Default: {formatCurrency(pack.default_amount)}
                                </p>
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
                                  Status
                                </label>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setIsActive('1')}
                                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                                      isActive === '1'
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400'
                                        : 'bg-white border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400'
                                    }`}
                                  >
                                    Active
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setIsActive('0')}
                                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                                      isActive === '0'
                                        ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400'
                                        : 'bg-white border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400'
                                    }`}
                                  >
                                    Inactive
                                  </button>
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => handleSetCustomPricing(pack)}
                              disabled={submitting || customAmount === '' || parseFloat(customAmount) < 0}
                              className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {submitting ? (
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : (
                                <>
                                  <FiSave size={16} />
                                  <span>Save Changes</span>
                                </>
                              )}
                            </button>
                          </div>
                        ) : (
                          // View Mode
                          <>
                            <div className="p-5 flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                    {pack.pack_name}
                                  </h3>
                                  {getStatusBadge(pack.is_active)}
                                  {pack.has_custom_pricing && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 uppercase tracking-wide">
                                      Custom Price
                                    </span>
                                  )}
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3">
                                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded font-medium text-gray-600 dark:text-gray-300">
                                    {pack.pack_type || 'Standard'}
                                  </span>
                                  <span>ID: <span className="font-mono">{pack.pack_id}</span></span>
                                  {pack.billing_cycle && (
                                    <span>• {pack.billing_cycle}</span>
                                  )}
                                </div>

                                <div className="flex items-baseline gap-2 mb-3">
                                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {formatCurrency(pack.final_amount)}
                                  </span>
                                  {pack.has_custom_pricing && (
                                    <span className="text-sm text-gray-400 line-through">
                                      {formatCurrency(pack.default_amount)}
                                    </span>
                                  )}
                                </div>

                                {features.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mt-3">
                                    {features.map((feature, idx) => (
                                      <span key={idx} className="px-2 py-1 text-[11px] font-medium bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded border border-gray-100 dark:border-gray-700">
                                        {feature}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-col items-end gap-2">
                                <button
                                  onClick={() => startEditing(pack)}
                                  className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                                  title="Edit Price"
                                >
                                  <FiEdit size={18} />
                                </button>
                                {pack.has_custom_pricing && (
                                  <button
                                    onClick={() => handleRemoveCustomPricing(pack)}
                                    disabled={submitting}
                                    className="p-2 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors disabled:opacity-50"
                                    title="Remove Custom Pricing"
                                  >
                                    <FiTrash2 size={18} />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Subscriptions List */}
                            {hasSubscriptions && (
                              <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 p-4">
                                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                                  History
                                </h4>
                                <div className="space-y-2">
                                  {pack.subscriptions.map((sub, idx) => {
                                    const isExpired = isSubscriptionExpired(sub.end_date);

                                    return (
                                      <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 text-sm">
                                        <div className="flex flex-col gap-0.5">
                                          <div className="flex items-center gap-2">
                                            <span className={`w-1.5 h-1.5 rounded-full ${isExpired ? 'bg-gray-300 dark:bg-gray-600' : 'bg-emerald-500'}`} />
                                            <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                                              {sub.subscription_id}
                                            </span>
                                          </div>
                                          <div className="text-xs text-gray-400 flex items-center gap-1 ml-3.5">
                                            {formatDate(sub.start_date)}
                                            <FiChevronRight size={10} />
                                            {formatDate(sub.end_date)}
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <div className="font-medium text-gray-900 dark:text-white">
                                            {formatCurrency(sub.amount_paid)}
                                          </div>
                                          <div className="text-[10px] text-gray-400">
                                            Paid via {sub.wallet_amount > 0 ? 'Wallet' : 'Gateway'}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
              <div className="flex justify-end">
                <button
                  onClick={handleClose}
                  className="px-6 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-800 rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UserBillingModal;
