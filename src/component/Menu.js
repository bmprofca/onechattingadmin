import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FiMenu,
  FiBriefcase,
  FiLogOut,
  FiPieChart,
  FiUsers,
  FiChevronRight,
  FiX,
  FiPackage
} from 'react-icons/fi';
import { fetchUserProfile } from '../api/auth';

const THEME = {
  active: 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm',
  inactive: 'text-slate-600 hover:bg-indigo-50/50 hover:text-indigo-600 border-transparent',
  iconActive: 'text-indigo-600',
  iconInactive: 'text-slate-400 group-hover:text-indigo-500'
};

const BRAND = 'OneChatting';

const isItemActive = (item, currentPath) => {
  if (item.path && item.path !== '#') {
    if (item.path === '/') return currentPath === '/' || currentPath === '';
    return currentPath === item.path || currentPath.startsWith(`${item.path}/`);
  }
  if (item.submenus) {
    return item.submenus.some(
      (submenu) =>
        submenu.path &&
        submenu.path !== '#' &&
        (currentPath === submenu.path || currentPath.startsWith(`${submenu.path}/`))
    );
  }
  return false;
};

const isSubmenuItemActive = (submenuPath, currentPath) => {
  if (submenuPath === '/') return currentPath === '/' || currentPath === '';
  return (
    submenuPath &&
    submenuPath !== '#' &&
    (currentPath === submenuPath || currentPath.startsWith(`${submenuPath}/`))
  );
};

const NavItem = ({
  item,
  isMobile,
  isMinimized,
  isHovered,
  currentPath,
  openSubmenus,
  toggleSubmenu,
  setHoveredMenu,
  hoveredMenu,
  setMobileMenuOpen
}) => {
  const navigate = useNavigate();
  const isActive = isItemActive(item, currentPath);
  const hasSubmenu = item.submenus && item.submenus.length > 0;
  const isOpen = isMobile ? openSubmenus[`mobile-${item.key}`] : openSubmenus[item.key];
  const isMini = !isMobile && isMinimized && !isHovered;

  if (hasSubmenu) {
    return (
      <div className="mb-1">
        <button
          type="button"
          onClick={() => !isMini && toggleSubmenu(isMobile ? `mobile-${item.key}` : item.key)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group border
            ${isActive ? THEME.active : THEME.inactive}
            ${isMini ? 'justify-center px-2' : ''}`}
          onMouseEnter={() => isMini && setHoveredMenu(item.key)}
          onMouseLeave={() => isMini && setHoveredMenu(null)}
        >
          <div className={`flex items-center ${isMini ? 'justify-center w-full' : 'gap-3'}`}>
            <span className={`${isActive ? THEME.iconActive : THEME.iconInactive} transition-colors`}>
              {item.icon}
            </span>
            {!isMini && <span>{item.title}</span>}
          </div>
          {!isMini && (
            <motion.span animate={{ rotate: isOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
              <FiChevronRight size={16} className={isActive ? 'text-indigo-400' : 'text-slate-400'} />
            </motion.span>
          )}

          {isMini && hoveredMenu === item.key && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded shadow-lg whitespace-nowrap z-50">
              {item.title}
            </div>
          )}
        </button>

        <AnimatePresence>
          {isOpen && !isMini && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden ml-4 mt-1 space-y-0.5 border-l border-indigo-100 pl-3"
            >
              {item.submenus.map((submenu) => {
                const subActive = isSubmenuItemActive(submenu.path, currentPath);
                return (
                  <button
                    key={submenu.path}
                    type="button"
                    onClick={() => {
                      navigate(submenu.path);
                      if (isMobile) setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      subActive
                        ? 'text-indigo-700 bg-indigo-50 font-medium'
                        : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50'
                    }`}
                  >
                    {submenu.title}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        navigate(item.path);
        if (isMobile) setMobileMenuOpen(false);
      }}
      className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group border mb-1 relative
        ${isActive ? THEME.active : THEME.inactive}
        ${isMini ? 'justify-center px-2' : 'gap-3'}`}
      onMouseEnter={() => isMini && setHoveredMenu(item.key)}
      onMouseLeave={() => isMini && setHoveredMenu(null)}
    >
      <span className={`${isActive ? THEME.iconActive : THEME.iconInactive} transition-colors`}>
        {item.icon}
      </span>
      {!isMini && <span>{item.title}</span>}

      {isMini && hoveredMenu === item.key && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded shadow-lg whitespace-nowrap z-50">
          {item.title}
        </div>
      )}
    </button>
  );
};

export const Header = ({ mobileMenuOpen, setMobileMenuOpen, isMinimized, setIsMinimized }) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [userProfile, setUserProfile] = useState({ name: '', email: '' });
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const stored = localStorage.getItem('userData');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.profile) {
          setUserProfile({
            name: parsed.profile.name || '',
            email: parsed.profile.email || ''
          });
        }
      }
    } catch {
      // ignore corrupt localStorage
    }

    const loadProfile = async () => {
      try {
        const response = await fetchUserProfile();
        if (response?.profile) {
          setUserProfile({
            name: response.profile.name || '',
            email: response.profile.email || ''
          });
          const stored = localStorage.getItem('userData');
          if (stored) {
            const parsed = JSON.parse(stored);
            localStorage.setItem(
              'userData',
              JSON.stringify({ ...parsed, profile: response.profile })
            );
          }
        }
      } catch {
        // keep localStorage profile on failure
      }
    };

    loadProfile();
  }, []);

  const getUserInitials = () => {
    if (!userProfile.name) return 'A';
    const names = userProfile.name.trim().split(/\s+/);
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return userProfile.name.substring(0, 2).toUpperCase();
  };

  const handleLogout = () => {
    localStorage.removeItem('userData');
    navigate('/login');
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 h-16 border-b border-indigo-100 bg-white/90 backdrop-blur-md">
      <div className="flex h-full items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 p-2 rounded-md transition-colors"
            onClick={() => {
              if (window.innerWidth >= 768) setIsMinimized?.(!isMinimized);
              else setMobileMenuOpen(true);
            }}
            aria-label="Toggle menu"
          >
            <FiMenu size={22} />
          </button>
          <button
            type="button"
            className="flex items-center gap-2"
            onClick={() => navigate('/')}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-lg shadow-md shadow-indigo-200">
              O
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-800 hidden sm:block">
              {BRAND}
            </span>
          </button>
        </div>

        <div className="relative">
          <button
            type="button"
            className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-100"
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-medium text-sm shadow-md border-2 border-white">
              {getUserInitials()}
            </div>
          </button>

          {profileDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setProfileDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-3 w-56 origin-top-right rounded-xl border border-slate-100 bg-white p-1 shadow-xl z-50">
                <div className="px-3 py-2 border-b border-slate-100 mb-1">
                  <p className="text-sm font-semibold text-slate-900">
                    {userProfile.name || 'Admin'}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{userProfile.email || ''}</p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <FiLogOut size={16} /> Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

const MENU_ITEMS = [
  { key: 'dashboard', title: 'Dashboard', icon: <FiPieChart size={18} />, path: '/' },
  { key: 'users', title: 'Users', icon: <FiUsers size={18} />, path: '/users' },
  { key: 'projects', title: 'Projects', icon: <FiBriefcase size={18} />, path: '/projects' },
  {
    key: 'plans',
    title: 'Plans',
    icon: <FiPackage size={18} />,
    path: '#',
    submenus: [
      { title: 'Pricing', path: '/subscriptions' },
      { title: 'Custom Pricing', path: '/custom-pricing' }
    ]
  }
];

export const Sidebar = ({ mobileMenuOpen, setMobileMenuOpen, isMinimized, setIsMinimized }) => {
  const [openSubmenus, setOpenSubmenus] = useState({});
  const [hoveredMenu, setHoveredMenu] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const location = useLocation();
  const currentPath = location.pathname;

  const toggleSubmenu = (menuKey) => {
    setOpenSubmenus((prev) => ({ ...prev, [menuKey]: !prev[menuKey] }));
  };

  return (
    <>
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              className="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl md:hidden flex flex-col"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              <div className="h-16 flex items-center justify-between px-6 border-b border-indigo-100 bg-indigo-50/30">
                <span className="text-xl font-bold text-slate-800">{BRAND}</span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                >
                  <FiX size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
                {MENU_ITEMS.map((item) => (
                  <NavItem
                    key={item.key}
                    item={item}
                    isMobile
                    currentPath={currentPath}
                    openSubmenus={openSubmenus}
                    toggleSubmenu={toggleSubmenu}
                    setMobileMenuOpen={setMobileMenuOpen}
                  />
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <motion.div
        className="hidden md:flex md:flex-col md:fixed md:inset-y-0 bg-white border-r border-indigo-100 z-40 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)]"
        initial={false}
        animate={{ width: isMinimized && !isHovered ? 80 : 260 }}
        style={{ top: '64px', height: 'calc(100vh - 64px)' }}
        onMouseEnter={() => isMinimized && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex-1 flex flex-col overflow-y-auto py-6 px-3">
          <nav className="space-y-1">
            {MENU_ITEMS.map((item) => (
              <NavItem
                key={item.key}
                item={item}
                isMobile={false}
                isMinimized={isMinimized}
                isHovered={isHovered}
                currentPath={currentPath}
                openSubmenus={openSubmenus}
                toggleSubmenu={toggleSubmenu}
                setHoveredMenu={setHoveredMenu}
                hoveredMenu={hoveredMenu}
              />
            ))}
          </nav>
        </div>
      </motion.div>
    </>
  );
};
