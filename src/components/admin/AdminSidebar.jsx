import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
import { Brand, Button } from "../ui";

// Sidebar structure. `id` doubles as the section key used by AdminLayout (routes) and the test id.
// Items with `children` render as a collapsible group; labels live in admin.json under `nav.*`.
const NAV_ITEMS = [
  { id: "dashboard", icon: FiHome, labelKey: "nav.dashboard" },
  {
    group: "jobs",
    icon: FiBriefcase,
    labelKey: "nav.jobManagement",
    children: [
      { id: "jobs", labelKey: "nav.allJobs" },
      { id: "add-job", labelKey: "nav.addJob" },
    ],
  },
  {
    group: "users",
    icon: FiUsers,
    labelKey: "nav.userManagement",
    children: [
      { id: "users", labelKey: "nav.allUsers" },
      { id: "employers", labelKey: "nav.employers" },
    ],
  },
  { id: "applications", icon: FiFileText, labelKey: "nav.applications" },
  { id: "reports", icon: FiBarChart2, labelKey: "nav.reports" },
  { id: "notifications", icon: FiBell, labelKey: "nav.notifications" },
  { id: "settings", icon: FiSettings, labelKey: "nav.settings" },
];

const ROW_BASE =
  "flex items-center w-full min-h-11 px-4 text-sm font-medium text-left rounded-control transition-colors duration-150";
const ROW_ACTIVE = "bg-tint text-primary-text font-semibold";
const ROW_IDLE = "text-ink hover:bg-tint";

const AdminSidebar = ({
  isOpen = true,
  toggleSidebar,
  activeSection,
  onSectionChange,
}) => {
  const { t } = useTranslation("admin");
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Track explicit manual toggles; a group defaults to open while one of its children is active.
  const [userToggle, setUserToggle] = useState({});

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

  const isGroupOpen = (item) =>
    userToggle[item.group] !== undefined
      ? userToggle[item.group]
      : item.children.some((child) => child.id === activeSection);

  const toggleGroup = (item) => {
    const current = isGroupOpen(item);
    setUserToggle((prev) => ({ ...prev, [item.group]: !current }));
  };

  const handleSectionChange = (section) => {
    if (typeof onSectionChange === "function") {
      onSectionChange(section);
    }
  };

  const renderLeaf = (item) => {
    const active = activeSection === item.id;
    const Icon = item.icon;
    return (
      <button
        type="button"
        onClick={() => handleSectionChange(item.id)}
        aria-current={active ? "page" : undefined}
        data-testid={`admin-nav-${item.id}`}
        className={`${ROW_BASE} ${active ? ROW_ACTIVE : ROW_IDLE}`}
      >
        <Icon className="w-5 h-5 mr-3 flex-shrink-0" aria-hidden="true" />
        <span>{t(item.labelKey)}</span>
      </button>
    );
  };

  const renderGroup = (item) => {
    const open = isGroupOpen(item);
    const groupActive = item.children.some((child) => child.id === activeSection);
    const submenuId = `admin-${item.group}-submenu`;
    const Icon = item.icon;
    return (
      <>
        <button
          type="button"
          onClick={() => toggleGroup(item)}
          aria-expanded={open}
          aria-controls={submenuId}
          data-testid={`admin-nav-group-${item.group}`}
          className={`${ROW_BASE} justify-between ${groupActive ? "text-primary-text bg-tint/60" : ROW_IDLE}`}
        >
          <span className="flex items-center">
            <Icon className="w-5 h-5 mr-3 flex-shrink-0" aria-hidden="true" />
            <span>{t(item.labelKey)}</span>
          </span>
          {open ? (
            <FiChevronDown className="w-4 h-4" aria-hidden="true" />
          ) : (
            <FiChevronRight className="w-4 h-4" aria-hidden="true" />
          )}
        </button>
        {open && (
          <ul id={submenuId} className="mt-1 ml-6 space-y-1 pl-2 border-l border-line">
            {item.children.map((child) => {
              const active = activeSection === child.id;
              return (
                <li key={child.id}>
                  <button
                    type="button"
                    onClick={() => handleSectionChange(child.id)}
                    aria-current={active ? "page" : undefined}
                    data-testid={`admin-nav-${child.id}`}
                    className={`block w-full text-left px-3 py-2 min-h-10 text-sm rounded-control transition-colors duration-150 ${
                      active ? ROW_ACTIVE : "text-muted hover:bg-tint hover:text-ink"
                    }`}
                  >
                    {t(child.labelKey)}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </>
    );
  };

  return (
    <aside
      id="admin-navigation"
      aria-label={t("nav.ariaLabel")}
      data-testid="admin-sidebar"
      className={`fixed top-1.5 bottom-0 left-0 transform ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } w-64 bg-surface border-r border-line z-50 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0`}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-line shrink-0">
        <Brand />
        <button
          type="button"
          onClick={toggleSidebar}
          className="lg:hidden inline-flex h-11 w-11 items-center justify-center rounded-control text-muted hover:text-ink hover:bg-tint"
          aria-label={t("nav.closeSidebar")}
        >
          <FiX className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      <nav className="flex-1 px-4 py-6 overflow-y-auto min-h-0">
        <p className="px-4 mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
          {t("nav.panelTitle")}
        </p>
        <ul className="space-y-1.5">
          {NAV_ITEMS.map((item) => (
            <li key={item.id || item.group}>
              {item.children ? renderGroup(item) : renderLeaf(item)}
            </li>
          ))}
        </ul>
      </nav>

      {/* Profile & logout at the bottom of the sidebar */}
      <div className="p-4 border-t border-line bg-tint/50 shrink-0">
        <div className="flex items-center space-x-3 mb-3 p-2.5 bg-surface rounded-xl border border-line">
          <div className="w-10 h-10 rounded-lg bg-primary-600 text-white flex items-center justify-center font-bold text-xs tracking-wider shrink-0">
            {getInitials()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-ink truncate">
              {user?.name || t("nav.adminFallback")}
            </p>
            <p className="text-xs text-muted truncate">{user?.email || "admin@system.local"}</p>
            <span className="inline-block mt-0.5 px-1.5 text-[10px] uppercase font-bold tracking-wider rounded bg-tint text-primary-text">
              {t("common:enums.userRole.admin")}
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          fullWidth
          onClick={handleLogout}
          data-testid="admin-logout"
          leftIcon={<FiLogOut className="w-4 h-4" aria-hidden="true" />}
          className="!border-danger/40 !text-danger hover:!bg-danger/10"
        >
          {t("common:nav.signOut")}
        </Button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
