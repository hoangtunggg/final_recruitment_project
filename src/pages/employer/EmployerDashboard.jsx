import React, { useState, useEffect, useCallback, useMemo } from "react";
import { FiRefreshCw, FiXCircle, FiAlertCircle } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { jobService } from "../../services/jobService";
import { applicationService } from "../../services/applicationService";
import EmployerNotifications from "../../components/employer/EmployerNotifications";
import EmployerWorkflowDemo from "../../components/employer/EmployerWorkflowDemo";
import { Button, Card, PageHeader } from "../../components/ui";
import { extractApplications, extractTotal, serverErrorText } from "./employer-api-helpers";
import DashboardStatCards from "./dashboard/DashboardStatCards";
import RecentApplicantsPanel from "./dashboard/RecentApplicantsPanel";
import RecentJobsPanel from "./dashboard/RecentJobsPanel";
import QuickActionsPanel from "./dashboard/QuickActionsPanel";

const isPending = (app) => app.status === "pending" || app.status === "under_review";

const EmployerDashboard = () => {
  const { t } = useTranslation(["employer", "common"]);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [serverTotalApplications, setServerTotalApplications] = useState(null);
  const [serverTotalJobs, setServerTotalJobs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null); // { raw } from the server or { key }
  const [showWorkflowDemo, setShowWorkflowDemo] = useState(false);

  // Fetch real data from backend
  const loadDashboardData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);

    try {
      // Both endpoints return { success: true, data: [...], pagination: { total: number } }
      const [jobsResponse, applicationsResponse] = await Promise.all([
        jobService.getMyJobs({ limit: 100 }),
        applicationService.getAllApplications({ limit: 100 }),
      ]);

      setJobs(jobsResponse?.success && Array.isArray(jobsResponse.data) ? jobsResponse.data : []);
      setApplications(extractApplications(applicationsResponse));

      // Employer-scoped database totals from pagination metadata
      setServerTotalApplications(extractTotal(applicationsResponse));
      setServerTotalJobs(extractTotal(jobsResponse));
      setError(null);
    } catch (err) {
      console.error("Error fetching employer dashboard data:", err);
      const raw = serverErrorText(err);
      setError(raw ? { raw } : { key: "dashboard.loadFailed" });
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const reload = () => {
      if (isMounted) loadDashboardData(false);
    };

    reload(); // initial fetch
    const interval = setInterval(reload, 30000); // periodic refresh

    const handleStorageChange = (event) => {
      if (event.key === "applicationSubmitted" || event.key === "applicationSubmittedTimestamp") {
        reload();
      }
    };

    window.addEventListener("applicationSubmitted", reload);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener("applicationSubmitted", reload);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [loadDashboardData]);

  // ESC key listener to dismiss demo modal
  useEffect(() => {
    if (!showWorkflowDemo) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setShowWorkflowDemo(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showWorkflowDemo]);

  // Derive genuine metrics from real data
  const metrics = useMemo(() => {
    const totalApplications =
      typeof serverTotalApplications === "number" ? serverTotalApplications : applications.length;
    const count = (predicate) => applications.filter(predicate).length;
    return {
      totalJobs: typeof serverTotalJobs === "number" ? serverTotalJobs : jobs.length,
      activeJobs: jobs.filter((j) => j.status === "active" || j.status === "Published").length,
      draftJobs: jobs.filter((j) => j.status === "Draft" || j.status === "inactive").length,
      closedJobs: jobs.filter((j) => j.status === "Closed" || j.status === "filled").length,
      totalApplications,
      isApplicationsTruncated: totalApplications > applications.length,
      loadedApplicationsCount: applications.length,
      pendingReviews: count(isPending),
      interviews: count((a) => a.status === "interview_scheduled" || a.status === "interviewed"),
      shortlisted: count((a) => a.status === "shortlisted"),
      offersOrHired: count((a) => a.status === "offered" || a.status === "accepted"),
    };
  }, [jobs, applications, serverTotalJobs, serverTotalApplications]);

  const recentApplicants = useMemo(
    () =>
      [...applications]
        .sort(
          (a, b) =>
            new Date(b.applicationDate || b.createdAt || 0) -
            new Date(a.applicationDate || a.createdAt || 0)
        )
        .slice(0, 5),
    [applications]
  );

  const recentJobsWithCounts = useMemo(
    () =>
      [...jobs]
        .sort(
          (a, b) =>
            new Date(b.createdAt || b.postedDate || 0) - new Date(a.createdAt || a.postedDate || 0)
        )
        .slice(0, 5)
        .map((job) => {
          const jobApps = applications.filter((app) => app.jobId === job.id);
          return {
            ...job,
            applicationsCount: jobApps.length,
            pendingCount: jobApps.filter(isPending).length,
          };
        }),
    [jobs, applications]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("employer:dashboard.title")}
        subtitle={t("employer:dashboard.subtitle")}
        actions={
          <>
            <EmployerNotifications />
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadDashboardData(true)}
              disabled={refreshing || loading}
              leftIcon={<FiRefreshCw className={refreshing ? "animate-spin" : ""} />}
            >
              {refreshing ? t("employer:dashboard.refreshing") : t("common:actions.refresh")}
            </Button>
          </>
        }
      />

      {error && (
        <div
          role="alert"
          className="flex flex-col justify-between gap-3 rounded-card border border-danger/30 bg-danger/10 p-4 sm:flex-row sm:items-center"
        >
          <div className="flex items-center space-x-3 text-danger">
            <FiAlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
            <p className="text-sm font-medium">{error.raw || t(`employer:${error.key}`)}</p>
          </div>
          <Button variant="danger" size="sm" onClick={() => loadDashboardData(true)} className="shrink-0">
            {t("common:states.retry")}
          </Button>
        </div>
      )}

      <DashboardStatCards metrics={metrics} loading={loading} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <RecentApplicantsPanel
          applicants={recentApplicants}
          metrics={metrics}
          jobsCount={jobs.length}
          loading={loading}
        />
        <RecentJobsPanel jobs={recentJobsWithCounts} loading={loading} />
      </div>

      <QuickActionsPanel onOpenWorkflowDemo={() => setShowWorkflowDemo(true)} />

      {showWorkflowDemo && (
        <div
          className="!mt-0 fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={t("employer:dashboard.workflowAria")}
        >
          <Card className="max-h-[90vh] w-full max-w-5xl overflow-y-auto">
            <div className="mb-6 flex items-center justify-between border-b border-line pb-4">
              <div>
                <h2 className="text-xl font-extrabold text-ink">{t("employer:dashboard.workflowTitle")}</h2>
                <p className="mt-0.5 text-xs text-muted">{t("employer:dashboard.workflowSubtitle")}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowWorkflowDemo(false)}
                className="rounded-control p-1 text-muted transition-colors hover:bg-tint hover:text-ink"
                aria-label={t("employer:dashboard.closeModal")}
              >
                <FiXCircle className="h-6 w-6" />
              </button>
            </div>
            <EmployerWorkflowDemo />
          </Card>
        </div>
      )}
    </div>
  );
};

export default EmployerDashboard;
