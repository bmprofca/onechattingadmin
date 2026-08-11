import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  User,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const Navbar = ({
  toggleSidebar,
  isMobile,
  sidebarOpen,
  isDesktopSidebarExpanded,
}) => {
  const [openDropdown, setOpenDropdown] = useState(false);
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    const loggedOut = await logout();
    if (loggedOut) {
      navigate("/login");
    }
  };

  const isSidebarOpen = isMobile ? sidebarOpen : isDesktopSidebarExpanded;

  return (
    <>
      <nav className="z-40 h-16 shrink-0 bg-white dark:bg-gray-900 shadow-md border-b border-gray-200 transition-colors duration-300">
        <div className="px-4 h-full">
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleSidebar}
                className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200 focus:outline-none flex-shrink-0
                  ${isSidebarOpen ? "text-gray-600" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"}`}
                aria-label="Toggle menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="flex items-center gap-1 rounded-lg transition-opacity duration-200 hover:opacity-90 focus:outline-none"
              >
                <div>
                  <span className="text-xl font-bold text-gray-800 tracking-tight">
                    Admin
                    <span className="font-light text-gray-600">
                      Panel
                    </span>
                  </span>
                </div>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative">
                <button
                  onClick={() => setOpenDropdown(!openDropdown)}
                  className="flex items-center space-x-3 p-1.5 pr-3 rounded-lg hover:bg-gray-100 transition-all duration-200 group"
                >
                  <div className="relative">
                    <div className="w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center shadow-md bg-gradient-to-br from-blue-500 to-indigo-600">
                      <span className="text-white font-bold text-sm">
                        {user?.name?.[0]?.toUpperCase() || "A"}
                      </span>
                    </div>
                  </div>

                  <div className="hidden md:block text-left">
                    <p className="text-sm font-semibold text-gray-800">
                      {user?.name || "Admin"}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      Administrator
                    </p>
                  </div>

                  <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors hidden md:block" />
                </button>

                {openDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setOpenDropdown(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
                      <div className="md:hidden p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                          <span className="text-white font-bold">
                            {user?.name?.[0]?.toUpperCase() || "A"}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">
                            {user?.name || "Admin"}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">
                            Administrator
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
