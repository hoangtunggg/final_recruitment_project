import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FiBriefcase, FiBookmark, FiFileText, FiGrid, FiMic, FiStar } from "react-icons/fi";
import { cx } from "../ui";

const TABS = [
  { id: "overview", icon: FiGrid },
  { id: "applications", icon: FiBriefcase, countKey: "applications" },
  { id: "saved", icon: FiBookmark, countKey: "saved" },
  { id: "recommended", icon: FiStar, countKey: "recommended" },
  { id: "resumes", icon: FiFileText, countKey: "resumes" },
];

const pillClass = (active) =>
  cx(
    "inline-flex min-h-11 select-none items-center gap-2 whitespace-nowrap rounded-pill px-4 text-sm font-semibold transition-colors",
    active ? "bg-primary-600 text-white" : "text-ink hover:bg-tint hover:text-primary-text"
  );

/**
 * Candidate dashboard navigation: the five in-page tabs (role="tab") plus a link to the AI
 * interview (/interview), which is a separate page and therefore not part of the tablist.
 * `instanceId` prefixes the element ids (kept so a layout can render the bar more than once).
 */
const DashboardTabs = ({ activeTab, onTabChange, counts = {}, instanceId = "dashboard" }) => {
  const { t } = useTranslation("candidate");

  return (
    <div className="min-w-0 overflow-x-auto scrollbar-none">
      <div className="flex min-w-max items-center gap-1.5 py-2">
        <nav className="flex gap-1.5" role="tablist" aria-label={t("tabs.aria")}>
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const count = tab.countKey ? counts[tab.countKey] : undefined;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                id={`${instanceId}-dashboard-tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls={`dashboard-panel-${tab.id}`}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={cx(pillClass(isActive), "cursor-pointer")}
              >
                <Icon className="shrink-0 text-base" aria-hidden="true" />
                <span>{t(`tabs.${tab.id}`)}</span>
                {typeof count === "number" && count > 0 && (
                  <span
                    className={cx(
                      "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold",
                      isActive ? "bg-white/25 text-white" : "bg-tint text-primary-text"
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
        <Link
          to="/interview"
          id={`${instanceId}-dashboard-interview-link`}
          data-testid={`${instanceId}-dashboard-interview-link`}
          className={cx(pillClass(false), "border border-primary-500 text-primary-text")}
        >
          <FiMic className="shrink-0 text-base" aria-hidden="true" />
          {t("tabs.interview")}
        </Link>
      </div>
    </div>
  );
};

export default DashboardTabs;
