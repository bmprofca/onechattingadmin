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
  FiSearch,
  FiDollarSign,
  FiArrowUpRight,
  FiArrowDownLeft,
  FiDownload,
  FiRefreshCw,
  FiFilter,
  FiFileText,
  FiCopy,
  FiPackage,
  FiPlus,
  FiMinus,
  FiX,
  FiEdit2,
  FiTrash2,
  FiSave,
  FiAlertTriangle
} from 'react-icons/fi';
import axios from 'axios';
import { Encrypt } from './encryption/payload-encryption';
import { AnimatePresence, motion } from 'framer-motion';

const API_BASE = 'https://api.w1chat.com/admin/users';
const API_BASE_URL = 'https://api.w1chat.com';

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
  const [success, setSuccess] = useState('');
  const [details, setDetails] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [revealedSensitive, setRevealedSensitive] = useState(() => new Set());

  // Wallet modal state
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletAction, setWalletAction] = useState('credit');
  const [walletAmount, setWalletAmount] = useState('');
  const [walletRemark, setWalletRemark] = useState('');
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState('');

  // Custom Package state
  const [customPackage, setCustomPackage] = useState(null);
  const [basePackages, setBasePackages] = useState({ monthly: 0, yearly: 0 });
  const [hasCustomPackage, setHasCustomPackage] = useState(false);
  const [loadingCustomPackage, setLoadingCustomPackage] = useState(false);
  
  // Custom Package Modal state
  const [showCustomPackageModal, setShowCustomPackageModal] = useState(false);
  const [editingCustomPackage, setEditingCustomPackage] = useState(false);
  const [customPackageForm, setCustomPackageForm] = useState({
    monthly: '',
    yearly: ''
  });
  const [customPackageLoading, setCustomPackageLoading] = useState(false);
  const [customPackageError, setCustomPackageError] = useState('');

  // Delete Confirmation Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingCustomPackage, setDeletingCustomPackage] = useState(false);

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
  
  // Transactions data
  const [transactionsData, setTransactionsData] = useState({ 
    data: [], 
    summary: { total_debit: '0.00', total_credit: '0.00', current_balance: '0.00' },
    pagination: { page: 1, limit: 15, total_records: 0, total_pages: 1, has_more: false },
    loading: false 
  });
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [transactionsLimit] = useState(15);
  const [transactionsFilters, setTransactionsFilters] = useState({
    from_date: '',
    to_date: '',
    transaction_type: '',
    type: ''
  });
  const [transactionsSearch, setTransactionsSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Subscriptions data
  const [subscriptionsData, setSubscriptionsData] = useState({ 
    data: [], 
    pagination: { page: 1, limit: 10, total: 0, total_pages: 1 },
    loading: false 
  });
  const [subscriptionsPage, setSubscriptionsPage] = useState(1);
  const [subscriptionsLimit] = useState(10);
  const [subscriptionsSearch, setSubscriptionsSearch] = useState('');
  const [subscriptionsSearchInput, setSubscriptionsSearchInput] = useState('');

  const getAuthHeaders = () => ({
    'x-token': adminTokens?.token,
    username: adminTokens?.username
  });

  const getTransactionAuthHeaders = () => {
    const token = adminTokens?.token;
    return { 
      'x-auth-token': token,
      'x-token': token,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

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

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Get date 30 days ago
  const get30DaysAgo = () => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  };

  // Initialize transaction dates on mount
  useEffect(() => {
    setTransactionsFilters({
      from_date: get30DaysAgo(),
      to_date: getTodayDate(),
      transaction_type: '',
      type: ''
    });
  }, []);

  // Fetch profile (user + wallet summary)
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

  // Fetch transactions when Transactions tab is active
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!adminTokens?.token || !username || activeTab !== 'transactions') return;
      
      setTransactionsData((p) => ({ ...p, loading: true }));

      try {
        const params = new URLSearchParams({
          page: transactionsPage,
          limit: transactionsLimit,
          from_date: transactionsFilters.from_date || get30DaysAgo(),
          to_date: transactionsFilters.to_date || getTodayDate()
        });

        if (transactionsFilters.transaction_type) {
          params.append('transaction_type', transactionsFilters.transaction_type);
        }
        
        if (transactionsFilters.type !== '') {
          params.append('type', transactionsFilters.type);
        }

        const response = await axios.get(
          `${API_BASE_URL}/admin/user/transaction-history/${encodeURIComponent(username)}?${params.toString()}`,
          { headers: getTransactionAuthHeaders() }
        );

        if (response.data && response.data.error === false) {
          setTransactionsData({
            data: response.data.data || [],
            summary: response.data.summary || { total_debit: '0.00', total_credit: '0.00', current_balance: '0.00' },
            pagination: response.data.pagination || { 
              page: transactionsPage, 
              limit: transactionsLimit, 
              total_records: 0, 
              total_pages: 1,
              has_more: false 
            },
            loading: false
          });
        } else {
          setTransactionsData((p) => ({ ...p, data: [], loading: false }));
        }
      } catch (err) {
        console.error('Failed to fetch transaction history:', err);
        setTransactionsData((p) => ({ ...p, data: [], loading: false }));
      }
    };

    if (activeTab === 'transactions') {
      fetchTransactions();
    }
  }, [adminTokens, username, activeTab, transactionsPage, transactionsLimit, transactionsFilters]);

  // Fetch subscriptions when Subscriptions tab is active
  useEffect(() => {
    const fetchSubscriptions = async () => {
      if (!adminTokens?.token || !username || activeTab !== 'subscriptions') return;
      setSubscriptionsData((p) => ({ ...p, loading: true }));

      try {
        const limit = Math.min(Math.max(subscriptionsLimit, 1), 100);
        const params = new URLSearchParams({ page: String(subscriptionsPage), limit: String(limit) });
        if (subscriptionsSearch.trim()) params.set('search', subscriptionsSearch.trim());

        const response = await axios.get(
          `${API_BASE}/${encodeURIComponent(username)}/subscriptions?${params}`,
          { headers: getAuthHeaders() }
        );

        if (!response.data?.error) {
          setSubscriptionsData({
            data: response.data.data || [],
            pagination: response.data.pagination || { page: subscriptionsPage, limit, total: 0, total_pages: 1 },
            loading: false
          });
        } else {
          setSubscriptionsData((p) => ({ ...p, data: [], loading: false }));
        }
      } catch (err) {
        console.error('Failed to fetch subscriptions:', err);
        setSubscriptionsData((p) => ({ ...p, data: [], loading: false }));
      }
    };

    if (activeTab === 'subscriptions') {
      fetchSubscriptions();
    }
  }, [adminTokens, username, activeTab, subscriptionsPage, subscriptionsSearch, subscriptionsLimit]);

  // Fetch custom package when Subscriptions tab is active
  useEffect(() => {
    const fetchCustomPackage = async () => {
      if (!adminTokens?.token || !username || activeTab !== 'subscriptions') return;
      
      setLoadingCustomPackage(true);
      
      try {
        const payload = { username };
        const { data, key } = Encrypt(payload);

        const response = await axios.post(
          `${API_BASE_URL}/admin/user-custom-packages/${encodeURIComponent(username)}`,
          { data, key },
          { headers: getTransactionAuthHeaders() }
        );

        if (response.data && response.data.error === false) {
          setBasePackages(response.data.data.base);
          setHasCustomPackage(response.data.data.has_custom_price);
          setCustomPackage(response.data.data.custom);
          
          console.log('Custom package data:', response.data.data); // For debugging
        }
      } catch (err) {
        console.error('Failed to fetch custom package:', err);
      } finally {
        setLoadingCustomPackage(false);
      }
    };

    if (activeTab === 'subscriptions') {
      fetchCustomPackage();
    }
  }, [adminTokens, username, activeTab]);

  // Handle wallet credit/debit
  const handleWalletAction = async () => {
    if (!walletAmount || parseFloat(walletAmount) <= 0) {
      setWalletError('Please enter a valid amount');
      return;
    }

    setWalletLoading(true);
    setWalletError('');
    setSuccess('');

    try {
      const endpoint = walletAction === 'credit' ? 'credit-wallet' : 'debit-wallet';
      const amount = parseFloat(walletAmount);
      
      const payload = {
        amount: amount,
        remark: walletRemark || `${walletAction === 'credit' ? 'Credit' : 'Debit'} by admin`
      };

      const { data, key } = Encrypt(payload);

      const response = await axios.post(
        `${API_BASE_URL}/admin/${endpoint}/${encodeURIComponent(username)}`,
        { data, key },
        { headers: getTransactionAuthHeaders() }
      );

      if (response.data && response.data.error === false) {
        setSuccess(`Wallet ${walletAction}ed successfully!`);
        setShowWalletModal(false);
        setWalletAmount('');
        setWalletRemark('');
        
        const userResponse = await axios.get(`${API_BASE}/${encodeURIComponent(username)}`, {
          headers: getAuthHeaders()
        });
        
        if (!userResponse.data?.error) {
          setDetails(userResponse.data.data);
        }
        
        if (activeTab === 'transactions') {
          setTransactionsPage(1);
        }
      } else {
        setWalletError(response.data.error || response.data.msg || `Failed to ${walletAction} wallet`);
      }
    } catch (err) {
      console.error(`Failed to ${walletAction} wallet:`, err);
      let errorMessage = `Failed to ${walletAction} wallet. `;
      if (err.response?.data?.error) {
        errorMessage += err.response.data.error;
      } else if (err.response?.data?.msg) {
        errorMessage += err.response.data.msg;
      } else if (err.response?.data?.e) {
        errorMessage += err.response.data.e;
      } else {
        errorMessage += 'Please try again.';
      }
      setWalletError(errorMessage);
    } finally {
      setWalletLoading(false);
    }
  };

  // Handle create/update custom package
  const handleCustomPackageSubmit = async () => {
    if (!customPackageForm.monthly || parseFloat(customPackageForm.monthly) <= 0) {
      setCustomPackageError('Please enter a valid monthly amount');
      return;
    }
    if (!customPackageForm.yearly || parseFloat(customPackageForm.yearly) <= 0) {
      setCustomPackageError('Please enter a valid yearly amount');
      return;
    }

    setCustomPackageLoading(true);
    setCustomPackageError('');
    setError('');
    setSuccess('');

    try {
      // Base payload
      const payload = {
        username: username,
        monthly: parseFloat(customPackageForm.monthly),
        yearly: parseFloat(customPackageForm.yearly)
      };

      // If editing, add the custom_id
      if (editingCustomPackage && customPackage?.custom_id) {
        payload.custom_id = customPackage.custom_id;
      }

      console.log('Saving custom package:', payload);

      const { data, key } = Encrypt(payload);

      const endpoint = editingCustomPackage ? 'update-custom-package' : 'create-custom-package';
      
      const response = await axios.post(
        `${API_BASE_URL}/admin/${endpoint}`,
        { data, key },
        { headers: getTransactionAuthHeaders() }
      );

      if (response.data && response.data.error === false) {
        setSuccess(editingCustomPackage ? 'Custom package updated successfully!' : 'Custom package created successfully!');
        setShowCustomPackageModal(false);
        
        // Refresh custom package data
        const refreshPayload = { username };
        const { data: refreshData, key: refreshKey } = Encrypt(refreshPayload);
        
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/admin/user-custom-packages/${encodeURIComponent(username)}`,
          { data: refreshData, key: refreshKey },
          { headers: getTransactionAuthHeaders() }
        );

        if (refreshResponse.data && refreshResponse.data.error === false) {
          setBasePackages(refreshResponse.data.data.base);
          setHasCustomPackage(refreshResponse.data.data.has_custom_price);
          setCustomPackage(refreshResponse.data.data.custom);
        }
      } else {
        setCustomPackageError(response.data.error || response.data.message || 'Operation failed');
      }
    } catch (err) {
      console.error('Failed to save custom package:', err);
      setCustomPackageError(err.response?.data?.error || err.response?.data?.message || 'Failed to save custom package');
    } finally {
      setCustomPackageLoading(false);
    }
  };

  // Handle delete custom package
  const handleDeleteCustomPackage = async () => {
    if (!customPackage?.custom_id) return;

    setDeletingCustomPackage(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        custom_id: customPackage.custom_id
      };

      const { data, key } = Encrypt(payload);

      const response = await axios.post(
        `${API_BASE_URL}/admin/delete-custom-package`,
        { data, key },
        { headers: getTransactionAuthHeaders() }
      );

      if (response.data && response.data.error === false) {
        setSuccess('Custom package deleted successfully!');
        setShowDeleteModal(false);
        setCustomPackage(null);
        setHasCustomPackage(false);
        
        // Refresh custom package data to show base packages
        const refreshPayload = { username };
        const { data: refreshData, key: refreshKey } = Encrypt(refreshPayload);
        
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/admin/user-custom-packages/${encodeURIComponent(username)}`,
          { data: refreshData, key: refreshKey },
          { headers: getTransactionAuthHeaders() }
        );

        if (refreshResponse.data && refreshResponse.data.error === false) {
          setBasePackages(refreshResponse.data.data.base);
          setHasCustomPackage(refreshResponse.data.data.has_custom_price);
        }
      } else {
        setError(response.data.error || response.data.message || 'Delete failed');
      }
    } catch (err) {
      console.error('Failed to delete custom package:', err);
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to delete custom package');
    } finally {
      setDeletingCustomPackage(false);
    }
  };

  // Open create custom package modal
  const handleOpenCreateCustomPackage = () => {
    setEditingCustomPackage(false);
    setCustomPackageForm({
      monthly: basePackages.monthly?.toString() || '',
      yearly: basePackages.yearly?.toString() || ''
    });
    setCustomPackageError('');
    setShowCustomPackageModal(true);
  };

  // Open edit custom package modal
  const handleOpenEditCustomPackage = () => {
    if (customPackage) {
      setEditingCustomPackage(true);
      setCustomPackageForm({
        monthly: customPackage.monthly?.toString() || '',
        yearly: customPackage.yearly?.toString() || ''
      });
      setCustomPackageError('');
      setShowCustomPackageModal(true);
    }
  };

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
    const isActive = status === '1' || status === 1 || status === 'active' || status === true;
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

    if (isDateField(key, value)) {
      return (
        <span className="inline-flex items-center gap-1 text-gray-700 dark:text-gray-300">
          <FiCalendar size={11} className="text-gray-400" />
          {formatDate(value)}
        </span>
      );
    }

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

  // Format amount for transactions
  const formatAmount = (amount, type) => {
    if (!amount && amount !== 0) return { formatted: '₹0.00', class: '', icon: null, prefix: '' };
    
    const num = parseFloat(amount);
    const isCredit = type === true || type === '1' || type === 1;
    
    const absNum = Math.abs(num);
    const formattedNum = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(absNum);
    
    return {
      formatted: formattedNum,
      class: isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
      icon: isCredit ? 
        <FiArrowDownLeft className="inline mr-1" size={14} /> : 
        <FiArrowUpRight className="inline mr-1" size={14} />,
      prefix: isCredit ? '+' : '-'
    };
  };

  // Get transaction badge
  const getTransactionBadge = (transactionType) => {
    const type = transactionType?.toLowerCase() || '';
    
    if (type.includes('wallet topup') || type.includes('credit')) {
      return {
        bg: 'bg-emerald-100 dark:bg-emerald-900/30',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-200 dark:border-emerald-800',
        icon: '💳',
        label: 'Wallet Topup'
      };
    }
    if (type.includes('template send') || type.includes('debit')) {
      return {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-700 dark:text-blue-300',
        border: 'border-blue-200 dark:border-blue-800',
        icon: '📨',
        label: 'Template Send'
      };
    }
    if (type.includes('subscription')) {
      return {
        bg: 'bg-purple-100 dark:bg-purple-900/30',
        text: 'text-purple-700 dark:text-purple-300',
        border: 'border-purple-200 dark:border-purple-800',
        icon: '📦',
        label: 'Subscription'
      };
    }
    if (type.includes('refund')) {
      return {
        bg: 'bg-amber-100 dark:bg-amber-900/30',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-200 dark:border-amber-800',
        icon: '↩️',
        label: 'Refund'
      };
    }
    return {
      bg: 'bg-gray-100 dark:bg-gray-800',
      text: 'text-gray-700 dark:text-gray-300',
      border: 'border-gray-200 dark:border-gray-700',
      icon: '💱',
      label: transactionType || 'Transaction'
    };
  };

  // Copy to clipboard function
  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Export to CSV
  const exportToCSV = () => {
    if (transactionsData.data.length === 0) return;

    const headers = [
      'Transaction ID',
      'Date',
      'Time',
      'Type',
      'Direction',
      'Amount (₹)',
      'Remark',
      'Created By',
      'UTR'
    ];

    const rows = transactionsData.data.map(t => [
      t.transaction_id,
      new Date(t.create_date).toLocaleDateString('en-IN'),
      new Date(t.create_date).toLocaleTimeString('en-IN'),
      t.transaction_type,
      t.type === true ? 'Credit' : 'Debit',
      t.amount,
      t.remark || 'N/A',
      t.created_by || t.created_by_details?.username || 'N/A',
      t.payment_details?.utr || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => 
        typeof cell === 'string' && (cell.includes(',') || cell.includes('"')) 
          ? `"${cell.replace(/"/g, '""')}"` 
          : cell
      ).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${user?.username}_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Reset transaction filters
  const resetFilters = () => {
    setTransactionsFilters({
      from_date: get30DaysAgo(),
      to_date: getTodayDate(),
      transaction_type: '',
      type: ''
    });
    setTransactionsSearch('');
    setTransactionsPage(1);
  };

  // Transaction types options
  const transactionTypes = [
    { value: '', label: 'All Types' },
    { value: 'wallet topup', label: 'Wallet Topup' },
    { value: 'template send', label: 'Template Send' },
    { value: 'subscription', label: 'Subscription' },
    { value: 'refund', label: 'Refund' },
    { value: 'adjustment', label: 'Adjustment' }
  ];

  // Transaction direction options
  const directionTypes = [
    { value: '', label: 'All Transactions' },
    { value: '1', label: 'Credit (Money In)' },
    { value: '0', label: 'Debit (Money Out)' }
  ];

  // Filter transactions by search term
  const filteredTransactions = transactionsData.data.filter(t => 
    transactionsSearch === '' || 
    t.transaction_id?.toString().includes(transactionsSearch) ||
    t.transaction_type?.toLowerCase().includes(transactionsSearch.toLowerCase()) ||
    t.remark?.toLowerCase().includes(transactionsSearch.toLowerCase()) ||
    t.payment_details?.utr?.toLowerCase().includes(transactionsSearch.toLowerCase())
  );

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

      if (tableType === 'subscriptions') {
        if (col === 'status') {
          return renderStatusBadge(value);
        }
        if (col === 'start_date' || col === 'end_date' || col === 'created_at') {
          return <span className="text-[11px] whitespace-nowrap">{formatDate(value)}</span>;
        }
        if (col === 'amount' || col === 'price') {
          const num = parseFloat(value);
          return <span className="font-semibold">₹{num.toFixed(2)}</span>;
        }
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
          {/* Success Message */}
          {success && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300">
              <FiCheckCircle className="mt-0.5 flex-shrink-0" size={14} />
              <span>{success}</span>
              <button onClick={() => setSuccess('')} className="ml-auto">
                <FiX size={14} />
              </button>
            </div>
          )}

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
              <FiAlertCircle className="mt-0.5 flex-shrink-0" size={14} />
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
                      onClick={() => setActiveTab('transactions')}
                      className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'transactions'
                        ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 border border-b-0 border-gray-200 dark:border-gray-700 -mb-px'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                      <FiCreditCard className="inline-block mr-2" size={14} />
                      Transactions
                    </button>
                    <button
                      onClick={() => setActiveTab('subscriptions')}
                      className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'subscriptions'
                        ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 border border-b-0 border-gray-200 dark:border-gray-700 -mb-px'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                      <FiPackage className="inline-block mr-2" size={14} />
                      Subscriptions
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

                {/* Transactions tab content */}
                {activeTab === 'transactions' && (
                  <div className="space-y-6">
                    {/* Balance Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Credit</p>
                            <h4 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                              ₹{parseFloat(transactionsData.summary.total_credit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </h4>
                          </div>
                          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
                            <FiArrowDownLeft className="text-emerald-600 dark:text-emerald-400" size={24} />
                          </div>
                        </div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Debit</p>
                            <h4 className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                              ₹{parseFloat(transactionsData.summary.total_debit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </h4>
                          </div>
                          <div className="p-3 bg-rose-50 dark:bg-rose-900/30 rounded-lg">
                            <FiArrowUpRight className="text-rose-600 dark:text-rose-400" size={24} />
                          </div>
                        </div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Current Balance</p>
                            <h4 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                              ₹{parseFloat(transactionsData.summary.current_balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </h4>
                          </div>
                          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                            <FiDollarSign className="text-indigo-600 dark:text-indigo-400" size={24} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Wallet Action Buttons */}
                    <div className="flex flex-wrap gap-3 justify-end">
                      <button
                        onClick={() => {
                          setWalletAction('credit');
                          setShowWalletModal(true);
                          setWalletError('');
                        }}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                      >
                        <FiPlus size={16} />
                        Credit Wallet
                      </button>
                      <button
                        onClick={() => {
                          setWalletAction('debit');
                          setShowWalletModal(true);
                          setWalletError('');
                        }}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                      >
                        <FiMinus size={16} />
                        Debit Wallet
                      </button>
                    </div>

                    {/* Transactions Table Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                      {/* Filters */}
                      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                        <div className="flex flex-col md:flex-row gap-4">
                          <div className="relative flex-1">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                              type="text"
                              placeholder="Search ID, type, UTR..."
                              className="w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white text-sm"
                              value={transactionsSearch}
                              onChange={(e) => setTransactionsSearch(e.target.value)}
                            />
                            {transactionsSearch && (
                              <button
                                onClick={() => setTransactionsSearch('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              >
                                <FiXCircle size={16} />
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setShowFilters(!showFilters)}
                              className={`px-4 py-2.5 border rounded-lg text-sm font-medium flex items-center transition-all ${
                                Object.values(transactionsFilters).some(v => v && v !== get30DaysAgo() && v !== getTodayDate() && v !== '')
                                  ? 'border-indigo-200 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                              }`}
                            >
                              <FiFilter className="mr-2" size={14} />
                              Filters
                            </button>
                            <button
                              onClick={() => {
                                setTransactionsPage(1);
                                setTransactionsFilters(prev => ({ ...prev }));
                              }}
                              className="p-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                              title="Refresh"
                              disabled={transactionsData.loading}
                            >
                              <FiRefreshCw size={16} className={transactionsData.loading ? 'animate-spin' : ''} />
                            </button>
                            <button
                              onClick={exportToCSV}
                              disabled={transactionsData.data.length === 0}
                              className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            >
                              <FiDownload className="mr-2" size={14} />
                              Export
                            </button>
                          </div>
                        </div>

                        {/* Filter Panel */}
                        {showFilters && (
                          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                  From Date
                                </label>
                                <input
                                  type="date"
                                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
                                  value={transactionsFilters.from_date}
                                  onChange={(e) => setTransactionsFilters(prev => ({ ...prev, from_date: e.target.value }))}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                  To Date
                                </label>
                                <input
                                  type="date"
                                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
                                  value={transactionsFilters.to_date}
                                  onChange={(e) => setTransactionsFilters(prev => ({ ...prev, to_date: e.target.value }))}
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                  Transaction Type
                                </label>
                                <select
                                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
                                  value={transactionsFilters.transaction_type}
                                  onChange={(e) => setTransactionsFilters(prev => ({ ...prev, transaction_type: e.target.value }))}
                                >
                                  {transactionTypes.map(type => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                  Direction
                                </label>
                                <select
                                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white"
                                  value={transactionsFilters.type}
                                  onChange={(e) => setTransactionsFilters(prev => ({ ...prev, type: e.target.value }))}
                                >
                                  {directionTypes.map(type => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            <div className="flex justify-end mt-4">
                              <button
                                onClick={resetFilters}
                                className="px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                              >
                                Reset Filters
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Transactions Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full table-fixed">
                          <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                            <tr>
                              <th className="w-1/6 px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date & Time</th>
                              <th className="w-1/6 px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Transaction ID</th>
                              <th className="w-1/6 px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                              <th className="w-1/4 px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                              <th className="w-1/6 px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                              <th className="w-1/6 px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created By</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {transactionsData.loading ? (
                              [...Array(5)].map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                  <td className="px-4 py-3"><div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                                  <td className="px-4 py-3"><div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                                  <td className="px-4 py-3"><div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div></td>
                                  <td className="px-4 py-3"><div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                                  <td className="px-4 py-3 text-right"><div className="h-4 w-14 bg-gray-200 dark:bg-gray-700 rounded ml-auto"></div></td>
                                  <td className="px-4 py-3"><div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                                </tr>
                              ))
                            ) : filteredTransactions.length > 0 ? (
                              filteredTransactions.map((transaction) => {
                                const badge = getTransactionBadge(transaction.transaction_type);
                                const amount = formatAmount(transaction.amount, transaction.type);
                                return (
                                  <tr key={transaction.transaction_id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <div className="flex items-center text-xs text-gray-600 dark:text-gray-300">
                                        <FiCalendar className="mr-1 text-gray-400 flex-shrink-0" size={12} />
                                        <span className="truncate">{formatDate(transaction.create_date)}</span>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <div className="flex items-center gap-1">
                                        <FiHash className="text-gray-400 flex-shrink-0" size={12} />
                                        <span className="text-xs font-mono text-gray-700 dark:text-gray-300 truncate">
                                          {transaction.transaction_id?.slice(-8)}
                                        </span>
                                        <button
                                          onClick={() => copyToClipboard(transaction.transaction_id, transaction.transaction_id)}
                                          className="p-0.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded flex-shrink-0"
                                        >
                                          {copiedId === transaction.transaction_id ? (
                                            <FiCheckCircle size={12} className="text-emerald-500" />
                                          ) : (
                                            <FiCopy size={12} />
                                          )}
                                        </button>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text} border ${badge.border}`}>
                                        <span className="mr-1">{badge.icon}</span>
                                        <span className="truncate max-w-[80px]">{badge.label}</span>
                                      </span>
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[200px]" title={transaction.remark}>
                                        {transaction.remark || 'No description'}
                                      </div>
                                      {transaction.payment_details?.utr && (
                                        <div className="flex items-center mt-0.5">
                                          <span className="text-[10px] text-gray-500 dark:text-gray-500 flex-shrink-0">UTR:</span>
                                          <span className="text-[10px] font-mono text-gray-600 dark:text-gray-400 ml-1 truncate max-w-[100px]">
                                            {transaction.payment_details.utr}
                                          </span>
                                        </div>
                                      )}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-right">
                                      <div className={`text-xs font-semibold ${amount.class} flex items-center justify-end`}>
                                        {amount.icon}
                                        <span className="truncate">{amount.prefix}{amount.formatted.replace('₹', '')}</span>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <div className="flex items-center text-xs text-gray-600 dark:text-gray-300">
                                        <FiUser className="mr-1 text-gray-400 flex-shrink-0" size={12} />
                                        <span className="truncate max-w-[80px]" title={transaction.created_by || transaction.created_by_details?.username}>
                                          {transaction.created_by || transaction.created_by_details?.username || 'SYSTEM'}
                                        </span>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            ) : (
                              <tr>
                                <td colSpan="6" className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                                  <div className="flex flex-col items-center justify-center">
                                    <FiFileText size={48} className="text-gray-300 dark:text-gray-600 mb-3" />
                                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">No transactions found</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm">
                                      {transactionsSearch || Object.values(transactionsFilters).some(v => v && v !== get30DaysAgo() && v !== getTodayDate() && v !== '') 
                                        ? 'No transactions match your current filters.'
                                        : 'This user has no transaction history yet.'}
                                    </p>
                                    {(transactionsSearch || Object.values(transactionsFilters).some(v => v && v !== get30DaysAgo() && v !== getTodayDate() && v !== '')) && (
                                      <button
                                        onClick={resetFilters}
                                        className="mt-4 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-md text-xs font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
                                      >
                                        Clear Filters
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination */}
                      {transactionsData.data.length > 0 && transactionsData.pagination.total_pages > 1 && (
                        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Showing <span className="font-medium text-gray-900 dark:text-white">{(transactionsData.pagination.page - 1) * transactionsData.pagination.limit + 1}</span> -{' '}
                            <span className="font-medium text-gray-900 dark:text-white">{Math.min(transactionsData.pagination.page * transactionsData.pagination.limit, transactionsData.pagination.total_records)}</span> of{' '}
                            <span className="font-medium text-gray-900 dark:text-white">{transactionsData.pagination.total_records}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              disabled={transactionsData.pagination.page === 1 || transactionsData.loading}
                              onClick={() => setTransactionsPage(transactionsData.pagination.page - 1)}
                              className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                              <FiChevronLeft size={16} />
                            </button>
                            <div className="text-sm font-medium px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg">
                              {transactionsData.pagination.page} / {transactionsData.pagination.total_pages}
                            </div>
                            <button
                              disabled={!transactionsData.pagination.has_more || transactionsData.loading}
                              onClick={() => setTransactionsPage(transactionsData.pagination.page + 1)}
                              className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                              <FiChevronRight size={16} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Subscriptions tab content */}
                {activeTab === 'subscriptions' && (
                  <div className="space-y-6">
                    {/* Custom Package Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <FiPackage className="text-indigo-500" size={20} />
                          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Package Pricing
                            {hasCustomPackage && (
                              <span className="ml-2 text-sm font-normal text-purple-600 dark:text-purple-400">
                                (Custom Package)
                              </span>
                            )}
                          </h2>
                        </div>
                        {!hasCustomPackage ? (
                          <button
                            onClick={handleOpenCreateCustomPackage}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
                          >
                            <FiPlus size={14} />
                            Create Custom Package
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={handleOpenEditCustomPackage}
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                              <FiEdit2 size={14} />
                              Edit
                            </button>
                            <button
                              onClick={() => setShowDeleteModal(true)}
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                              <FiTrash2 size={14} />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>

                      {loadingCustomPackage ? (
                        <div className="flex justify-center py-8">
                          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Monthly Package */}
                          <div className={`p-4 rounded-lg border-2 transition-all ${
                            hasCustomPackage 
                              ? 'border-purple-200 bg-purple-50 dark:border-purple-900 dark:bg-purple-900/10' 
                              : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Monthly</h3>
                              {hasCustomPackage && (
                                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded text-[10px] font-semibold">
                                  Custom
                                </span>
                              )}
                            </div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                              ₹{hasCustomPackage && customPackage ? customPackage.monthly?.toLocaleString('en-IN') : basePackages.monthly?.toLocaleString('en-IN')}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">per month</p>
                          </div>

                          {/* Yearly Package */}
                          <div className={`p-4 rounded-lg border-2 transition-all ${
                            hasCustomPackage 
                              ? 'border-purple-200 bg-purple-50 dark:border-purple-900 dark:bg-purple-900/10' 
                              : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Yearly</h3>
                              {hasCustomPackage && (
                                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded text-[10px] font-semibold">
                                  Custom
                                </span>
                              )}
                            </div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                              ₹{hasCustomPackage && customPackage ? customPackage.yearly?.toLocaleString('en-IN') : basePackages.yearly?.toLocaleString('en-IN')}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">per year</p>
                          </div>
                        </div>
                      )}

                      {hasCustomPackage && (
                        <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900 rounded-lg">
                          <p className="text-xs text-purple-700 dark:text-purple-300 flex items-center gap-1">
                            <FiCheckCircle size={12} />
                            This user has a custom package with special pricing.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Subscriptions List */}
                    {renderPaginatedTable({
                      items: subscriptionsData.data,
                      title: 'Active Subscriptions',
                      icon: <FiPackage className="text-indigo-500" />,
                      tableType: 'subscriptions',
                      loading: subscriptionsData.loading,
                      pagination: subscriptionsData.pagination,
                      onPageChange: (p) => setSubscriptionsPage(p),
                      searchPlaceholder: 'Search by subscription ID, plan...',
                      searchValue: subscriptionsSearchInput,
                      onSearchChange: setSubscriptionsSearchInput,
                      onSearchSubmit: () => { setSubscriptionsSearch(subscriptionsSearchInput); setSubscriptionsPage(1); }
                    })}
                  </div>
                )}
              </>
            )
          )}
        </div>
      </div>

      {/* Wallet Credit/Debit Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {walletAction === 'credit' ? 'Credit Wallet' : 'Debit Wallet'}
              </h3>
              <button
                onClick={() => setShowWalletModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <FiX size={18} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            
            <div className="p-5">
              {walletError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                  <FiAlertCircle size={14} className="flex-shrink-0" />
                  <span>{walletError}</span>
                </div>
              )}
              
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={walletAmount}
                  onChange={(e) => setWalletAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Remark (Optional)
                </label>
                <input
                  type="text"
                  value={walletRemark}
                  onChange={(e) => setWalletRemark(e.target.value)}
                  placeholder={`${walletAction === 'credit' ? 'Credit' : 'Debit'} by admin`}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleWalletAction}
                  disabled={walletLoading || !walletAmount}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition-colors flex items-center justify-center gap-2 ${
                    walletAction === 'credit' 
                      ? 'bg-emerald-600 hover:bg-emerald-700' 
                      : 'bg-rose-600 hover:bg-rose-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {walletLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      {walletAction === 'credit' ? <FiPlus size={16} /> : <FiMinus size={16} />}
                      {walletAction === 'credit' ? 'Credit' : 'Debit'} Wallet
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowWalletModal(false)}
                  className="px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Package Modal */}
      <AnimatePresence>
        {showCustomPackageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            onClick={() => setShowCustomPackageModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingCustomPackage ? 'Edit Custom Package' : 'Create Custom Package'}
                </h2>
                <button
                  onClick={() => setShowCustomPackageModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all"
                >
                  <FiX size={20} />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCustomPackageSubmit();
                }}
                className="p-6 space-y-4"
              >
                {customPackageError && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                    <FiAlertCircle size={14} className="flex-shrink-0" />
                    <span>{customPackageError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Monthly Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={customPackageForm.monthly}
                    onChange={(e) => setCustomPackageForm({ ...customPackageForm, monthly: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Yearly Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={customPackageForm.yearly}
                    onChange={(e) => setCustomPackageForm({ ...customPackageForm, yearly: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    placeholder="0.00"
                  />
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={() => setShowCustomPackageModal(false)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={customPackageLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {customPackageLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <FiSave size={16} />
                        {editingCustomPackage ? 'Update' : 'Create'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Custom Package</h2>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-all"
                >
                  <FiX size={20} />
                </button>
              </div>

              <div className="p-6">
                <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900 rounded-lg mb-4">
                  <FiAlertTriangle className="text-amber-600 dark:text-amber-400 flex-shrink-0" size={20} />
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Are you sure you want to delete this custom package? This action cannot be undone.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteCustomPackage}
                    disabled={deletingCustomPackage}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deletingCustomPackage ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <FiTrash2 size={16} />
                        Delete
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserDetails;