import React from "react";
import { Link } from "react-router-dom";
import { FiBriefcase, FiUsers, FiPlus, FiArrowRight } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { Button, Card, EmptyState, StatusBadge } from "../../../components/ui";

/** Right column: newest postings with real application and pending counts. */
const RecentJobsPanel = ({ jobs, loading }) => {
  const { t } = useTranslation("employer");

  return (
    <Card padding="none" className="flex flex-col lg:col-span-1">
      <div className="flex items-center justify-between border-b border-line px-6 py-4">
        <div>
          <h2 className="text-lg font-extrabold text-ink">{t("dashboard.postings.title")}</h2>
          <p className="mt-0.5 text-xs text-muted">{t("dashboard.postings.subtitle")}</p>
        </div>
        <Link
          to="/employer/jobs"
          className="inline-flex items-center space-x-1 text-xs font-bold text-primary-text hover:underline"
        >
          <span>{t("dashboard.postings.manage")}</span>
          <FiArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>

      <div className="flex flex-1 flex-col p-6">
        {loading ? (
          <div className="space-y-4" role="status" aria-label={t("dashboard.loadingList")}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse space-y-2 rounded-card border border-line p-3.5">
                <div className="h-4 w-28 rounded bg-line" />
                <div className="h-3 w-16 rounded bg-line" />
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <EmptyState
            className="flex-1 justify-center"
            icon={<FiBriefcase />}
            title={t("dashboard.postings.emptyTitle")}
            description={t("dashboard.postings.emptyText")}
            action={
              <Button as={Link} to="/employer/post-job" size="sm" leftIcon={<FiPlus />}>
                {t("dashboard.postings.postJob")}
              </Button>
            }
          />
        ) : (
          <div className="space-y-3.5">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="rounded-card border border-line bg-tint/50 p-3.5 transition-colors hover:bg-tint"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <Link
                    to={`/employer/jobs/${job.id}/applicants`}
                    className="block truncate text-sm font-semibold text-ink transition-colors hover:text-primary-text"
                  >
                    {job.title}
                  </Link>
                  <StatusBadge group="jobStatus" value={job.status || "active"} className="shrink-0" />
                </div>
                <div className="flex items-center justify-between border-t border-line pt-1 text-xs text-muted">
                  <span className="flex items-center space-x-1">
                    <FiUsers className="h-3.5 w-3.5 text-primary-text" aria-hidden="true" />
                    <span className="font-semibold text-ink">{job.applicationsCount}</span>
                    <span>{t("dashboard.postings.applications")}</span>
                  </span>
                  <span
                    className={`text-[11px] ${job.pendingCount > 0 ? "font-semibold text-warning" : "text-muted"}`}
                  >
                    {t("dashboard.postings.pending", { n: job.pendingCount })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

export default RecentJobsPanel;
