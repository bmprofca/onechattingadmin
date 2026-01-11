import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header, Sidebar } from '../component/Menu';
import {
  FiArrowLeft,
  FiUser,
  FiMail,
  FiPhone,
  FiActivity,
  FiBriefcase,
  FiCreditCard,
  FiDatabase,
  FiKey,
  FiAlertCircle,
  FiCalendar,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiHash
} from 'react-icons/fi';
import axios from 'axios';

const UserDetails = () => {
  const { username } = useParams();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(() => {
    const saved = localStorage.getItem('sidebarMinimized');
    return saved ? JSON.parse(saved) : false;
  });

  const [adminTokens, setAdminTokens] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [details, setDetails] = useState(null);

  useEffect(() => {
    localStorage.setItem('sidebarMinimized', JSON.stringify(isMinimized));
  }, [isMinimized]);

  // Load admin tokens
  useEffect(() => {
    const data = localStorage.getItem('userData') || sessionStorage.getItem('userData');
    if (data) {
      setAdminTokens(JSON.parse(data));
    } else {
      navigate('/login');
    }
  }, [navigate]);

  // Fetch user details by username
  useEffect(() => {
    const fetchDetails = async () => {
      if (!adminTokens?.token || !username) return;
      setLoading(true);
      setError('');

      try {
        const response = await axios.get(
          `https://api.w1chat.com/admin/users/${encodeURIComponent(username)}`,
          {
            headers: {
              'x-token': adminTokens.token,
              username: adminTokens.username
            }
          }
        );

        if (!response.data?.error) {
          setDetails(response.data.data);
        } else {
          setError(response.data.message || 'Failed to fetch user details.');
        }
      } catch (err) {
        setError('Authorization failed or server error.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [adminTokens, username]);

  const user = details?.user || {};
  const business = details?.business || null;
  const projects = details?.projects || [];
  const txSummary = details?.transactions?.summary || {};
  const txList = details?.transactions?.list || [];
  const payments = details?.payments || [];
  const loginTokens = details?.tokens || [];

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  // Format label from snake_case to Title Case
  const formatLabel = (key) => {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // Check if a value looks like a date
  const isDateField = (key, value) => {
    const dateKeys = ['expire_date', 'created_at', 'updated_at', 'date', 'timestamp'];
    if (dateKeys.some((dk) => key.toLowerCase().includes(dk))) return true;
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) return true;
    return false;
  };

  // Render status badge
  const renderStatusBadge = (status) => {
    const isActive = status === '1' || status === 1 || status === 'active';
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
          isActive
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        }`}
      >
        {isActive ? <FiCheckCircle size={10} /> : <FiXCircle size={10} />}
        {isActive ? 'Active' : 'Inactive'}
      </span>
    );
  };

  // Sensitive fields that should be masked
  const sensitiveFields = ['password', 'token', 'secret', 'api_key'];
  const isSensitive = (key) => sensitiveFields.some((f) => key.toLowerCase().includes(f));

  const renderValue = (key, value) => {
    if (value === null || value === undefined || value === '') return '-';
    
    // Mask sensitive data
    if (isSensitive(key)) {
      const str = String(value);
      if (str.length > 10) {
        return (
          <span className="font-mono text-[11px] text-gray-400 dark:text-gray-500">
            {str.slice(0, 6)}...{str.slice(-4)}
          </span>
        );
      }
      return <span className="text-gray-400">••••••••</span>;
    }

    // Status fields
    if (key === 'status' || key === 'is_deleted' || key === 'kyc_verified' || key === 'is_waba_connected') {
      if (key === 'is_deleted') {
        const isDeleted = value === '1' || value === 1;
        return (
          <span className={`text-xs ${isDeleted ? 'text-red-600' : 'text-green-600'}`}>
            {isDeleted ? 'Yes' : 'No'}
          </span>
        );
      }
      if (key === 'kyc_verified' || key === 'is_waba_connected') {
        const isVerified = value === '1' || value === 1;
        return (
          <span
            className={`inline-flex items-center gap-1 text-xs ${
              isVerified ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'
            }`}
          >
            {isVerified ? <FiCheckCircle size={11} /> : <FiClock size={11} />}
            {isVerified ? 'Yes' : 'No'}
          </span>
        );
      }
      return renderStatusBadge(value);
    }

    // Date fields
    if (isDateField(key, value)) {
      return (
        <span className="inline-flex items-center gap-1 text-gray-700 dark:text-gray-300">
          <FiCalendar size={11} className="text-gray-400" />
          {formatDate(value)}
        </span>
      );
    }

    // Boolean
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    return String(value);
  };

  const renderKeyValueGrid = (obj, excludeFields = []) => {
    if (!obj || typeof obj !== 'object') return null;
    const entries = Object.entries(obj).filter(([key]) => !excludeFields.includes(key));
    
    return (
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-xs sm:text-sm">
        {entries.map(([key, value]) => (
          <div key={key}>
            <dt className="text-gray-500 dark:text-gray-400 uppercase tracking-wider text-[11px] mb-1">
              {formatLabel(key)}
            </dt>
            <dd className="font-medium text-gray-900 dark:text-gray-100 break-words">
              {renderValue(key, value)}
            </dd>
          </div>
        ))}
      </dl>
    );
  };

  // Get transaction type display
  const getTransactionTypeBadge = (type, transactionType) => {
    const isCredit = type === '1' || type === 1;
    return (
      <div className="flex flex-col gap-1">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
            isCredit
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          }`}
        >
          {isCredit ? '+ Credit' : '- Debit'}
        </span>
        {transactionType && (
          <span className="text-[10px] text-gray-500 dark:text-gray-400 capitalize">
            {transactionType}
          </span>
        )}
      </div>
    );
  };

  const renderObjectTable = (items, title, icon, tableType = 'default') => {
    if (!Array.isArray(items) || items.length === 0) {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
          <div className="flex items-center gap-2 mb-2">
            {icon}
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">No records found.</p>
        </div>
      );
    }

    const columns = Object.keys(items[0] || {});

    // Render cell value with smart formatting
    const renderCellValue = (col, row) => {
      const value = row[col];
      
      if (value === null || value === undefined || value === '') return '-';

      // Handle transaction type specially
      if (tableType === 'transactions' && col === 'type') {
        return getTransactionTypeBadge(value, row.transaction_type);
      }

      // Skip transaction_type column if already shown with type
      if (tableType === 'transactions' && col === 'transaction_type') {
        return null;
      }

      // Amount formatting
      if (col === 'amount') {
        const num = parseFloat(value);
        const isPositive = row.type === '1' || row.type === 1;
        return (
          <span className={`font-semibold ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            ₹{num.toFixed(2)}
          </span>
        );
      }

      // Mask sensitive fields
      if (isSensitive(col)) {
        const str = String(value);
        if (str.length > 12) {
          return (
            <span className="font-mono text-[10px] text-gray-400 dark:text-gray-500">
              {str.slice(0, 6)}...{str.slice(-4)}
            </span>
          );
        }
        return <span className="text-gray-400">••••••</span>;
      }

      // Status badges
      if (col === 'status' || col === 'is_deleted' || col === 'is_waba_connected' || col === 'project_status') {
        return renderStatusBadge(value);
      }

      // Date formatting
      if (isDateField(col, value)) {
        return (
          <span className="text-[11px] text-gray-600 dark:text-gray-300 whitespace-nowrap">
            {formatDate(value)}
          </span>
        );
      }

      // ID fields - make them monospace and smaller
      if (col.includes('_id') || col === 'id' || col === 'unique_id') {
        return (
          <span className="font-mono text-[10px] text-gray-500 dark:text-gray-400">
            {String(value)}
          </span>
        );
      }

      return String(value);
    };

    // Filter out columns we've merged
    const displayColumns = tableType === 'transactions' 
      ? columns.filter(c => c !== 'transaction_type')
      : columns;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 overflow-x-auto">
        <div className="flex items-center gap-2 mb-3">
          {icon}
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
          <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-[11px] text-gray-600 dark:text-gray-300">
            <FiHash size={10} />
            {items.length} record{items.length !== 1 ? 's' : ''}
          </span>
        </div>
        <table className="min-w-full text-xs sm:text-[13px]">
          <thead className="bg-gray-50 dark:bg-gray-900/60 border-b border-gray-100 dark:border-gray-700">
            <tr>
              {displayColumns.map((col) => (
                <th
                  key={col}
                  className="px-3 py-2 text-left font-semibold text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap"
                >
                  {formatLabel(col)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {items.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/60 transition-colors">
                {displayColumns.map((col) => {
                  const cellValue = renderCellValue(col, row);
                  if (cellValue === null) return null;
                  return (
                    <td
                      key={col}
                      className="px-3 py-2.5 text-gray-800 dark:text-gray-100 align-top max-w-xs break-words"
                    >
                      {cellValue}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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

      <div
        className={`pt-16 transition-all duration-300 ease-in-out ${
          isMinimized ? 'md:pl-20' : 'md:pl-72'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8">
          {/* Back */}
          <button
            onClick={() => navigate('/admin/users')}
            className="group mb-4 inline-flex items-center text-xs font-medium text-gray-500 hover:text-indigo-600"
          >
            <FiArrowLeft className="mr-1 group-hover:-translate-x-0.5 transition-transform" />
            Back to Users
          </button>

          {/* Error */}
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
              <FiAlertCircle className="mt-0.5" size={14} />
              <span>{error}</span>
            </div>
          )}

          {/* Loading skeleton */}
          {loading ? (
            <div className="space-y-6 animate-pulse">
              <div className="h-24 rounded-xl bg-white dark:bg-gray-800" />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="h-64 rounded-xl bg-white dark:bg-gray-800 lg:col-span-2" />
                <div className="h-64 rounded-xl bg-white dark:bg-gray-800" />
              </div>
              <div className="h-48 rounded-xl bg-white dark:bg-gray-800" />
            </div>
          ) : (
            details && (
              <>
                {/* Header card */}
                <div className="mb-6 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                      {(user.name || user.username || 'U').toString().charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {user.name || user.username || 'User Details'}
                      </h1>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {user.email && (
                          <span className="inline-flex items-center gap-1">
                            <FiMail size={12} /> {user.email}
                          </span>
                        )}
                        {user.mobile && (
                          <span className="inline-flex items-center gap-1">
                            <FiPhone size={12} /> {user.country_code} {user.mobile}
                          </span>
                        )}
                        {user.username && (
                          <span className="inline-flex items-center gap-1">
                            <FiUser size={12} /> {user.username}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-start md:justify-end">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        user.status === '1'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <FiActivity className="mr-1" size={12} />
                      {user.status === '1' ? 'Active' : 'Inactive'}
                    </span>
                    {user.role && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                        <FiBriefcase className="mr-1" size={12} />
                        {String(user.role).toUpperCase()}
                      </span>
                    )}
                    <div className="inline-flex items-center rounded-full bg-gray-50 dark:bg-gray-800 px-2.5 py-1 text-xs text-gray-500 dark:text-gray-300 border border-gray-100 dark:border-gray-700">
                      ID: <span className="ml-1 font-mono text-[11px]">{user.id}</span>
                    </div>
                  </div>
                </div>

                {/* Top layout: User + Business + Wallet summary */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <FiUser className="text-indigo-500" />
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          User Record
                        </h2>
                      </div>
                      {renderKeyValueGrid(user)}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <FiCreditCard className="text-emerald-500" />
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          Wallet Summary
                        </h2>
                      </div>
                      <div className="grid grid-cols-1 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Total Credit</p>
                          <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                            ₹{Number(txSummary.total_credit || 0).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Total Debit</p>
                          <p className="font-semibold text-red-600 dark:text-red-400">
                            ₹{Number(txSummary.total_debit || 0).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Balance</p>
                          <p className="font-semibold text-indigo-600 dark:text-indigo-400">
                            ₹{Number(txSummary.balance || 0).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <FiBriefcase className="text-amber-500" />
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          Business
                        </h2>
                      </div>
                      {business ? (
                        renderKeyValueGrid(business)
                      ) : (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          No business record found for this user.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Projects */}
                {renderObjectTable(
                  projects,
                  'Projects & Mappings',
                  <FiDatabase className="text-indigo-500" />,
                  'projects'
                )}

                <div className="mt-6 grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {/* Transactions */}
                  {renderObjectTable(
                    txList,
                    'Transactions',
                    <FiCreditCard className="text-emerald-500" />,
                    'transactions'
                  )}

                  {/* Payments */}
                  {renderObjectTable(
                    payments,
                    'Payments',
                    <FiCreditCard className="text-purple-500" />,
                    'payments'
                  )}
                </div>

                <div className="mt-6">
                  {/* Tokens */}
                  {renderObjectTable(
                    loginTokens,
                    'Login Tokens',
                    <FiKey className="text-gray-500" />,
                    'tokens'
                  )}
                </div>
              </>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDetails;


