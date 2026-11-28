import React from "react";
import { Link } from "react-router-dom";
import { FiUsers, FiPlus, FiArrowRight, FiMail } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { Button, Card, EmptyState, StatusBadge } from "../../../components/ui";
import { useLocale } from "../../../i18n/helpers";

const getInitials = (name) => {
  if (!name || typeof name !== "string") return "CA";
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
};

/** Left column: the five most recent applications with status and a review link. */
const RecentApplicantsPanel = ({ applicants, metrics, jobsCount, loading }) => {
  const { t } = useTranslation("employer");
  const locale = useLocale();

  return (
    <Card padding="none" className="flex flex-col lg:col-span-2">
      <div className="flex items-center justify-between border-b border-line px-6 py-4">
        <div>
          <h2 className="text-lg font-extrabold text-ink">{t("dashboard.recent.title")}</h2>
          <p className="mt-0.5 text-xs text-muted">
            {metrics.isApplicationsTruncated
              ? t("dashboard.recent.subtitleTruncated", {
                  loaded: metrics.loadedApplicationsCount,
                  total: metrics.totalApplications,
                })
              : t("dashboard.recent.subtitle")}
          </p>
        </div>
        <Link
          to="/employer/applicants"
          className="inline-flex items-center space-x-1 text-xs font-bold text-primary-text hover:underline"
        >
          <span>{t("dashboard.recent.viewAll")}</span>
          <FiArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>

      <div className="flex flex-1 flex-col p-6">
        {loading ? (
          <div className="space-y-4" role="status" aria-label={t("dashboard.loadingList")}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex animate-pulse items-center justify-between rounded-card border border-line p-4"
              >
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-line" />
                  <div className="space-y-2">
                    <div className="h-4 w-32 rounded bg-line" />
                    <div className="h-3 w-24 rounded bg-line" />
                  </div>
                </div>
                <div className="h-6 w-20 rounded-pill bg-line" />
              </div>
            ))}
          </div>
        ) : applicants.length === 0 ? (
          <EmptyState
            className="flex-1 justify-center"
            icon={<FiUsers />}
            title={t("dashboard.recent.emptyTitle")}
            description={jobsCount === 0 ? t("dashboard.recent.emptyNoJobs") : t("dashboard.recent.emptyWithJobs")}
            action={
              jobsCount === 0 ? (
                <Button as={Link} to="/employer/post-job" size="sm" leftIcon={<FiPlus />}>
                  {t("dashboard.recent.createFirstJob")}
                </Button>
              ) : null
            }
          />
        ) : (
          <div className="space-y-3">
            {applicants.map((application) => {
              const appliedDate = application.applicationDate || application.createdAt;
              const formattedDate = appliedDate
                ? new Date(appliedDate).toLocaleDateString(locale, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : t("dashboard.recent.recently");
              return (
                <div
                  key={application.id}
                  className="flex flex-col justify-between gap-3 rounded-card border border-line bg-tint/50 p-4 transition-colors hover:bg-tint sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 items-center space-x-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-600 text-xs font-semibold text-white">
                      {getInitials(application.applicantName)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">
                        {application.applicantName || t("dashboard.recent.anonymous")}
                      </p>
                      <p className="truncate text-xs font-medium text-muted">
                        {application.job?.title || t("dashboard.recent.roleFallback", { id: application.jobId })}
                      </p>
                      <div className="mt-0.5 flex items-center space-x-2 text-[11px] text-muted">
                        <span className="flex max-w-[150px] items-center space-x-1 truncate">
                          <FiMail className="h-3 w-3 shrink-0" aria-hidden="true" />
                          <span className="truncate">{application.applicantEmail}</span>
                        </span>
                        <span aria-hidden="true">•</span>
                        <span>{t("dashboard.recent.applied", { date: formattedDate })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center justify-between space-x-3 sm:justify-end">
                    <StatusBadge group="applicationStatus" value={application.status || "pending"} />
                    <Link
                      to={`/employer/jobs/${application.jobId}/applicants`}
                      className="rounded-pill bg-tint px-3 py-1 text-xs font-bold text-primary-text transition-colors hover:bg-tint-line/40"
                    >
                      {t("dashboard.recent.review")}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
};

export default RecentApplicantsPanel;
