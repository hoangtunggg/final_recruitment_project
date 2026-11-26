import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiHome,
  FiBriefcase,
  FiUsers,
  FiFileText,
  FiChevronRight,
  FiChevronDown,
  FiBarChart2,
  FiSettings,
  FiBell,
  FiX,
  FiLogOut,
} from "react-icons/fi";
import useAuth from "../../hooks/useAuth";

const AdminSidebar = ({
  isOpen = true,
  toggleSidebar,
  activeSection,
  onSectionChange,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getInitials = () => {
    if (user?.name) {
      const parts = user.name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return user.name.slice(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return "AD";
  };

  const isJobsActive = activeSection === "jobs" || activeSection === "add-job";
  const isUsersActive =
    activeSection === "users" || activeSection === "employers";

  // Track explicit manual user toggles; defaults to activeSection state
  const [userToggle, setUserToggle] = useState({});

  const isJobsOpen =
    userToggle.jobs !== undefined ? userToggle.jobs : isJobsActive;
  const isUsersOpen =
    userToggle.users !== undefined ? userToggle.users : isUsersActive;

  const toggleDropdown = (menu) => {
    setUserToggle((prev) => {
      const current = menu === "jobs" ? isJobsOpen : isUsersOpen;
      return { ...prev, [menu]: !current };
    });
  };

  const handleSectionChange = (section) => {
    if (typeof onSectionChange === "function") {
      onSectionChange(section);
    }
  };

  return (
    <aside
      id="admin-navigation"
      aria-label="Admin Navigation"
      className={`fixed inset-y-0 left-0 transform ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } w-64 bg-white dark:bg-gray-800 border-r border-slate-300 dark:border-gray-600 z-50 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0`}
    >
      <div className="flex items-center justify-between h-16 px-6 border-b border-slate-300 dark:border-gray-600 shrink-0">
        <h1 className="text-lg font-bold text-blue-700 dark:text-blue-300">
          Admin Panel
        </h1>
        <button
          onClick={toggleSidebar}
          className="lg:hidden inline-flex h-11 w-11 items-center justify-center rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Close sidebar"
        >
          <FiX className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-4 py-6 overflow-y-auto min-h-0">
        <ul className="space-y-1.5">
          <li>
            <button
              onClick={() => handleSectionChange("dashboard")}
              aria-current={activeSection === "dashboard" ? "page" : undefined}
              className={`flex items-center w-full min-h-11 px-4 text-sm font-medium rounded-lg transition-colors duration-150 ${
                activeSection === "dashboard"
                  ? "bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-semibold"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60"
              }`}
            >
              <FiHome className="w-5 h-5 mr-3 flex-shrink-0" />
              <span>Dashboard</span>
            </button>
          </li>

          <li>
            <button
              type="button"
              onClick={() => toggleDropdown("jobs")}
              aria-expanded={isJobsOpen}
              aria-controls="admin-jobs-submenu"
              className={`flex items-center justify-between w-full min-h-11 px-4 text-sm font-medium text-left rounded-lg transition-colors duration-150 ${
                activeSection === "jobs" || activeSection === "add-job"
                  ? "text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60"
              } focus:outline-none`}
            >
              <div className="flex items-center">
                <FiBriefcase className="w-5 h-5 mr-3 flex-shrink-0" />
                <span>Job Management</span>
              </div>
              {isJobsOpen ? (
                <FiChevronDown className="w-4 h-4" />
              ) : (
                <FiChevronRight className="w-4 h-4" />
              )}
            </button>
            {isJobsOpen && (
              <ul id="admin-jobs-submenu" className="mt-1 ml-6 space-y-1 pl-2 border-l border-slate-300 dark:border-gray-600">
                <li>
                  <button
                    onClick={() => handleSectionChange("jobs")}
                    aria-current={activeSection === "jobs" ? "page" : undefined}
                    className={`block w-full text-left px-3 py-2 text-sm rounded-md transition-colors duration-150 ${
                      activeSection === "jobs"
                        ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 font-semibold"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200"
                    }`}
                  >
                    All Jobs
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleSectionChange("add-job")}
                    aria-current={activeSection === "add-job" ? "page" : undefined}
                    className={`block w-full text-left px-3 py-2 text-sm rounded-md transition-colors duration-150 ${
                      activeSection === "add-job"
                        ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 font-semibold"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200"
                    }`}
                  >
                    Add New Job
                  </button>
                </li>
              </ul>
            )}
          </li>

          <li>
            <button
              type="button"
              onClick={() => toggleDropdown("users")}
              aria-expanded={isUsersOpen}
              aria-controls="admin-users-submenu"
              className={`flex items-center justify-between w-full min-h-11 px-4 text-sm font-medium text-left rounded-lg transition-colors duration-150 ${
                activeSection === "users" || activeSection === "employers"
                  ? "text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60"
              } focus:outline-none`}
            >
              <div className="flex items-center">
                <FiUsers className="w-5 h-5 mr-3 flex-shrink-0" />
                <span>User Management</span>
              </div>
              {isUsersOpen ? (
                <FiChevronDown className="w-4 h-4" />
              ) : (
                <FiChevronRight className="w-4 h-4" />
              )}
            </button>
            {isUsersOpen && (
              <ul id="admin-users-submenu" className="mt-1 ml-6 space-y-1 pl-2 border-l border-slate-300 dark:border-gray-600">
                <li>
                  <button
                    onClick={() => handleSectionChange("users")}
                    aria-current={activeSection === "users" ? "page" : undefined}
                    className={`block w-full text-left px-3 py-2 text-sm rounded-md transition-colors duration-150 ${
                      activeSection === "users"
                        ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 font-semibold"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200"
                    }`}
                  >
                    All Users
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleSectionChange("employers")}
                    aria-current={activeSection === "employers" ? "page" : undefined}
                    className={`block w-full text-left px-3 py-2 text-sm rounded-md transition-colors duration-150 ${
                      activeSection === "employers"
                        ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 font-semibold"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200"
                    }`}
                  >
                    Employers
                  </button>
                </li>
              </ul>
            )}
          </li>

          <li>
            <button
              onClick={() => handleSectionChange("applications")}
              aria-current={activeSection === "applications" ? "page" : undefined}
              className={`flex items-center w-full min-h-11 px-4 text-sm font-medium rounded-lg transition-colors duration-150 ${
                activeSection === "applications"
                  ? "bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-semibold"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60"
              }`}
            >
              <FiFileText className="w-5 h-5 mr-3 flex-shrink-0" />
              <span>Application Management</span>
            </button>
          </li>

          <li>
            <button
              onClick={() => handleSectionChange("reports")}
              aria-current={activeSection === "reports" ? "page" : undefined}
              className={`flex items-center w-full min-h-11 px-4 text-sm font-medium rounded-lg transition-colors duration-150 ${
                activeSection === "reports"
                  ? "bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-semibold"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60"
              }`}
            >
              <FiBarChart2 className="w-5 h-5 mr-3 flex-shrink-0" />
              <span>Reports & Analytics</span>
            </button>
          </li>

          <li>
            <button
              onClick={() => handleSectionChange("notifications")}
              aria-current={activeSection === "notifications" ? "page" : undefined}
              className={`flex items-center w-full min-h-11 px-4 text-sm font-medium rounded-lg transition-colors duration-150 ${
                activeSection === "notifications"
                  ? "bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-semibold"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60"
              }`}
            >
              <FiBell className="w-5 h-5 mr-3 flex-shrink-0" />
              <span>Notifications</span>
            </button>
          </li>

          <li>
            <button
              onClick={() => handleSectionChange("settings")}
              aria-current={activeSection === "settings" ? "page" : undefined}
              className={`flex items-center w-full min-h-11 px-4 text-sm font-medium rounded-lg transition-colors duration-150 ${
                activeSection === "settings"
                  ? "bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-semibold"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60"
              }`}
            >
              <FiSettings className="w-5 h-5 mr-3 flex-shrink-0" />
              <span>System Settings</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* Profile & Logout Section at bottom of Sidebar */}
      <div className="p-4 border-t border-slate-300 dark:border-gray-600 bg-gray-50/70 dark:bg-gray-900/40 shrink-0">
        <div className="flex items-center space-x-3 mb-3 p-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200/80 dark:border-gray-700 ">
          <div className="w-10 h-10 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold text-xs tracking-wider shrink-0 shadow-xs">
            {getInitials()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
              {user?.name || "Administrator"}
            </p>
            <p className="text-sm text-slate-600 dark:text-gray-300 truncate">
              {user?.email || "admin@system.local"}
            </p>
            <span className="inline-block mt-0.5 px-1.5 py-0.2 text-[9px] uppercase font-bold tracking-wider rounded bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
              Admin
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors border border-red-200 dark:border-red-900/60"
        >
          <FiLogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
