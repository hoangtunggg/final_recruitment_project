import React from "react";
import { FiBriefcase, FiUsers, FiTrendingUp, FiLayers } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { Card } from "../../../components/ui";
import StatCard from "../../../components/employer/EmployerStatCard";

/** Four KPI cards: postings, submissions, average per active job and populated funnel stages. */
const AnalyticsKpiCards = ({ stats, loading }) => {
  const { t } = useTranslation("employer");

  if (loading) {
    return (
      <div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        role="status"
        aria-label={t("analytics.loadingStats")}
      >
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse space-y-3 p-6">
            <div className="h-10 w-10 rounded-card bg-line" />
            <div className="h-4 w-28 rounded bg-line" />
            <div className="h-7 w-16 rounded bg-line" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={FiBriefcase}
        tone="primary"
        chip={{ text: t("analytics.kpi.activeChip", { n: stats.activeJobs }) }}
        label={t("analytics.kpi.totalJobs")}
        value={stats.totalJobs}
        footnote={t("analytics.kpi.jobsFootnote", { draft: stats.draftJobs, closed: stats.closedJobs })}
      />
      <StatCard
        icon={FiUsers}
        tone="success"
        chip={{ text: t("analytics.kpi.applicationsChip") }}
        label={t("analytics.kpi.totalSubmissions")}
        value={stats.totalApplications}
        footnote={
          stats.isTruncated
            ? t("analytics.kpi.submissionsTruncated", { loaded: stats.loadedApplications })
            : t("analytics.kpi.submissionsFootnote")
        }
      />
      <StatCard
        icon={FiTrendingUp}
        tone="warning"
        chip={{ text: t("analytics.kpi.ratioChip") }}
        label={t("analytics.kpi.avgPerJob")}
        value={stats.avgPerActiveJob}
        footnote={t("analytics.kpi.avgFootnote")}
      />
      <StatCard
        icon={FiLayers}
        tone="primary"
        chip={{ text: t("analytics.kpi.stagesChip") }}
        label={t("analytics.kpi.funnelStages")}
        value={stats.populatedStages}
        footnote={t("analytics.kpi.stagesFootnote")}
      />
    </div>
  );
};

export default AnalyticsKpiCards;
