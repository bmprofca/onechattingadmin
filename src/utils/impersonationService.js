import { API_BASE_URL, PORTAL_URL } from '../config/api';

export const ADMIN_BACKUP_KEY = 'admin_session_backup';
export const IMPERSONATION_META_KEY = 'impersonation_metadata';
export const USER_DATA_KEY = 'user_data';
export const IMPERSONATION_EVENT = 'onechatting_impersonation_change';

/**
 * Checks if the target user has an active session token.
 * Calls the backend login-tokens endpoint for the specific user.
 * @param {string} username - Target user username or email
 * @param {string} adminToken - Current admin authentication token
 * @returns {Promise<{ hasActiveSession: boolean, activeToken: string | null, tokenRecord: object | null, allTokens: Array }>}
 */
export const checkUserActiveSession = async (username, adminToken) => {
  if (!username) {
    throw new Error('Username is required to verify active session.');
  }

  const endpoint = `${API_BASE_URL}/admin/users/${encodeURIComponent(username)}/login-tokens?page=1&limit=20`;
  const headers = {
    'Content-Type': 'application/json',
  };

  if (adminToken) {
    headers['Authorization'] = `Bearer ${adminToken}`;
    headers['x-token'] = adminToken;
    headers['x-auth-token'] = adminToken;
  }

  try {
    const response = await fetch(endpoint, { method: 'GET', headers });
    const data = await response.json();

    if (!response.ok || data?.error) {
      return {
        hasActiveSession: false,
        activeToken: null,
        tokenRecord: null,
        allTokens: [],
        message: data?.message || 'Failed to fetch user session tokens.'
      };
    }

    const tokens = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
    
    if (tokens.length === 0) {
      return {
        hasActiveSession: false,
        activeToken: null,
        tokenRecord: null,
        allTokens: [],
        message: 'No login sessions found for this user.'
      };
    }

    // Find first active session token
    // An active token typically has status '1'/'active' or is not expired
    const activeTokenObj = tokens.find(t => {
      const isStatusActive = t.status === '1' || t.status === 1 || t.status === 'active' || t.is_active === true || t.is_active === '1';
      const notExpired = t.expire_date || t.expires_at ? new Date(t.expire_date || t.expires_at) > new Date() : true;
      return (t.token || t.jwt_token || t.session_key || t.session_token) && (isStatusActive || notExpired);
    }) || tokens[0]; // fallback to most recent token if available

    const resolvedToken = activeTokenObj?.token || activeTokenObj?.jwt_token || activeTokenObj?.session_key || activeTokenObj?.session_token || null;

    return {
      hasActiveSession: Boolean(resolvedToken),
      activeToken: resolvedToken,
      tokenRecord: activeTokenObj || null,
      allTokens: tokens
    };
  } catch (error) {
    console.error('Error verifying user active session:', error);
    return {
      hasActiveSession: false,
      activeToken: null,
      tokenRecord: null,
      allTokens: [],
      message: error.message || 'Network error while checking active session.'
    };
  }
};

/**
 * Gets current impersonation state from localStorage
 * @returns {{ isImpersonating: boolean, impersonatedUser: object | null, impersonatedAt: string | null, adminUsername: string | null }}
 */
export const getImpersonationState = () => {
  try {
    const metaStr = localStorage.getItem(IMPERSONATION_META_KEY);
    const backupStr = localStorage.getItem(ADMIN_BACKUP_KEY);
    
    if (!metaStr || !backupStr) {
      return {
        isImpersonating: false,
        impersonatedUser: null,
        impersonatedAt: null,
        adminUsername: null
      };
    }

    const meta = JSON.parse(metaStr);
    return {
      isImpersonating: true,
      impersonatedUser: meta.user || null,
      impersonatedAt: meta.impersonatedAt || null,
      adminUsername: meta.adminUsername || null
    };
  } catch (e) {
    console.error('Failed to parse impersonation metadata:', e);
    return {
      isImpersonating: false,
      impersonatedUser: null,
      impersonatedAt: null,
      adminUsername: null
    };
  }
};

/**
 * Swaps session in localStorage: backs up admin session and saves user's session
 * @param {object} params
 * @param {object} params.user - Target user details (id, username, email, name, role)
 * @param {string} params.sessionToken - Target user session key / token
 * @param {object} [params.adminData] - Optional existing admin session data
 * @param {boolean} [params.openPortal] - Whether to launch/open the client portal
 * @returns {{ success: boolean, portalUrl?: string, error?: string }}
 */
export const startImpersonation = ({ user, sessionToken, adminData = null, openPortal = false }) => {
  if (!sessionToken) {
    return { success: false, error: 'Cannot impersonate without a valid session token.' };
  }

  try {
    // 1. Get or verify Admin Session Backup
    let currentAdminData = adminData;
    if (!currentAdminData) {
      const storedData = localStorage.getItem(USER_DATA_KEY) || localStorage.getItem('userData');
      if (storedData) {
        currentAdminData = JSON.parse(storedData);
      }
    }

    if (!currentAdminData || !currentAdminData.token) {
      return { success: false, error: 'Current admin session is invalid or missing.' };
    }

    // Only create backup if not already impersonating to prevent overwriting original admin backup
    const existingBackup = localStorage.getItem(ADMIN_BACKUP_KEY);
    if (!existingBackup) {
      localStorage.setItem(ADMIN_BACKUP_KEY, JSON.stringify(currentAdminData));
    }

    // 2. Prepare user session payload
    const userSessionPayload = {
      token: sessionToken,
      username: user.username || user.email,
      role: user.role || 'user',
      profile: {
        id: user.id || user._id,
        name: user.name || user.username || 'User',
        email: user.email,
        mobile: user.mobile,
        country_code: user.country_code,
        username: user.username,
        role: user.role || 'user',
        balance: user.balance
      }
    };

    // 3. Save user session to primary storage keys
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(userSessionPayload));
    localStorage.setItem('userData', JSON.stringify(userSessionPayload));

    // 4. Save impersonation metadata
    const metaPayload = {
      isImpersonating: true,
      impersonatedAt: new Date().toISOString(),
      adminUsername: currentAdminData.username || currentAdminData.profile?.username || 'Admin',
      user: {
        id: user.id || user._id,
        name: user.name || user.username || 'User',
        username: user.username,
        email: user.email,
        role: user.role || 'user'
      }
    };
    localStorage.setItem(IMPERSONATION_META_KEY, JSON.stringify(metaPayload));

    // 5. Notify all listeners in this window and across tabs
    window.dispatchEvent(new CustomEvent(IMPERSONATION_EVENT, { detail: metaPayload }));
    window.dispatchEvent(new Event('storage'));

    // 6. Handle portal redirection if requested
    let portalTargetUrl = null;
    if (openPortal) {
      const baseUrl = PORTAL_URL.replace(/\/$/, '');
      portalTargetUrl = `${baseUrl}/login?token=${encodeURIComponent(sessionToken)}&username=${encodeURIComponent(user.username || user.email)}`;
      window.open(portalTargetUrl, '_blank', 'noopener,noreferrer');
    }

    return {
      success: true,
      portalUrl: portalTargetUrl
    };
  } catch (err) {
    console.error('Failed to start impersonation:', err);
    return { success: false, error: err.message || 'Failed to start user impersonation session.' };
  }
};

/**
 * Restores original Admin session from backup and removes impersonation tokens
 * @returns {{ success: boolean, restoredAdmin?: object, error?: string }}
 */
export const exitImpersonation = () => {
  try {
    const backupStr = localStorage.getItem(ADMIN_BACKUP_KEY);
    
    // Clear user tokens
    localStorage.removeItem(USER_DATA_KEY);
    localStorage.removeItem('userData');
    localStorage.removeItem(IMPERSONATION_META_KEY);

    let restoredAdmin = null;
    if (backupStr) {
      restoredAdmin = JSON.parse(backupStr);
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(restoredAdmin));
      localStorage.setItem('userData', JSON.stringify(restoredAdmin));
      localStorage.removeItem(ADMIN_BACKUP_KEY);
    }

    // Broadcast session change
    window.dispatchEvent(new CustomEvent(IMPERSONATION_EVENT, { detail: { isImpersonating: false } }));
    window.dispatchEvent(new Event('storage'));

    return {
      success: true,
      restoredAdmin
    };
  } catch (err) {
    console.error('Failed to exit impersonation:', err);
    return { success: false, error: err.message || 'Failed to restore admin session.' };
  }
};
