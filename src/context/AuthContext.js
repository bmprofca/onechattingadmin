import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiCall } from '../utils/apiCall';
import {
  getImpersonationState,
  startImpersonation,
  exitImpersonation,
  IMPERSONATION_EVENT,
  ADMIN_BACKUP_KEY,
  USER_DATA_KEY
} from '../utils/impersonationService';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [impersonation, setImpersonation] = useState(() => getImpersonationState());

  const syncImpersonationState = useCallback(() => {
    const currentState = getImpersonationState();
    setImpersonation(currentState);
  }, []);

  const checkAuth = useCallback(async () => {
    const currentImpersonation = getImpersonationState();
    setImpersonation(currentImpersonation);

    const userDataStr = localStorage.getItem(USER_DATA_KEY);
    if (!userDataStr) {
      setUser(null);
      setLoading(false);
      return;
    }

    let parsed = null;
    try {
      parsed = JSON.parse(userDataStr);
    } catch {
      localStorage.removeItem(USER_DATA_KEY);
      setUser(null);
      setLoading(false);
      return;
    }

    // If currently impersonating, set user to impersonated user profile
    if (currentImpersonation.isImpersonating && currentImpersonation.impersonatedUser) {
      setUser({
        ...currentImpersonation.impersonatedUser,
        name: currentImpersonation.impersonatedUser.name || currentImpersonation.impersonatedUser.username || 'Impersonated User',
        isImpersonating: true
      });
      setLoading(false);
      return;
    }

    try {
      const response = await apiCall('/admin/profile', 'GET');
      if (response.ok) {
        const data = await response.json();
        if (!data.error && data.admin) {
          setUser(data.admin);
        } else {
          setUser(null);
          localStorage.removeItem(USER_DATA_KEY);
        }
      } else {
        setUser(null);
        localStorage.removeItem(USER_DATA_KEY);
      }
    } catch (error) {
      console.error('Failed to authenticate:', error);
      // If we have local user profile data, fallback to it gracefully
      if (parsed?.profile) {
        setUser(parsed.profile);
      } else {
        setUser(null);
        localStorage.removeItem(USER_DATA_KEY);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();

    // Listen to local and cross-tab storage changes
    const handleStorage = (e) => {
      if (
        !e ||
        e.key === USER_DATA_KEY ||
        e.key === ADMIN_BACKUP_KEY ||
        e.key === 'impersonation_metadata' ||
        e.type === IMPERSONATION_EVENT
      ) {
        syncImpersonationState();
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(IMPERSONATION_EVENT, handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(IMPERSONATION_EVENT, handleStorage);
    };
  }, [checkAuth, syncImpersonationState]);

  const login = (userData) => {
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
    setUser(userData.profile || userData);
    syncImpersonationState();
  };

  const startImpersonatingUser = async (targetUser, sessionToken, openPortal = false) => {
    try {
      const currentStored = localStorage.getItem(USER_DATA_KEY);
      const adminData = currentStored ? JSON.parse(currentStored) : { token: user?.token, username: user?.username, profile: user };

      const result = startImpersonation({
        user: targetUser,
        sessionToken,
        adminData,
        openPortal
      });

      if (result.success) {
        syncImpersonationState();
        await checkAuth();
        return { success: true, portalUrl: result.portalUrl };
      }
      return { success: false, error: result.error };
    } catch (err) {
      console.error('startImpersonatingUser error:', err);
      return { success: false, error: err.message };
    }
  };

  const revertToAdmin = async () => {
    try {
      const result = exitImpersonation();
      if (result.success) {
        syncImpersonationState();
        await checkAuth();
        return {
          success: true,
          adminUsername: result.restoredAdmin?.username || result.restoredAdmin?.profile?.username || 'Admin'
        };
      }
      return { success: false, error: result.error };
    } catch (err) {
      console.error('revertToAdmin error:', err);
      return { success: false, error: err.message };
    }
  };

  const logout = async () => {
    // If currently impersonating, first clean up impersonation backup
    if (impersonation.isImpersonating) {
      exitImpersonation();
    }

    try {
      const response = await apiCall('/logout', 'POST');
      const data = await response.json();

      if (!response.ok || data?.error) {
        toast.error(data?.message || data?.error || 'Unable to log out. Please try again.');
        return false;
      }

      localStorage.removeItem(USER_DATA_KEY);
      localStorage.removeItem('userData');
      sessionStorage.removeItem('userData');
      setUser(null);
      syncImpersonationState();
      return true;
    } catch (error) {
      console.error('Failed to log out:', error);
      toast.error('Unable to log out. Please try again.');
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        impersonation,
        login,
        logout,
        checkAuth,
        startImpersonatingUser,
        revertToAdmin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
