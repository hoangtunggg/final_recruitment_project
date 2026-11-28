import React from "react";
import { Link } from "react-router-dom";
import { FiBriefcase, FiUsers, FiCalendar, FiPlus, FiActivity, FiBarChart2 } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { Button, Card } from "../../../components/ui";

// `key` maps to employer:dashboard.quick.<key>.title / .text
const ACTIONS = [
  { key: "postJob", icon: FiPlus, href: "/employer/post-job" },
  { key: "manageJobs", icon: FiBriefcase, href: "/employer/jobs" },
  { key: "tracking", icon: FiUsers, href: "/employer/applicants" },
  { key: "interviews", icon: FiCalendar, href: "/employer/interviews" },
  { key: "analytics", icon: FiBarChart2, href: "/employer/analytics" },
];

/** Shortcut grid to the main employer workflows plus the workflow-demo trigger. */
const QuickActionsPanel = ({ onOpenWorkflowDemo }) => {
  const { t } = useTranslation("employer");
  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-ink">{t("dashboard.quick.title")}</h2>
          <p className="mt-0.5 text-xs text-muted">{t("dashboard.quick.subtitle")}</p>
        </div>
        <Button variant="outline" size="sm" onClick={onOpenWorkflowDemo} leftIcon={<FiActivity />}>
          {t("dashboard.quick.workflowDemo")}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {ACTIONS.map(({ key, icon, href }) => {
          const Icon = icon;
          return (
          <Link
            key={key}
            to={href}
            className="group flex flex-col justify-between rounded-card border border-line bg-tint/50 p-4 transition-colors hover:border-tint-line hover:bg-tint"
          >
            <div className="mb-2 flex items-center space-x-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-primary-600 text-white">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </div>
              <h3 className="truncate text-sm font-semibold text-ink transition-colors group-hover:text-primary-text">
                {t(`dashboard.quick.${key}.title`)}
              </h3>
            </div>
            <p className="text-xs text-muted">{t(`dashboard.quick.${key}.text`)}</p>
          </Link>
          );
        })}
      </div>
    </Card>
  );
};

export default QuickActionsPanel;
