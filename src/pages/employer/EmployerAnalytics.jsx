import React, { useState, useEffect, useCallback, useMemo } from "react";
import { FiRefreshCw, FiAlertCircle, FiInfo } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { jobService } from "../../services/jobService";
import { applicationService } from "../../services/applicationService";
import { Button, PageHeader } from "../../components/ui";
import { extractApplications, extractTotal, serverErrorText } from "./employer-api-helpers";
import AnalyticsKpiCards from "./analytics/AnalyticsKpiCards";
import PipelineFunnelCard from "./analytics/PipelineFunnelCard";
import { JobApplicationsLeaderboard, JobTypeBreakdown } from "./analytics/JobBreakdownCards";

// Funnel stage -> API statuses counted into it. `key` maps to employer:analytics.pipeline.<key>
const FUNNEL_STAGES = [
  { key: "pending", statuses: ["pending"], color: "bg-primary-500", textColor: "text-primary-text" },
  { key: "underReview", statuses: ["under_review"], color: "bg-brand-orange", textColor: "text-warning" },
  { key: "shortlisted", statuses: ["shortlisted"], color: "bg-brand-green", textColor: "text-success" },
  { key: "interview", statuses: ["interview_scheduled", "interviewed"], color: "bg-primary-700", textColor: "text-primary-text" },
  { key: "hired", statuses: ["offered", "accepted"], color: "bg-success", textColor: "text-success" },
  { key: "rejected", statuses: ["rejected", "withdrawn"], color: "bg-line-strong", textColor: "text-muted" },
];

const EmployerAnalytics = () => {
  const { t } = useTranslation(["employer", "common"]);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [serverTotalApplications, setServerTotalApplications] = useState(null);
  const [serverTotalJobs, setServerTotalJobs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null); // { raw } | { key }

  // Load real jobs and applications
  const fetchAnalyticsData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      setError(null);
      const [jobsRes, appsRes] = await Promise.all([
        jobService.getMyJobs({ limit: 100 }),
        applicationService.getAllApplications({ limit: 100 }),
      ]);
      setJobs(jobsRes?.success && Array.isArray(jobsRes.data) ? jobsRes.data : []);
      setApplications(extractApplications(appsRes));
      // Employer-scoped database totals from pagination metadata
      setServerTotalApplications(extractTotal(appsRes));
      setServerTotalJobs(extractTotal(jobsRes));
    } catch (err) {
      console.error("Failed to load analytics data:", err);
      const raw = serverErrorText(err);
      setError(raw ? { raw } : { key: "analytics.loadFailed" });
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalyticsData(false);
  }, [fetchAnalyticsData]);

  const totalJobs = typeof serverTotalJobs === "number" ? serverTotalJobs : jobs.length;
  const totalApplications =
    typeof serverTotalApplications === "number" ? serverTotalApplications : applications.length;
  const isTruncated = totalApplications > applications.length;

  const stats = useMemo(() => {
    const countJobs = (statuses) => jobs.filter((job) => statuses.includes(job.status)).length;
    const activeJobs = countJobs(["active", "Published"]);
    return {
      totalJobs,
      activeJobs,
      draftJobs: countJobs(["Draft", "inactive"]),
      closedJobs: countJobs(["Closed"]),
      totalApplications,
      isTruncated,
      loadedApplications: applications.length,
      avgPerActiveJob: activeJobs === 0 ? 0 : (totalApplications / activeJobs).toFixed(1),
    };
  }, [jobs, applications.length, totalJobs, totalApplications, isTruncated]);

  // Pipeline breakdown based on valid backend statuses
  const funnelStages = useMemo(
    () =>
      FUNNEL_STAGES.map((stage) => ({
        ...stage,
        count: applications.filter((app) => stage.statuses.includes(app.status)).length,
      })),
    [applications]
  );

  // Real applications per job leaderboard
  const jobApplicationCounts = useMemo(() => {
    const countsMap = {};
    applications.forEach((app) => {
      const jobId = String(app.jobId || app.job?.id);
      if (jobId) countsMap[jobId] = (countsMap[jobId] || 0) + 1;
    });
    return jobs
      .map((job) => ({ ...job, applicationCount: countsMap[String(job.id)] || 0 }))
      .sort((a, b) => b.applicationCount - a.applicationCount);
  }, [jobs, applications]);

  const jobTypeDistribution = useMemo(() => {
    const types = {};
    jobs.forEach((job) => {
      const type = job.type || "Full-time";
      types[type] = (types[type] || 0) + 1;
    });
    return Object.entries(types).map(([name, count]) => ({
      name,
      count,
      percentage: totalJobs > 0 ? Math.round((count / totalJobs) * 100) : 0,
    }));
  }, [jobs, totalJobs]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("employer:analytics.title")}
        subtitle={t("employer:analytics.subtitle")}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAnalyticsData(true)}
            disabled={refreshing || loading}
            leftIcon={<FiRefreshCw className={refreshing ? "animate-spin" : ""} />}
          >
            {refreshing ? t("employer:analytics.refreshing") : t("employer:analytics.refresh")}
          </Button>
        }
      />

      <div className="flex items-start space-x-3 rounded-card border border-tint-line bg-tint p-4 text-sm text-primary-text">
        <FiInfo className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <p>
          <strong className="font-semibold">{t("employer:analytics.honestTitle")}</strong>{" "}
          {t("employer:analytics.honestText")}
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="flex flex-col justify-between gap-3 rounded-card border border-danger/30 bg-danger/10 p-4 sm:flex-row sm:items-center"
        >
          <div className="flex items-center space-x-3 text-danger">
            <FiAlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
            <p className="text-sm font-medium">{error.raw || t(`employer:${error.key}`)}</p>
          </div>
          <Button variant="danger" size="sm" onClick={() => fetchAnalyticsData(true)} className="shrink-0">
            {t("common:states.retry")}
          </Button>
        </div>
      )}

      <AnalyticsKpiCards
        loading={loading}
        stats={{ ...stats, populatedStages: funnelStages.filter((s) => s.count > 0).length }}
      />

      <PipelineFunnelCard
        stages={funnelStages}
        sampleCount={applications.length}
        totalApplications={totalApplications}
        isTruncated={isTruncated}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <JobApplicationsLeaderboard
          jobs={jobApplicationCounts}
          sampleCount={applications.length}
          isTruncated={isTruncated}
        />
        <JobTypeBreakdown distribution={jobTypeDistribution} />
      </div>
    </div>
  );
};

export default EmployerAnalytics;
