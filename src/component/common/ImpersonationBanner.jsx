import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLogOut, FiExternalLink, FiUserCheck, FiShield } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { PORTAL_URL } from '../../config/api';
import toast from 'react-hot-toast';

const ImpersonationBanner = () => {
  const { impersonation, revertToAdmin } = useAuth();
  const [exiting, setExiting] = useState(false);
  const navigate = useNavigate();

  if (!impersonation || !impersonation.isImpersonating) {
    return null;
  }

  const { impersonatedUser } = impersonation;

  const handleExit = async () => {
    setExiting(true);
    try {
      const res = await revertToAdmin();
      if (res.success) {
        toast.success(`Exited user session. Logged back in as Admin (${res.adminUsername || 'Admin'}).`);
        // If user was on a specific user's page or general page, reload or navigate cleanly
        if (impersonatedUser?.username) {
          navigate(`/users/${impersonatedUser.username}`);
        } else {
          navigate('/users');
        }
      } else {
        toast.error(res.error || 'Failed to return to admin session.');
      }
    } catch (err) {
      console.error('Error exiting impersonation:', err);
      toast.error('Failed to exit impersonation mode.');
    } finally {
      setExiting(false);
    }
  };

  const handleOpenPortal = () => {
    try {
      const userDataStr = localStorage.getItem('user_data');
      let token = '';
      if (userDataStr) {
        const parsed = JSON.parse(userDataStr);
        token = parsed.token || '';
      }
      const baseUrl = PORTAL_URL.replace(/\/$/, '');
      const url = `${baseUrl}/login?token=${encodeURIComponent(token)}&username=${encodeURIComponent(impersonatedUser?.username || impersonatedUser?.email || '')}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      console.error('Error opening user portal:', e);
    }
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="sticky top-0 z-50 w-full bg-gradient-to-r from-amber-600 via-rose-600 to-amber-700 text-white shadow-lg border-b border-amber-400/30 transition-all duration-300 select-none"
    >
      <div className="max-w-8xl mx-auto px-4 py-2.5 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-2 md:gap-4">
        
        {/* Left Side: Badge & Info */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-black/25 text-amber-100 border border-white/20">
              <FiShield className="inline" size={12} /> Impersonation Active
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs md:text-sm font-medium">
            <span>Logged in as:</span>
            <span className="font-bold bg-white/20 px-2 py-0.5 rounded text-white flex items-center gap-1">
              <FiUserCheck size={13} className="text-amber-200" />
              {impersonatedUser?.name || impersonatedUser?.username || 'User'}
            </span>
            {impersonatedUser?.email && (
              <span className="text-white/80 text-xs hidden lg:inline">
                ({impersonatedUser.email})
              </span>
            )}
          </div>
        </div>

        {/* Mobile Info View */}
        <div className="sm:hidden text-xs font-medium text-white/95 text-center">
          Viewing as <span className="font-bold underline">{impersonatedUser?.name || impersonatedUser?.username}</span>
        </div>

        {/* Right Side: Action Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={handleOpenPortal}
            title="Open End-User Client Portal in a new tab"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/15 hover:bg-white/25 active:bg-white/30 text-white border border-white/20 transition-all shadow-sm"
          >
            <FiExternalLink size={13} />
            <span className="hidden sm:inline">Open User Portal</span>
            <span className="sm:hidden">Portal</span>
          </button>

          <button
            type="button"
            onClick={handleExit}
            disabled={exiting}
            title="Revert to Admin Session"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-white text-rose-700 hover:bg-rose-50 active:bg-rose-100 hover:shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            <FiLogOut size={13} className={exiting ? 'animate-spin' : ''} />
            {exiting ? 'Exiting...' : 'Exit & Return to Admin'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ImpersonationBanner;
