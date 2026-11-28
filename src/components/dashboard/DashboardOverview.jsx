import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FiBookmark, FiBriefcase, FiDollarSign, FiMapPin } from "react-icons/fi";
import { Badge, Button, StatusBadge, cx } from "../ui";
import { useLocale } from "../../i18n/helpers";
import DashboardPanel, { PanelEmpty, PanelSkeleton } from "./DashboardPanel";

const rowClass = "flex flex-col justify-between gap-3 px-5 py-4 transition-colors hover:bg-tint sm:flex-row sm:items-center sm:px-6";

const ApplicationRow = ({ application, locale }) => {
  const { t } = useTranslation("candidate");
  const applied = application.applicationDate
    ? new Date(application.applicationDate).toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" })
    : t("overview.recently");
  return (
    <li className={rowClass}>
      <div className="min-w-0">
        <p className="flex flex-wrap items-baseline gap-x-2">
          <span className="truncate font-bold text-ink">{application.job?.title || t("applications.fallbackTitle")}</span>
          <span className="truncate text-sm text-muted">{application.job?.company || t("applications.fallbackCompany")}</span>
        </p>
        <p className="mt-1 text-sm text-muted">
          {application.job?.location && `${application.job.location} · `}
          {t("overview.applied", { date: applied })}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <StatusBadge group="applicationStatus" value={application.status || "pending"} />
        {application.jobId && (
          <Link to={`/jobs/${application.jobId}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text hover:underline">
            {t("overview.viewJob")}
          </Link>
        )}
      </div>
    </li>
  );
};

const RecommendedRow = ({ job, saved, onSave }) => {
  const { t } = useTranslation("candidate");
  return (
    <li className={rowClass}>
      <div className="min-w-0">
        <p className="flex flex-wrap items-baseline gap-x-2">
          <span className="truncate font-bold text-ink">{job.title}</span>
          <span className="truncate text-sm text-muted">{job.company}</span>
        </p>
        <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
          {job.location && (
            <span className="inline-flex items-center gap-1">
              <FiMapPin aria-hidden="true" /> {job.location}
            </span>
          )}
          {job.salary && (
            <span className="inline-flex items-center gap-1 font-semibold text-success">
              <FiDollarSign aria-hidden="true" /> {job.salary}
            </span>
          )}
          {job.matchedSkills?.length > 0 && <Badge tone="success" size="sm">{t("overview.skillMatch", { n: job.matchedSkills.length })}</Badge>}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onSave(job)}
          aria-pressed={saved}
          aria-label={saved ? t("recommended.unsaveAria", { title: job.title }) : t("recommended.saveAria", { title: job.title })}
          className={cx(
            "inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border transition-colors",
            saved ? "border-primary-500 bg-tint text-primary-text" : "border-line text-muted hover:border-primary-500 hover:text-primary-text"
          )}
        >
          <FiBookmark className={saved ? "fill-current" : ""} aria-hidden="true" />
        </button>
        <Button as={Link} to={`/jobs/${job.id}`} size="sm">
          {t("overview.viewJob")}
        </Button>
      </div>
    </li>
  );
};

/** Overview tab: latest applications + top recommended jobs, each with loading / empty states. */
const DashboardOverview = ({ applications, applicationsLoading, jobsLoading, recommendedJobs, hasSkills, isJobSaved, onSaveJob, onTabChange }) => {
  const { t } = useTranslation("candidate");
  const locale = useLocale();

  return (
    <div id="dashboard-panel-overview" role="tabpanel" aria-label={t("tabs.overview")} className="space-y-6">
      <DashboardPanel
        title={t("overview.recentTitle")}
        subtitle={t("overview.recentSubtitle")}
        actionLabel={t("overview.viewAll", { n: applications.length })}
        onAction={() => onTabChange("applications")}
      >
        {applicationsLoading ? (
          <PanelSkeleton />
        ) : applications.length > 0 ? (
          <ul className="divide-y divide-line">
            {applications.slice(0, 3).map((application) => (
              <ApplicationRow key={application.id || application._id} application={application} locale={locale} />
            ))}
          </ul>
        ) : (
          <PanelEmpty
            icon={<FiBriefcase />}
            title={t("overview.noApplications")}
            description={t("overview.noApplicationsHint")}
            action={<Button size="sm" onClick={() => onTabChange("recommended")}>{t("common.exploreRecommended")}</Button>}
          />
        )}
      </DashboardPanel>

      <DashboardPanel
        title={t("overview.recommendedTitle")}
        subtitle={hasSkills ? t("overview.recommendedBySkills") : t("overview.recommendedLatest")}
        actionLabel={t("overview.viewAll", { n: recommendedJobs.length })}
        onAction={() => onTabChange("recommended")}
      >
        {jobsLoading ? (
          <PanelSkeleton />
        ) : recommendedJobs.length > 0 ? (
          <ul className="divide-y divide-line">
            {recommendedJobs.slice(0, 3).map((job) => (
              <RecommendedRow key={job.id} job={job} saved={isJobSaved(job.id)} onSave={onSaveJob} />
            ))}
          </ul>
        ) : (
          <PanelEmpty icon={<FiBriefcase />} title={t("overview.noJobs")} description={t("overview.noJobsHint")} />
        )}
      </DashboardPanel>
    </div>
  );
};

export default DashboardOverview;
