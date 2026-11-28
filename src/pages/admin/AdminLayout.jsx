import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import AdminSidebar from "../../components/admin/AdminSidebar";
import AdminHeader from "../../components/admin/AdminHeader";
import { useTranslation } from "react-i18next";
import { TopBar } from "../../components/ui";
import useCollapsibleSidebar from "../../hooks/useCollapsibleSidebar";
import "../../styles/workspace-ui.css";

const AdminLayout = () => {
  const { t } = useTranslation("admin");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Desktop collapse (icon rail), remembered in localStorage; the mobile drawer is unaffected.
  const { collapsed, rail, toggleCollapsed } = useCollapsibleSidebar("sidebar:admin");
  const navigate = useNavigate();
  const location = useLocation();

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  // Support Escape key to close mobile sidebar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sidebarOpen]);

  // Map current path to active section
  const getActiveSection = () => {
    const path = location.pathname;
    if (path === "/admin" || path === "/admin/") return "dashboard";
    if (path.startsWith("/admin/jobs"))
      return path.includes("add") ? "add-job" : "jobs";
    if (path.startsWith("/admin/users")) return "users";
    if (path.startsWith("/admin/employers")) return "employers";
    if (path.startsWith("/admin/applications")) return "applications";
    if (path.startsWith("/admin/reports")) return "reports";
    if (path.startsWith("/admin/notifications")) return "notifications";
    if (path.startsWith("/admin/settings")) return "settings";
    return "dashboard";
  };

  const handleSectionChange = (section) => {
    const routes = {
      dashboard: "/admin",
      jobs: "/admin/jobs",
      "add-job": "/admin/jobs/add",
      users: "/admin/users",
      employers: "/admin/employers",
      applications: "/admin/applications",
      reports: "/admin/reports",
      settings: "/admin/settings",
      notifications: "/admin/notifications",
    };

    if (routes[section]) {
      navigate(routes[section]);
      setSidebarOpen(false);
    }
  };

  return (
    <div className="workspace-ui min-h-screen pt-1.5 bg-canvas text-ink transition-colors duration-200">
      <TopBar className="!h-1.5 fixed inset-x-0 top-0 z-[60]" />
      <a className="workspace-skip-link" href="#admin-main-content">
        {t("layout.skipToContent")}
      </a>
      {/* Mobile sidebar backdrop overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <AdminSidebar
        isOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        activeSection={getActiveSection()}
        onSectionChange={handleSectionChange}
        collapsed={rail}
      />

      <div
        className={`flex flex-col min-h-screen transition-[padding] duration-300 ease-in-out motion-reduce:transition-none ${
          collapsed ? "lg:pl-20" : "lg:pl-64"
        }`}
      >
        <AdminHeader
          toggleSidebar={toggleSidebar}
          sidebarOpen={sidebarOpen}
          sidebarCollapsed={collapsed}
          onToggleCollapse={toggleCollapsed}
        />
        <main id="admin-main-content" tabIndex="-1" className="p-4 sm:p-6 lg:p-8 flex-1">
          <div className="max-w-[1600px] mx-auto min-w-0"><Outlet /></div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
