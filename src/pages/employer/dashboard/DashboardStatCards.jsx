import React from "react";
import { FiBriefcase, FiUsers, FiCalendar, FiClock } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { Card } from "../../../components/ui";
import StatCard from "../../../components/employer/EmployerStatCard";

/** The four headline metrics (jobs, applicants, pending reviews, interviews). */
const DashboardStatCards = ({ metrics, loading }) => {
  const { t } = useTranslation("employer");

  if (loading) {
    return (
      <div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4"
        role="status"
        aria-label={t("dashboard.loadingStats")}
      >
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse space-y-3 p-6">
            <div className="h-10 w-10 rounded-card bg-line" />
            <div className="h-4 w-24 rounded bg-line" />
            <div className="h-8 w-16 rounded bg-line" />
            <div className="h-3 w-32 rounded bg-line" />
          </Card>
        ))}
      </div>
    );
  }

  const applicantsFootnote = metrics.isApplicationsTruncated
    ? t("dashboard.stats.applicantsTruncated", {
        shortlisted: metrics.shortlisted,
        hired: metrics.offersOrHired,
        loaded: metrics.loadedApplicationsCount,
      })
    : t("dashboard.stats.applicantsFootnote", {
        shortlisted: metrics.shortlisted,
        hired: metrics.offersOrHired,
      });

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
      <StatCard
        to="/employer/jobs"
        icon={FiBriefcase}
        tone="primary"
        chip={{ text: t("dashboard.stats.jobsTotal", { total: metrics.totalJobs }) }}
        label={t("dashboard.stats.activeJobs")}
        value={metrics.activeJobs}
        footnote={t("dashboard.stats.jobsFootnote", { draft: metrics.draftJobs, closed: metrics.closedJobs })}
      />
      <StatCard
        to="/employer/applicants"
        icon={FiUsers}
        tone="success"
        chip={{ text: t("dashboard.stats.allTime") }}
        label={t("dashboard.stats.totalApplicants")}
        value={metrics.totalApplications}
        footnote={applicantsFootnote}
      />
      <StatCard
        to="/employer/applicants"
        icon={FiClock}
        tone="warning"
        chip={
          metrics.pendingReviews > 0
            ? { text: t("dashboard.stats.actionNeeded") }
            : { text: t("dashboard.stats.caughtUp"), tone: "neutral" }
        }
        chipPulse={metrics.pendingReviews > 0}
        label={t("dashboard.stats.pendingReviews")}
        value={metrics.pendingReviews}
        footnote={t("dashboard.stats.pendingFootnote")}
      />
      <StatCard
        to="/employer/interviews"
        icon={FiCalendar}
        tone="primary"
        chip={{ text: t("dashboard.stats.pipeline") }}
        label={t("dashboard.stats.interviewsActive")}
        value={metrics.interviews}
        footnote={t("dashboard.stats.interviewsFootnote")}
      />
    </div>
  );
};

export default DashboardStatCards;
