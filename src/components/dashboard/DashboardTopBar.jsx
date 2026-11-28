import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FiLogOut } from "react-icons/fi";
import { Brand, TopBar } from "../ui";
import LanguageToggle from "../common/LanguageToggle";
import ThemeToggle from "../common/ThemeToggle";
import DashboardTabs from "./DashboardTabs";

/**
 * Sticky header of the candidate dashboard. The public Navbar is hidden on /dashboard,
 * so this bar carries the 5-colour strip, brand, language / theme toggles and sign-out
 * on the first row and the tabs (+ AI interview link) on a scrollable second row.
 */
const DashboardTopBar = ({ user, activeTab, sectionTitle, counts, onTabChange, onLogout }) => {
  const { t } = useTranslation("candidate");
  return (
    <header className="sticky top-0 z-40 border-b border-tint-line bg-surface" data-testid="dashboard-header">
      <TopBar />
      <div className="mx-auto max-w-page px-4">
        <div className="flex min-h-16 items-center justify-between gap-4 py-2">
          <Link to="/dashboard" onClick={() => onTabChange("overview")} className="shrink-0 rounded-control" aria-label={t("shell.brandAria")}>
            <Brand />
          </Link>

          <div className="flex shrink-0 items-center gap-2">
            <div className="hidden max-w-48 text-right md:block">
              <p className="truncate text-sm font-semibold text-ink">{user?.name || t("header.fallbackName")}</p>
              <p className="truncate text-xs text-muted">{sectionTitle}</p>
            </div>
            <LanguageToggle size="sm" />
            <ThemeToggle size="sm" />
            <button
              type="button"
              onClick={onLogout}
              aria-label={t("shell.signOut")}
              title={t("shell.signOut")}
              data-testid="dashboard-logout"
              className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-danger hover:text-danger"
            >
              <FiLogOut aria-hidden="true" />
            </button>
          </div>
        </div>
        <DashboardTabs instanceId="main" activeTab={activeTab} onTabChange={onTabChange} counts={counts} />
      </div>
    </header>
  );
};

export default DashboardTopBar;
