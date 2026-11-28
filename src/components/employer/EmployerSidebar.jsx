import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FiBriefcase,
  FiUsers,
  FiBarChart2,
  FiSettings,
  FiX,
  FiHome,
  FiPlus,
  FiCalendar,
  FiLogOut,
} from "react-icons/fi";
import { useTranslation } from "react-i18next";

// `key` maps to employer:layout.nav.<key>; hrefs stay unchanged.
const NAVIGATION = [
  { key: "overview", href: "/employer", icon: FiHome, exact: true },
  { key: "postJob", href: "/employer/post-job", icon: FiPlus, exact: true },
  { key: "myJobs", href: "/employer/jobs", icon: FiBriefcase, exact: false },
  { key: "applicants", href: "/employer/applicants", icon: FiUsers, exact: false },
  { key: "interviews", href: "/employer/interviews", icon: FiCalendar, exact: false },
  { key: "analytics", href: "/employer/analytics", icon: FiBarChart2, exact: false },
  { key: "settings", href: "/employer/settings", icon: FiSettings, exact: false },
];

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500";

/**
 * Fixed left sidebar (off-canvas below lg). Brand, nav links, profile card and sign-out.
 * `collapsed` = icon-only rail (desktop only; EmployerLayout passes false on mobile).
 */
const EmployerSidebar = ({
  open,
  onClose,
  onLogout,
  displayName,
  displayCompany,
  initials,
  collapsed = false,
}) => {
  const { t } = useTranslation(["employer", "common"]);
  const location = useLocation();
  // Rail rows show no text, so the label becomes the accessible name and the tooltip.
  const railLabelProps = (label) => (collapsed ? { "aria-label": label, title: label } : {});

  const isActive = (item) => {
    // Exact items (overview, post job) match only their own path; the rest match any sub-route.
    if (item.exact) {
      return location.pathname === item.href || location.pathname === `${item.href}/`;
    }
    return location.pathname.startsWith(item.href);
  };

  return (
    <aside
      id="employer-navigation"
      aria-label={t("employer:layout.sidebarLabel")}
      className={`fixed bottom-0 left-0 top-2.5 z-50 flex ${
        collapsed ? "w-20" : "w-64"
      } transform flex-col justify-between overflow-x-hidden border-r border-line bg-surface transition-[transform,width] duration-300 ease-in-out motion-reduce:transition-none lg:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div>
        <div
          className={`flex h-16 shrink-0 items-center border-b border-line ${
            collapsed ? "justify-center px-0" : "justify-between px-6"
          }`}
        >
          <Link
            to="/employer"
            onClick={onClose}
            className={`group flex items-center rounded-control ${
              collapsed ? "" : "space-x-3"
            } ${focusRing}`}
            {...railLabelProps(t("employer:layout.brand"))}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-primary-600 text-white">
              <FiBriefcase className="h-5 w-5" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <span className="block truncate text-base font-extrabold tracking-tight text-ink">
                  {t("employer:layout.brand")}
                </span>
                <span className="block truncate text-[11px] font-semibold text-primary-text">
                  {t("employer:layout.tagline")}
                </span>
              </div>
            )}
          </Link>
          <button
            type="button"
            onClick={onClose}
            className={`inline-flex h-11 w-11 items-center justify-center rounded-control text-muted hover:bg-tint hover:text-ink lg:hidden ${focusRing}`}
            aria-label={t("employer:layout.closeSidebar")}
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <nav className="overflow-y-auto px-3 py-4" aria-label={t("employer:layout.sidebarLabel")}>
          {!collapsed && (
            <p className="mb-2 truncate px-3 text-xs font-bold uppercase tracking-wider text-muted">
              {t("employer:layout.workspace")}
            </p>
          )}
          <ul className="space-y-1">
            {NAVIGATION.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);
              return (
                <li key={item.key}>
                  <Link
                    to={item.href}
                    onClick={onClose}
                    data-testid={`employer-nav-${item.key}`}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-11 w-full items-center rounded-control text-sm font-semibold transition-colors ${
                      collapsed ? "justify-center px-0" : "px-3.5"
                    } ${focusRing} ${
                      active
                        ? "border-l-4 border-primary-500 bg-tint text-primary-text"
                        : "text-ink hover:bg-tint"
                    }`}
                    {...railLabelProps(t(`employer:layout.nav.${item.key}`))}
                  >
                    <Icon
                      className={`h-4 w-4 shrink-0 ${collapsed ? "" : "mr-3"} ${
                        active ? "text-primary-text" : "text-muted"
                      }`}
                    />
                    {!collapsed && (
                      <span className="truncate">{t(`employer:layout.nav.${item.key}`)}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <div className={`shrink-0 border-t border-line bg-tint/60 ${collapsed ? "p-3" : "p-4"}`}>
        <div
          className={
            collapsed
              ? "mb-3 flex justify-center"
              : "mb-3 flex items-center space-x-3 rounded-card border border-line bg-surface p-2.5"
          }
        >
          <div
            title={collapsed ? displayName : undefined}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-primary-600 text-xs font-bold tracking-wider text-white"
          >
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-ink">{displayName}</p>
              <p className="truncate text-sm text-muted">{displayCompany}</p>
              <span className="mt-0.5 inline-block rounded-pill bg-tint px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-text">
                {t("employer:layout.roleBadge")}
              </span>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onLogout}
          className={`flex min-h-11 w-full items-center justify-center rounded-pill border border-danger/30 text-sm font-semibold text-danger transition-colors hover:bg-danger/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-danger ${
            collapsed ? "px-0" : "space-x-2 px-3"
          }`}
          {...railLabelProps(t("common:nav.signOut"))}
        >
          <FiLogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>{t("common:nav.signOut")}</span>}
        </button>
      </div>
    </aside>
  );
};

export default EmployerSidebar;
