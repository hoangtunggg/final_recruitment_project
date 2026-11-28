import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FiBookmark, FiBriefcase, FiFileText, FiGrid, FiLogOut, FiMic, FiStar, FiX } from "react-icons/fi";
import { Brand, TopBar, cx } from "../ui";
import LanguageToggle from "../common/LanguageToggle";
import { useEnumLabel } from "../../i18n/helpers";

const NAV_ITEMS = [
  { id: "overview", icon: FiGrid },
  { id: "applications", icon: FiBriefcase, countKey: "applications" },
  { id: "saved", icon: FiBookmark, countKey: "saved" },
  { id: "recommended", icon: FiStar, countKey: "recommended" },
  { id: "resumes", icon: FiFileText, countKey: "resumes" },
];

const itemClass = (active) =>
  cx(
    "flex min-h-11 w-full cursor-pointer items-center justify-between rounded-pill px-4 text-sm font-semibold transition-colors",
    active ? "bg-primary-600 text-white" : "text-ink hover:bg-tint hover:text-primary-text"
  );

const initialsOf = (user) => {
  if (user?.name) {
    const parts = user.name.trim().split(/\s+/);
    return (parts.length >= 2 ? parts[0][0] + parts[1][0] : user.name.slice(0, 2)).toUpperCase();
  }
  return user?.email ? user.email.slice(0, 2).toUpperCase() : "JS";
};

/**
 * Side navigation for the candidate area (drawer on mobile). Entries mirror the dashboard tabs
 * and add the AI interview page (/interview). Not mounted by the current dashboard layout, which uses
 * DashboardTabs in its header, but kept in sync so it can be used by other layouts.
 */
const JobSeekerSidebar = ({ isOpen = false, toggleSidebar, activeTab = "overview", onTabChange, counts = {}, user, onLogout }) => {
  const { t } = useTranslation("candidate");
  const enumLabel = useEnumLabel();

  const select = (tabId) => {
    if (typeof onTabChange === "function") onTabChange(tabId);
    if (typeof toggleSidebar === "function" && isOpen) toggleSidebar();
  };

  return (
    <aside
      aria-label={t("sidebar.aria")}
      className={cx(
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-col justify-between border-r border-tint-line bg-surface transition-transform duration-300 ease-in-out lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div>
        <TopBar />
        <div className="flex h-16 items-center justify-between border-b border-line px-5">
          <Link to="/dashboard" onClick={() => select("overview")} aria-label={t("shell.brandAria")}>
            <Brand />
          </Link>
          <button type="button" onClick={toggleSidebar} aria-label={t("sidebar.close")} className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-muted hover:bg-tint lg:hidden">
            <FiX aria-hidden="true" />
          </button>
        </div>

        <nav className="overflow-y-auto px-3 py-4" aria-label={t("sidebar.workspace")}>
          <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted">{t("sidebar.workspace")}</p>
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const { id, countKey } = item;
              const Icon = item.icon;
              const active = activeTab === id;
              const count = countKey ? counts[countKey] : undefined;
              return (
                <li key={id}>
                  <button type="button" onClick={() => select(id)} aria-current={active ? "page" : undefined} className={itemClass(active)}>
                    <span className="flex items-center gap-3">
                      <Icon className="shrink-0" aria-hidden="true" />
                      {t(`sidebar.${id}`)}
                    </span>
                    {typeof count === "number" && count > 0 && (
                      <span className={cx("rounded-full px-2 text-xs font-bold", active ? "bg-white/25 text-white" : "bg-tint text-primary-text")}>{count}</span>
                    )}
                  </button>
                </li>
              );
            })}
            <li>
              <Link to="/interview" data-testid="sidebar-interview-link" className={cx(itemClass(false), "justify-start gap-3 border border-primary-500 text-primary-text")}>
                <FiMic className="shrink-0" aria-hidden="true" />
                {t("sidebar.interview")}
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      <div className="space-y-3 border-t border-line bg-tint p-4">
        <div className="flex items-center gap-3 rounded-card border border-tint-line bg-surface p-3">
          <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
            {initialsOf(user)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-ink">{user?.name || t("header.fallbackName")}</p>
            <p className="truncate text-xs text-muted">{user?.email}</p>
            <p className="text-xs font-semibold text-primary-text">{enumLabel("userRole", user?.role || "jobseeker")}</p>
          </div>
        </div>
        <LanguageToggle size="sm" className="w-full justify-center" />
        <button
          type="button"
          onClick={onLogout}
          className="flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-pill border border-danger/40 text-sm font-semibold text-danger transition-colors hover:bg-danger/10"
        >
          <FiLogOut aria-hidden="true" />
          {t("shell.signOut")}
        </button>
      </div>
    </aside>
  );
};

export default JobSeekerSidebar;
