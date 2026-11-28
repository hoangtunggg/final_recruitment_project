import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  FiBriefcase,
  FiFilter,
  FiSearch,
  FiPlus,
  FiRefreshCw,
  FiAlertCircle,
  FiCheckCircle,
} from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { jobService } from "../../services/jobService";
import { applicationService } from "../../services/applicationService";
import { Button, Card, EmptyState, Input, PageHeader, Select } from "../../components/ui";
import { useEnumLabel } from "../../i18n/helpers";
import ManageJobsTable from "./manage-jobs/ManageJobsTable";
import { extractApplications, serverErrorText } from "./employer-api-helpers";
import DeleteJobDialog from "./manage-jobs/DeleteJobDialog";

// Filter option values (sent nowhere; labels come from common:enums)
const STATUS_FILTERS = ["active", "Published", "Draft", "Closed"];
const TYPE_FILTERS = ["Full-time", "Part-time", "Contract", "Internship", "Temporary"];

const ManageJobs = () => {
  const { t } = useTranslation(["employer", "common"]);
  const label = useEnumLabel();
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null); // { raw } | { key }
  const [notification, setNotification] = useState(null); // { type, raw?, key?, params? }

  // Filters & search
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Interactive controls
  const [actionMenuJobId, setActionMenuJobId] = useState(null);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  // Close dropdown menu on outside click and handle Escape key
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest(".action-menu-container")) setActionMenuJobId(null);
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setActionMenuJobId(null);
        if (!isDeleting) setJobToDelete(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDeleting]);

  // Fetch real jobs and applications from backend
  const fetchEmployerData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [jobsResponse, appsResponse] = await Promise.all([
        jobService.getMyJobs({ limit: 100 }),
        applicationService.getAllApplications({ limit: 100 }),
      ]);
      setJobs(jobsResponse?.success && Array.isArray(jobsResponse.data) ? jobsResponse.data : []);
      setApplications(extractApplications(appsResponse));
      setError(null);
    } catch (err) {
      console.error("Error loading employer jobs:", err);
      const raw = serverErrorText(err);
      setError(raw ? { raw } : { key: "manageJobs.loadFailed" });
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployerData(false);
  }, [fetchEmployerData]);

  // Temporary flash notification
  const showToast = (message, type = "success") => {
    setNotification({ ...message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Map application counts to jobs
  const jobsWithMetrics = useMemo(
    () =>
      jobs.map((job) => {
        const jobApps = applications.filter((app) => app.jobId === job.id);
        const pendingCount = jobApps.filter(
          (app) => app.status === "pending" || app.status === "under_review"
        ).length;
        return { ...job, applicationsCount: jobApps.length, pendingCount };
      }),
    [jobs, applications]
  );

  const filteredJobs = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return jobsWithMetrics.filter((job) => {
      const matchesSearch =
        !term ||
        job.title?.toLowerCase().includes(term) ||
        job.company?.toLowerCase().includes(term) ||
        job.location?.toLowerCase().includes(term) ||
        (job.skills && job.skills.toLowerCase().includes(term));
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active"
          ? job.status === "active" || job.status === "Published"
          : job.status === statusFilter);
      const matchesType = typeFilter === "all" || job.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [jobsWithMetrics, searchTerm, statusFilter, typeFilter]);

  const handleStatusChange = async (jobId, newStatus) => {
    setActionMenuJobId(null);
    setStatusUpdatingId(jobId);
    try {
      const response = await jobService.updateJobStatus(jobId, newStatus);
      if (response && response.success) {
        setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j)));
        showToast({ key: "manageJobs.toast.statusUpdated", params: { status: label("jobStatus", newStatus) } });
      } else {
        throw new Error(response?.error || "");
      }
    } catch (err) {
      console.error("Status update error:", err);
      const raw = serverErrorText(err);
      showToast(raw ? { raw } : { key: "manageJobs.toast.statusFailed" }, "error");
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const confirmDeleteJob = async () => {
    if (!jobToDelete) return;
    setIsDeleting(true);
    try {
      const response = await jobService.deleteJob(jobToDelete.id);
      if (response && response.success) {
        setJobs((prev) => prev.filter((j) => j.id !== jobToDelete.id));
        showToast({ key: "manageJobs.toast.deleted", params: { title: jobToDelete.title } });
        setJobToDelete(null);
      } else {
        throw new Error(response?.error || "");
      }
    } catch (err) {
      console.error("Delete job error:", err);
      const raw = serverErrorText(err);
      showToast(raw ? { raw } : { key: "manageJobs.toast.deleteFailed" }, "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setTypeFilter("all");
  };

  const message = (m) => m.raw || t(`employer:${m.key}`, m.params);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t("employer:manageJobs.eyebrow")}
        title={t("employer:manageJobs.title")}
        subtitle={t("employer:manageJobs.subtitle")}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchEmployerData(true)}
              disabled={refreshing || loading}
              leftIcon={<FiRefreshCw className={refreshing ? "animate-spin" : ""} />}
            >
              {refreshing ? t("employer:manageJobs.refreshing") : t("common:actions.refresh")}
            </Button>
            <Button as={Link} to="/employer/post-job" size="sm" leftIcon={<FiPlus />}>
              {t("employer:manageJobs.postNew")}
            </Button>
          </>
        }
      />

      {notification && (
        <div
          role="status"
          className={`flex items-center space-x-3 rounded-card border p-4 ${
            notification.type === "success"
              ? "border-success/30 bg-success/10 text-success"
              : "border-danger/30 bg-danger/10 text-danger"
          }`}
        >
          {notification.type === "success" ? (
            <FiCheckCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
          ) : (
            <FiAlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
          )}
          <p className="text-sm font-semibold">{message(notification)}</p>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex flex-col justify-between gap-3 rounded-card border border-danger/30 bg-danger/10 p-4 text-danger sm:flex-row sm:items-center"
        >
          <div className="flex items-center space-x-3">
            <FiAlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
            <p className="text-sm font-medium">{message(error)}</p>
          </div>
          <Button variant="danger" size="sm" onClick={() => fetchEmployerData(true)} className="shrink-0">
            {t("employer:manageJobs.retryLoading")}
          </Button>
        </div>
      )}

      <Card padding="sm">
        <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          <Input
            type="search"
            leftIcon={<FiSearch />}
            aria-label={t("employer:manageJobs.searchLabel")}
            placeholder={t("employer:manageJobs.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label={t("employer:manageJobs.filterStatus")}
          >
            <option value="all">{t("employer:manageJobs.allStatuses")}</option>
            {STATUS_FILTERS.map((value) => (
              <option key={value} value={value}>
                {label("jobStatus", value)}
              </option>
            ))}
          </Select>
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            aria-label={t("employer:manageJobs.filterType")}
          >
            <option value="all">{t("employer:manageJobs.allTypes")}</option>
            {TYPE_FILTERS.map((value) => (
              <option key={value} value={value}>
                {label("jobType", value)}
              </option>
            ))}
          </Select>
          <p className="flex items-center space-x-1.5 px-1 text-xs font-semibold text-muted sm:justify-end">
            <FiFilter className="h-3.5 w-3.5 text-primary-text" aria-hidden="true" />
            <span>
              {t("employer:manageJobs.showing", { shown: filteredJobs.length, total: jobs.length })}
            </span>
          </p>
        </div>
      </Card>

      <Card padding="none" className="overflow-hidden">
        {loading ? (
          <div className="space-y-4 p-8" role="status" aria-label={t("common:states.loading")}>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex animate-pulse items-center justify-between rounded-card border border-line p-4"
              >
                <div className="space-y-2">
                  <div className="h-5 w-48 rounded bg-line" />
                  <div className="h-3 w-32 rounded bg-line" />
                </div>
                <div className="h-8 w-24 rounded-pill bg-line" />
              </div>
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <EmptyState
            icon={<FiBriefcase />}
            title={jobs.length === 0 ? t("employer:manageJobs.empty.noneTitle") : t("employer:manageJobs.empty.noMatchTitle")}
            description={jobs.length === 0 ? t("employer:manageJobs.empty.noneText") : t("employer:manageJobs.empty.noMatchText")}
            action={
              jobs.length === 0 ? (
                <Button as={Link} to="/employer/post-job" size="sm" leftIcon={<FiPlus />}>
                  {t("employer:manageJobs.empty.postFirst")}
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={resetFilters}>
                  {t("employer:manageJobs.empty.resetFilters")}
                </Button>
              )
            }
          />
        ) : (
          <ManageJobsTable
            jobs={filteredJobs}
            statusUpdatingId={statusUpdatingId}
            actionMenuJobId={actionMenuJobId}
            onToggleMenu={setActionMenuJobId}
            onStatusChange={handleStatusChange}
            onDelete={(job) => {
              setActionMenuJobId(null);
              setJobToDelete(job);
            }}
          />
        )}
      </Card>

      {jobToDelete && (
        <DeleteJobDialog
          job={jobToDelete}
          isDeleting={isDeleting}
          onCancel={() => setJobToDelete(null)}
          onConfirm={confirmDeleteJob}
        />
      )}
    </div>
  );
};

export default ManageJobs;
