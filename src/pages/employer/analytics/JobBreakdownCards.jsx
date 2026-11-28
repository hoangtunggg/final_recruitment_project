import React from "react";
import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { Card, StatusBadge } from "../../../components/ui";
import { useEnumLabel } from "../../../i18n/helpers";

/** Left card: postings ordered by number of applications received. */
export const JobApplicationsLeaderboard = ({ jobs, sampleCount, isTruncated }) => {
  const { t } = useTranslation("employer");
  const label = useEnumLabel();

  return (
    <Card className="space-y-4 lg:col-span-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-ink">{t("analytics.leaderboard.title")}</h2>
          <p className="mt-0.5 text-xs text-muted">
            {isTruncated
              ? t("analytics.leaderboard.subtitleTruncated", { loaded: sampleCount })
              : t("analytics.leaderboard.subtitle")}
          </p>
        </div>
        <Link to="/employer/jobs" className="shrink-0 text-xs font-bold text-primary-text hover:underline">
          {t("analytics.leaderboard.manage")}
        </Link>
      </div>

      {jobs.length === 0 ? (
        <p className="py-6 text-center text-xs text-muted">{t("analytics.leaderboard.empty")}</p>
      ) : (
        <div className="divide-y divide-line">
          {jobs.map((job) => (
            <div key={job.id} className="flex items-center justify-between gap-4 py-3.5">
              <div className="min-w-0 space-y-0.5">
                <Link
                  to={`/employer/jobs/${job.id}/applicants`}
                  className="block truncate text-sm font-semibold text-ink transition-colors hover:text-primary-text"
                >
                  {job.title}
                </Link>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                  <span>{job.location || t("analytics.leaderboard.remote")}</span>
                  <span aria-hidden="true">•</span>
                  <span>{label("jobType", job.type || "Full-time")}</span>
                  <StatusBadge group="jobStatus" value={job.status || "active"} />
                </div>
              </div>
              <div className="flex shrink-0 items-center space-x-2">
                <span className="rounded-pill bg-tint px-3 py-1 text-xs font-bold text-ink">
                  {t("analytics.leaderboard.applicants", { count: job.applicationCount })}
                </span>
                <Link
                  to={`/employer/jobs/${job.id}/applicants`}
                  className="rounded-control p-1.5 text-muted transition-colors hover:bg-tint hover:text-primary-text"
                  title={t("analytics.leaderboard.viewApplicants")}
                  aria-label={t("analytics.leaderboard.viewApplicants")}
                >
                  <FiArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

/** Right card: share of postings per employment type. */
export const JobTypeBreakdown = ({ distribution }) => {
  const { t } = useTranslation("employer");
  const label = useEnumLabel();

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="text-lg font-extrabold text-ink">{t("analytics.types.title")}</h2>
        <p className="mt-0.5 text-xs text-muted">{t("analytics.types.subtitle")}</p>
      </div>
      {distribution.length === 0 ? (
        <p className="py-6 text-center text-xs text-muted">{t("analytics.types.empty")}</p>
      ) : (
        <ul className="space-y-4 pt-2">
          {distribution.map((item) => (
            <li key={item.name} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-ink">{label("jobType", item.name)}</span>
                <span className="text-muted">
                  {item.count} ({item.percentage}%)
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-tint">
                <div
                  className="h-full rounded-full bg-primary-500 transition-all duration-500"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};
