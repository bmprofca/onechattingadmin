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
  FiHash,
  FiEye,
  FiEyeOff,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
  FiSearch
} from 'react-icons/fi';
import axios from 'axios';

const API_BASE = 'https://api.w1chat.com/admin/users';

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
  const [activeTab, setActiveTab] = useState('profile');
  const [revealedSensitive, setRevealedSensitive] = useState(() => new Set());

  // Tab-specific data with pagination
  const [projectsData, setProjectsData] = useState({ data: [], pagination: { page: 1, limit: 10, total: 0, total_pages: 1 }, loading: false });
  const [projectsPage, setProjectsPage] = useState(1);
  const [projectsLimit] = useState(10);
  const [projectsSearch, setProjectsSearch] = useState('');
  const [projectsSearchInput, setProjectsSearchInput] = useState('');
  const [loginData, setLoginData] = useState({ data: [], pagination: { page: 1, limit: 10, total: 0, total_pages: 1 }, loading: false });
  const [loginLimit] = useState(10);
  const [loginPage, setLoginPage] = useState(1);
  const [projectsPageJump, setProjectsPageJump] = useState('');
  const [loginPageJump, setLoginPageJump] = useState('');
  const [paymentsData, setPaymentsData] = useState({ data: [], loading: false });

  const getAuthHeaders = () => ({
    'x-token': adminTokens?.token,
    username: adminTokens?.username
  });

  const toggleSensitive = (fieldId) => {
    setRevealedSensitive((prev) => {
      const next = new Set(prev);
      if (next.has(fieldId)) next.delete(fieldId);
      else next.add(fieldId);
      return next;
    });
  };

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

  // Fetch profile (user + wallet summary) - used for Profile tab
  useEffect(() => {
    const fetchProfile = async () => {
      if (!adminTokens?.token || !username) return;
      setLoading(true);
      setError('');

      try {
        const response = await axios.get(`${API_BASE}/${encodeURIComponent(username)}`, {
          headers: getAuthHeaders()
        });

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

    fetchProfile();
  }, [adminTokens, username]);

  // Fetch projects when Projects tab is active
  useEffect(() => {
    const fetchProjects = async () => {
      if (!adminTokens?.token || !username || activeTab !== 'projects') return;
      setProjectsData((p) => ({ ...p, loading: true }));

      try {
        const limit = Math.min(Math.max(projectsLimit, 1), 100);
        const params = new URLSearchParams({ page: String(projectsPage), limit: String(limit) });
        if (projectsSearch.trim()) params.set('search', projectsSearch.trim());

        const response = await axios.get(
          `${API_BASE}/${encodeURIComponent(username)}/projects?${params}`,
          { headers: getAuthHeaders() }
        );

        if (!response.data?.error) {
          setProjectsData({
            data: response.data.data || [],
            pagination: response.data.pagination || { page: projectsPage, limit, total: 0, total_pages: 1 },
            loading: false
          });
        } else {
          setProjectsData((p) => ({ ...p, data: [], loading: false }));
        }
      } catch (err) {
        setProjectsData((p) => ({ ...p, data: [], loading: false }));
      }
    };

    fetchProjects();
  }, [adminTokens, username, activeTab, projectsPage, projectsSearch, projectsLimit]);

  // Fetch login tokens when Login tab is active
  useEffect(() => {
    const fetchLoginTokens = async () => {
      if (!adminTokens?.token || !username || activeTab !== 'login') return;
      setLoginData((p) => ({ ...p, loading: true }));

      try {
        const limit = Math.min(Math.max(loginLimit, 1), 100);
        const params = new URLSearchParams({ page: String(loginPage), limit: String(limit) });

        const response = await axios.get(
          `${API_BASE}/${encodeURIComponent(username)}/login-tokens?${params}`,
          { headers: getAuthHeaders() }
        );

        if (!response.data?.error) {
          setLoginData({
            data: response.data.data || [],
            pagination: response.data.pagination || { page: loginPage, limit, total: 0, total_pages: 1 },
            loading: false
          });
        } else {
          setLoginData((p) => ({ ...p, data: [], loading: false }));
        }
      } catch (err) {
        setLoginData((p) => ({ ...p, data: [], loading: false }));
      }
    };

    fetchLoginTokens();
  }, [adminTokens, username, activeTab, loginPage, loginLimit]);

  // Fetch payments when Payments tab is active (falls back to profile data if endpoint missing)
  useEffect(() => {
    const fetchPayments = async () => {
      if (!adminTokens?.token || !username || activeTab !== 'payments') return;
      setPaymentsData((p) => ({ ...p, loading: true }));

      try {
        const response = await axios.get(
          `${API_BASE}/${encodeURIComponent(username)}/payments`,
          { headers: getAuthHeaders() }
        );

        if (!response.data?.error && Array.isArray(response.data.data)) {
          setPaymentsData({ data: response.data.data, loading: false });
        } else {
          setPaymentsData({ data: [], loading: false });
        }
      } catch {
        setPaymentsData((p) => ({ ...p, data: [], loading: false }));
      }
    };

    fetchPayments();
  }, [adminTokens, username, activeTab]);

  const user = details?.user || {};
  const userExcludeFields = ['id', 'username', 'create_by', 'modify_by', 'created_by', 'modified_by', 'role', 'status'];
  const userDisplay = Object.fromEntries(
    Object.entries(user)
      .filter(([key]) => !userExcludeFields.includes(key) && key !== 'country_code')
      .map(([key, value]) => [
        key,
        key === 'mobile' && (user.country_code || user.mobile)
          ? `${user.country_code ? `+${String(user.country_code).replace(/^\+/, '')} ` : ''}${user.mobile || ''}`.trim() || '-'
          : value
      ])
  );
  const txSummary = details?.transactions?.summary || {};

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
    const dateKeys = ['expire_date', 'created_at', 'updated_at', 'create_date', 'mapped_at', 'date', 'timestamp'];
    if (dateKeys.some((dk) => key.toLowerCase().includes(dk))) return true;
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) return true;
    return false;
  };

  // Render status badge
  const renderStatusBadge = (status) => {
    const isActive = status === '1' || status === 1 || status === 'active';
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${isActive
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

  const renderValue = (key, value, fieldId = '') => {
    if (value === null || value === undefined || value === '') return '-';

    // Mask sensitive data with view toggle
    if (isSensitive(key)) {
      const fid = fieldId || key;
      const isRevealed = revealedSensitive.has(fid);
      const displayValue = isRevealed
        ? <span className="font-mono text-[11px] text-gray-700 dark:text-gray-300 break-all">{String(value)}</span>
        : <span className="font-mono text-[11px] text-gray-400 dark:text-gray-500">*****</span>;
      return (
        <span className="inline-flex items-center gap-1.5">
          {displayValue}
          <button
            type="button"
            onClick={() => toggleSensitive(fid)}
            className="p-0.5 rounded text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
            title={isRevealed ? 'Hide' : 'Show'}
            aria-label={isRevealed ? 'Hide' : 'Show'}
          >
            {isRevealed ? <FiEyeOff size={14} /> : <FiEye size={14} />}
          </button>
        </span>
      );
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
            className={`inline-flex items-center gap-1 text-xs ${isVerified ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'
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

  const renderKeyValueGrid = (obj, excludeFields = [], gridId = '') => {
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
              {renderValue(key, value, gridId ? `${gridId}_${key}` : key)}
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
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${isCredit
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
    const renderCellValue = (col, row, idx) => {
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

      // Mask sensitive fields with view toggle
      if (isSensitive(col)) {
        const fid = `${tableType}_${idx}_${col}`;
        const isRevealed = revealedSensitive.has(fid);
        const displayValue = isRevealed
          ? <span className="font-mono text-[10px] text-gray-700 dark:text-gray-300 break-all">{String(value)}</span>
          : <span className="font-mono text-[10px] text-gray-400 dark:text-gray-500">*****</span>;
        return (
          <span className="inline-flex items-center gap-1">
            {displayValue}
            <button
              type="button"
              onClick={() => toggleSensitive(fid)}
              className="p-0.5 rounded text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors shrink-0"
              title={isRevealed ? 'Hide' : 'Show'}
              aria-label={isRevealed ? 'Hide' : 'Show'}
            >
              {isRevealed ? <FiEyeOff size={12} /> : <FiEye size={12} />}
            </button>
          </span>
        );
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
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-[11px] text-gray-600 dark:text-gray-300">
            <FiHash size={10} />
            {items.length} record{items.length !== 1 ? 's' : ''}
          </span>
        </div>
        <table className="min-w-full text-xs sm:text-[13px]">
          <thead className="bg-gray-50 dark:bg-gray-900/60 border-b border-gray-100 dark:border-gray-700">
            <tr>
              {displayColumns.map((col) => (
                <th key={col} className="px-3 py-2 text-left font-semibold text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {formatLabel(col)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {items.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/60 transition-colors">
                {displayColumns.map((col) => {
                  const cellValue = renderCellValue(col, row, idx);
                  if (cellValue === null) return null;
                  return (
                    <td key={col} className="px-3 py-2.5 text-gray-800 dark:text-gray-100 align-top max-w-xs break-words">
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

  const renderPaginatedTable = (config) => {
    const {
      items,
      title,
      icon,
      tableType = 'default',
      loading,
      pagination,
      onPageChange,
      searchPlaceholder,
      searchValue,
      onSearchChange,
      onSearchSubmit,
      pageJumpValue = '',
      onPageJumpChange,
      actionsColumn
    } = config;

    const hasSearch = typeof onSearchSubmit === 'function';
    const { page = 1, limit = 20, total = 0, total_pages = 1 } = pagination || {};
    const start = total === 0 ? 0 : (page - 1) * limit + 1;
    const end = total === 0 ? 0 : Math.min(page * limit, total);

    if (!Array.isArray(items)) {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
          <div className="flex items-center gap-2 mb-2">
            {icon}
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          </div>
          {loading ? (
            <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400 animate-pulse">Loading...</div>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400">No records found.</p>
          )}
        </div>
      );
    }

    const displayCols = items.length > 0 ? Object.keys(items[0] || {}) : [];
    const hasActions = typeof actionsColumn === 'function';
    const showSerialNo = tableType === 'projects' || tableType === 'tokens';
    const { page: pagPage = 1, limit: pagLimit = 10 } = pagination || {};

    const renderCell = (col, row, idx) => {
      const value = row[col];
      if (value === null || value === undefined || value === '') return '-';

      // Projects: expire_date - false = No plan, timestamp = show date + active/inactive + days left
      if (tableType === 'projects' && col === 'expire_date') {
        if (value === false || value === 'false') {
          return <span className="text-[11px] text-amber-600 dark:text-amber-400">No plan found</span>;
        }
        const expDate = new Date(value);
        if (isNaN(expDate.getTime())) return '-';
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expDay = new Date(expDate);
        expDay.setHours(0, 0, 0, 0);
        const isActive = expDay >= today;
        const diffMs = expDay - today;
        const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        return (
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] whitespace-nowrap">{formatDate(value)}</span>
            <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${isActive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {isActive ? <FiCheckCircle size={10} /> : <FiXCircle size={10} />}
              {isActive ? 'Active' : 'Inactive'}
              {isActive && daysLeft >= 0 && (
                <span className="text-gray-500 dark:text-gray-400 font-normal">
                  ({daysLeft} day{daysLeft !== 1 ? 's' : ''} left)
                </span>
              )}
            </span>
          </div>
        );
      }

      if (isSensitive(col)) {
        const fid = `${tableType}_${idx}_${col}`;
        const isRevealed = revealedSensitive.has(fid);
        return (
          <span className="inline-flex items-center gap-1">
            {isRevealed ? <span className="font-mono text-[10px] break-all">{String(value)}</span> : <span className="text-gray-400">*****</span>}
            <button type="button" onClick={() => toggleSensitive(fid)} className="p-0.5 rounded hover:bg-indigo-50">
              {isRevealed ? <FiEyeOff size={12} /> : <FiEye size={12} />}
            </button>
          </span>
        );
      }
      if (col === 'status' || col === 'is_deleted' || col === 'is_waba_connected' || col === 'project_status') return renderStatusBadge(value);
      if (isDateField(col, value)) return <span className="text-[11px] whitespace-nowrap">{formatDate(value)}</span>;
      if (col.includes('_id') || col === 'id') return <span className="font-mono text-[10px]">{String(value)}</span>;
      return String(value);
    };

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-5 pb-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              {icon}
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                ({total ?? 0} total)
              </span>
            </div>
            {hasSearch && (
              <form
                onSubmit={(e) => { e.preventDefault(); onSearchSubmit?.(); }}
                className="flex gap-2"
              >
                <div className="relative">
                  <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input
                    type="text"
                    value={searchValue ?? ''}
                    onChange={(e) => onSearchChange?.(e.target.value)}
                    placeholder={searchPlaceholder || 'Search...'}
                    className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button type="submit" className="px-3 py-1.5 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                  Search
                </button>
              </form>
            )}
          </div>
        </div>
        {loading ? (
          <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400 animate-pulse">Loading...</div>
        ) : items.length === 0 ? (
          <div className="px-5 pb-5">
            <p className="text-xs text-gray-500 dark:text-gray-400">No records found.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs sm:text-[13px]">
                <thead className="bg-gray-50 dark:bg-gray-900/60 border-y border-gray-100 dark:border-gray-700">
                  <tr>
                    {showSerialNo && (
                      <th className="px-3 py-2 text-left font-semibold text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap w-12">
                        #
                      </th>
                    )}
                    {displayCols.map((col) => (
                      <th key={col} className="px-3 py-2 text-left font-semibold text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {formatLabel(col)}
                      </th>
                    ))}
                    {hasActions && (
                      <th className="px-3 py-2 text-left font-semibold text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {items.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/60">
                      {showSerialNo && (
                        <td className="px-3 py-2.5 text-gray-500 dark:text-gray-400 text-[11px] font-medium">
                          {(pagPage - 1) * pagLimit + idx + 1}
                        </td>
                      )}
                      {displayCols.map((col) => (
                        <td key={col} className="px-3 py-2.5 text-gray-800 dark:text-gray-100 align-top max-w-xs break-words">
                          {renderCell(col, row, idx)}
                        </td>
                      ))}
                      {hasActions && (
                        <td className="px-3 py-2.5 text-gray-800 dark:text-gray-100 align-top">
                          {actionsColumn(row)}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pagination && total > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Showing {start}–{end} of {total}
                  </p>
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => onPageChange?.(1)}
                      disabled={page <= 1}
                      className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="First"
                    >
                      <FiChevronsLeft size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onPageChange?.(page - 1)}
                      disabled={page <= 1}
                      className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Previous"
                    >
                      <FiChevronLeft size={16} />
                    </button>
                    <span className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg min-w-[80px] text-center">
                      {page}
                    </span>
                    <button
                      type="button"
                      onClick={() => onPageChange?.(page + 1)}
                      disabled={page >= total_pages}
                      className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Next"
                    >
                      <FiChevronRight size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onPageChange?.(total_pages)}
                      disabled={page >= total_pages}
                      className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Last"
                    >
                      <FiChevronsRight size={16} />
                    </button>
                  </div>
                </div>
                {total_pages > 1 && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const val = parseInt(pageJumpValue || String(page), 10);
                      if (val >= 1 && val <= total_pages) onPageChange?.(val);
                      onPageJumpChange?.('');
                    }}
                    className="flex items-center gap-2"
                  >
                    <span className="text-xs text-gray-500 dark:text-gray-400">Go to</span>
                    <input
                      type="number"
                      min={1}
                      max={total_pages}
                      value={pageJumpValue}
                      onChange={(e) => onPageJumpChange?.(e.target.value)}
                      placeholder={`${start}-${end}`}
                      className="w-20 min-w-[5rem] px-2 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="submit"
                      className="px-2 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      Go
                    </button>
                  </form>
                )}
              </div>
            )}
          </>
        )}
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
        className={`pt-16 transition-all duration-300 ease-in-out ${isMinimized ? 'md:pl-20' : 'md:pl-72'
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8">
          {/* Back */}
          <button
            onClick={() => navigate('/users')}
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
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${user.status === '1'
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

                {/* Tabs */}
                <div className="mb-6 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                  <nav className="flex gap-1 min-w-max pb-px">
                    <button
                      onClick={() => setActiveTab('profile')}
                      className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'profile'
                        ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 border border-b-0 border-gray-200 dark:border-gray-700 -mb-px'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                      <FiUser className="inline-block mr-2" size={14} />
                      Profile
                    </button>
                    <button
                      onClick={() => setActiveTab('projects')}
                      className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'projects'
                        ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 border border-b-0 border-gray-200 dark:border-gray-700 -mb-px'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                      <FiDatabase className="inline-block mr-2" size={14} />
                      Projects
                    </button>
                    <button
                      onClick={() => setActiveTab('login')}
                      className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'login'
                        ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 border border-b-0 border-gray-200 dark:border-gray-700 -mb-px'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                      <FiKey className="inline-block mr-2" size={14} />
                      Login
                    </button>
                    <button
                      onClick={() => setActiveTab('payments')}
                      className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'payments'
                        ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 border border-b-0 border-gray-200 dark:border-gray-700 -mb-px'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                      <FiCreditCard className="inline-block mr-2" size={14} />
                      Payments
                    </button>
                  </nav>
                </div>

                {/* Profile tab content */}
                {activeTab === 'profile' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <div className="lg:col-span-2 space-y-4">
                      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <FiUser className="text-indigo-500" />
                          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            User Record
                          </h2>
                        </div>
                        {renderKeyValueGrid(userDisplay, [], 'user')}
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
                    </div>
                  </div>
                )}

                {/* Projects tab content */}
                {activeTab === 'projects' && renderPaginatedTable({
                  items: projectsData.data,
                  title: 'Projects & Mappings',
                  icon: <FiDatabase className="text-indigo-500" />,
                  tableType: 'projects',
                  loading: projectsData.loading,
                  pagination: projectsData.pagination,
                  onPageChange: (p) => setProjectsPage(p),
                  searchPlaceholder: 'Search by project, business ID...',
                  searchValue: projectsSearchInput,
                  onSearchChange: setProjectsSearchInput,
                  onSearchSubmit: () => { setProjectsSearch(projectsSearchInput); setProjectsPage(1); },
                  pageJumpValue: projectsPageJump,
                  onPageJumpChange: setProjectsPageJump,
                  actionsColumn: (row) => (
                    <button
                      type="button"
                      onClick={() => navigate(`/projects/${row.project_id}`)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                      title="View project"
                    >
                      <FiEye size={14} />
                    </button>
                  )
                })}

                {/* Login tab content */}
                {activeTab === 'login' && renderPaginatedTable({
                  items: loginData.data,
                  title: 'Login Tokens',
                  icon: <FiKey className="text-gray-500" />,
                  tableType: 'tokens',
                  loading: loginData.loading,
                  pagination: loginData.pagination,
                  onPageChange: setLoginPage,
                  pageJumpValue: loginPageJump,
                  onPageJumpChange: setLoginPageJump
                })}

                {/* Payments tab content */}
                {activeTab === 'payments' && (
                  paymentsData.loading ? (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
                      <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400 animate-pulse">Loading...</div>
                    </div>
                  ) : (
                    renderObjectTable(
                      paymentsData.data,
                      'Payments',
                      <FiCreditCard className="text-purple-500" />,
                      'payments'
                    )
                  )
                )}
              </>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDetails;


