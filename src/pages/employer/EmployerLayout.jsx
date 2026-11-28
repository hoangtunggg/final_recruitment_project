import React, { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { FiMenu, FiPlus } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import useAuth from "../../hooks/useAuth";
import ThemeToggle from "../../components/common/ThemeToggle";
import LanguageToggle from "../../components/common/LanguageToggle";
import SidebarCollapseButton from "../../components/common/SidebarCollapseButton";
import { Button, TopBar } from "../../components/ui";
import EmployerSidebar from "../../components/employer/EmployerSidebar";
import useCollapsibleSidebar from "../../hooks/useCollapsibleSidebar";
import "../../styles/workspace-ui.css";

/** Two-letter avatar initials from the first available of name / company / email. */
const getInitials = (user) => {
  const source = user?.name || user?.company;
  if (source) {
    const parts = source.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : source.slice(0, 2).toUpperCase();
  }
  return user?.email ? user.email.slice(0, 2).toUpperCase() : "EM";
};

/** Section title key (employer:layout.titles.<key>) for the current path. */
const getTitleKey = (path) => {
  if (path === "/employer" || path === "/employer/") return "overview";
  if (path.startsWith("/employer/post-job")) return "postJob";
  if (path.startsWith("/employer/jobs/edit")) return "editJob";
  if (path.includes("/applicants") && path.includes("/jobs/")) return "jobApplicants";
  if (path.startsWith("/employer/jobs")) return "myJobs";
  if (path.startsWith("/employer/applicants")) return "applicantTracking";
  if (path.startsWith("/employer/interviews")) return "interviews";
  if (path.startsWith("/employer/analytics")) return "analytics";
  if (path.startsWith("/employer/settings")) return "settings";
  return "hub";
};

const EmployerLayout = () => {
  const { t } = useTranslation(["employer", "common"]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Desktop collapse (icon rail), remembered in localStorage; the mobile drawer is unaffected.
  const { collapsed, rail, toggleCollapsed } = useCollapsibleSidebar("sidebar:employer");
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Support Escape key to close mobile drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && sidebarOpen) setSidebarOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sidebarOpen]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const displayName =
    user?.name ||
    user?.company ||
    (user?.email ? user.email.split("@")[0] : t("employer:layout.employerFallback"));
  const displayCompany = user?.company || user?.email || t("employer:layout.portal");

  return (
    <div className="workspace-ui min-h-screen bg-canvas text-ink transition-colors duration-200">
      <a className="workspace-skip-link" href="#employer-main-content">
        {t("employer:layout.skipToMain")}
      </a>
      <div className="fixed inset-x-0 top-0 z-[60]">
        <TopBar />
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink/50 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <EmployerSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
        displayName={displayName}
        displayCompany={displayCompany}
        initials={getInitials(user)}
        collapsed={rail}
      />

      <div
        className={`flex min-h-screen flex-col pt-2.5 transition-[padding] duration-300 ease-in-out motion-reduce:transition-none ${
          collapsed ? "lg:pl-20" : "lg:pl-64"
        }`}
      >
        <header className="sticky top-2.5 z-30 flex h-16 shrink-0 items-center justify-between border-b border-line bg-surface px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-controls="employer-navigation"
              aria-expanded={sidebarOpen}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-muted hover:bg-tint hover:text-ink lg:hidden"
              aria-label={t("employer:layout.openSidebar")}
            >
              <FiMenu className="h-5 w-5" />
            </button>
            <SidebarCollapseButton
              collapsed={collapsed}
              onToggle={toggleCollapsed}
              controls="employer-navigation"
              label={t(collapsed ? "employer:layout.expandSidebar" : "employer:layout.collapseSidebar")}
              testId="employer-sidebar-collapse"
            />
            <div className="min-w-0">
              <p className="truncate text-base font-extrabold leading-tight text-ink sm:text-lg">
                {t(`employer:layout.titles.${getTitleKey(location.pathname)}`)}
              </p>
              <p className="hidden text-sm text-muted sm:block">
                {t("employer:layout.welcome", { name: displayName })}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <LanguageToggle size="sm" />
            <ThemeToggle size="sm" />
            {location.pathname !== "/employer/post-job" && (
              <Button
                as={Link}
                to="/employer/post-job"
                size="sm"
                leftIcon={<FiPlus />}
                className="hidden whitespace-nowrap sm:inline-flex"
              >
                {t("employer:layout.nav.postJob")}
              </Button>
            )}
          </div>
        </header>

        <main
          id="employer-main-content"
          tabIndex="-1"
          className="flex-1 bg-canvas p-4 transition-colors sm:p-6 lg:p-8"
        >
          <div className="mx-auto min-w-0 max-w-[1600px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default EmployerLayout;
