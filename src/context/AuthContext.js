import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiCall } from '../utils/apiCall';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    const userDataStr = localStorage.getItem('user_data');
    if (!userDataStr) {
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
          localStorage.removeItem('user_data');
        }
      } else {
        setUser(null);
        localStorage.removeItem('user_data');
      }
    } catch (error) {
      console.error('Failed to authenticate:', error);
      setUser(null);
      localStorage.removeItem('user_data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = (userData) => {
    localStorage.setItem('user_data', JSON.stringify(userData));
    setUser(userData.profile);
    // You might want to re-fetch the full profile here depending on the response
  };

  const logout = async () => {
    try {
      const response = await apiCall('/logout', 'POST');
      const data = await response.json();

      if (!response.ok || data?.error) {
        toast.error(data?.message || data?.error || 'Unable to log out. Please try again.');
        return false;
      }

      localStorage.removeItem('user_data');
      localStorage.removeItem('userData');
      sessionStorage.removeItem('userData');
      setUser(null);
      return true;
    } catch (error) {
      console.error('Failed to log out:', error);
      toast.error('Unable to log out. Please try again.');
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
