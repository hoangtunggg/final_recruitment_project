import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { FiUsers, FiFilter, FiSearch, FiCheckCircle, FiArrowLeft, FiRefreshCw, FiAlertCircle } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { applicationService } from "../../services/applicationService";
import { jobService } from "../../services/jobService";
import { Button, Card, EmptyState, Input, PageHeader, Select } from "../ui";
import { useEnumLabel } from "../../i18n/helpers";
import ApplicantTable from "./applicant-tracker/ApplicantTable";
import ApplicantDetailModal from "./applicant-tracker/ApplicantDetailModal";
import ApplicantStatusModal from "./applicant-tracker/ApplicantStatusModal";
import { APPLICATION_STATUSES } from "./applicant-tracker/applicant-tracker-helpers";
import { extractApplications, serverErrorText } from "../../pages/employer/employer-api-helpers";

// KPI tiles: key -> employer:applicants.kpi.<key>, tone class for the caption
const KPI_TILES = [
  { key: "total", tone: "text-muted" },
  { key: "pending", tone: "text-warning" },
  { key: "reviewing", tone: "text-primary-text" },
  { key: "shortlisted", tone: "text-success" },
  { key: "interview", tone: "text-primary-text" },
  { key: "hired", tone: "text-success" },
];

const ApplicantTracker = ({ jobId = null }) => {
  const { t } = useTranslation(["employer", "common"]);
  const label = useEnumLabel();
  const [job, setJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [employerJobs, setEmployerJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null); // { raw } | { key }
  const [toast, setToast] = useState(null); // { type, raw?, key?, params? }

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedJobFilter, setSelectedJobFilter] = useState(jobId ? String(jobId) : "all");

  // Candidate detail modal & actions
  const [activeApplicant, setActiveApplicant] = useState(null);
  const [downloadingResumeId, setDownloadingResumeId] = useState(null);
  const [statusChangeTarget, setStatusChangeTarget] = useState(null);
  const [statusNotes, setStatusNotes] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ ...message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = useCallback(
    async (isManual = false) => {
      if (isManual) setRefreshing(true);
      try {
        setError(null);
        if (jobId) {
          // Per-job mode: load the job header details
          const jobRes = await jobService.getJobById(jobId);
          if (jobRes?.success && jobRes.data) setJob(jobRes.data);
        } else {
          // General mode: employer jobs for the filter dropdown
          const jobsRes = await jobService.getMyJobs({ limit: 100 });
          if (jobsRes?.success && Array.isArray(jobsRes.data)) setEmployerJobs(jobsRes.data);
        }
        // Applications (scoped by jobId if provided)
        const appsParams = { limit: 100 };
        if (jobId) appsParams.jobId = jobId;
        const appsRes = await applicationService.getAllApplications(appsParams);
        setApplicants(extractApplications(appsRes));
      } catch (err) {
        console.error("Failed to load applicants:", err);
        const raw = serverErrorText(err);
        setError(raw ? { raw } : { key: "applicants.loadFailed" });
      } finally {
        setLoading(false);
        if (isManual) setRefreshing(false);
      }
    },
    [jobId]
  );

  useEffect(() => {
    fetchData(false);
    const handleApplicationSubmitted = () => fetchData(false);
    window.addEventListener("applicationSubmitted", handleApplicationSubmitted);
    return () => window.removeEventListener("applicationSubmitted", handleApplicationSubmitted);
  }, [fetchData]);

  // ESC key dismisses the topmost open modal
  useEffect(() => {
    if (!activeApplicant && !statusChangeTarget) return undefined;
    const handleKeyDown = (e) => {
      if (e.key !== "Escape") return;
      if (statusChangeTarget) setStatusChangeTarget(null);
      else setActiveApplicant(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeApplicant, statusChangeTarget]);

  const pipelineMetrics = useMemo(() => {
    const count = (...statuses) => applicants.filter((a) => statuses.includes(a.status)).length;
    return {
      total: applicants.length,
      pending: count("pending"),
      reviewing: count("under_review"),
      shortlisted: count("shortlisted"),
      interview: count("interview_scheduled", "interviewed"),
      hired: count("accepted"),
    };
  }, [applicants]);

  const filteredApplicants = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return applicants.filter((app) => {
      const skillsStr = Array.isArray(app.skills) ? app.skills.join(" ") : app.skills || "";
      const matchesSearch =
        !term ||
        app.applicantName?.toLowerCase().includes(term) ||
        app.applicantEmail?.toLowerCase().includes(term) ||
        app.applicantPhone?.toLowerCase().includes(term) ||
        app.job?.title?.toLowerCase().includes(term) ||
        skillsStr.toLowerCase().includes(term);
      const matchesStatus = statusFilter === "all" || app.status === statusFilter;
      const matchesJob =
        jobId || selectedJobFilter === "all" || String(app.jobId) === String(selectedJobFilter);
      return matchesSearch && matchesStatus && matchesJob;
    });
  }, [applicants, searchTerm, statusFilter, selectedJobFilter, jobId]);

  const handleExecuteStatusChange = async (targetApplicant, newStatus, notes) => {
    setIsUpdatingStatus(true);
    try {
      const response = await applicationService.updateApplicationStatus(targetApplicant.id, {
        status: newStatus,
        notes: notes || undefined,
      });
      if (response && response.success) {
        const updated = response.data || {
          ...targetApplicant,
          status: newStatus,
          notes: notes || targetApplicant.notes,
        };
        setApplicants((prev) => prev.map((a) => (a.id === targetApplicant.id ? { ...a, ...updated } : a)));
        if (activeApplicant && activeApplicant.id === targetApplicant.id) {
          setActiveApplicant((prev) => ({ ...prev, ...updated }));
        }
        showToast({ key: "applicants.toast.statusMarked", params: { status: label("applicationStatus", newStatus) } });
        setStatusChangeTarget(null);
        setStatusNotes("");
      } else {
        throw new Error(response?.error || "");
      }
    } catch (err) {
      console.error("Status update error:", err);
      const raw = serverErrorText(err);
      showToast(raw ? { raw } : { key: "applicants.toast.statusFailed" }, "error");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDownloadResume = async (applicant) => {
    if (!applicant.resumePath) {
      showToast({ key: "applicants.toast.noResumeAttached" }, "error");
      return;
    }
    setDownloadingResumeId(applicant.id);
    try {
      await applicationService.downloadResume(applicant.id, applicant.applicantName);
      showToast({ key: "applicants.toast.resumeDownloaded" });
    } catch (err) {
      console.error("Download resume error:", err);
      const raw = serverErrorText(err);
      showToast(raw ? { raw } : { key: "applicants.toast.downloadFailed" }, "error");
    } finally {
      setDownloadingResumeId(null);
    }
  };

  const openStatusModal = (applicant) => {
    setStatusChangeTarget(applicant);
    setStatusNotes(applicant.notes || "");
  };

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setSelectedJobFilter(jobId ? String(jobId) : "all");
  };

  const message = (m) => m.raw || t(`employer:${m.key}`, m.params);
  const hasActiveFilters = searchTerm || statusFilter !== "all" || (!jobId && selectedJobFilter !== "all");

  return (
    <div className="space-y-6">
      {toast && (
        <div
          role="status"
          className={`flex items-center space-x-3 rounded-card border p-4 ${
            toast.type === "success"
              ? "border-success/30 bg-success/10 text-success"
              : "border-danger/30 bg-danger/10 text-danger"
          }`}
        >
          {toast.type === "success" ? (
            <FiCheckCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
          ) : (
            <FiAlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
          )}
          <p className="text-sm font-semibold">{message(toast)}</p>
        </div>
      )}

      <PageHeader
        eyebrow={
          jobId ? (
            <span className="inline-flex items-center gap-2">
              <Link to="/employer/jobs" className="inline-flex items-center gap-1 hover:underline">
                <FiArrowLeft aria-hidden="true" />
                {t("employer:applicants.manageJobs")}
              </Link>
              <span aria-hidden="true">/</span>
              <span>{t("employer:applicants.jobApplicants")}</span>
            </span>
          ) : (
            t("employer:applicants.eyebrow")
          )
        }
        title={jobId ? job?.title || t("employer:applicants.jobApplicants") : t("employer:applicants.title")}
        subtitle={
          jobId
            ? [job?.company, job?.location, job?.type && label("jobType", job.type)].filter(Boolean).join(" • ")
            : t("employer:applicants.subtitle")
        }
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchData(true)}
              disabled={refreshing || loading}
              leftIcon={<FiRefreshCw className={refreshing ? "animate-spin" : ""} />}
            >
              {refreshing ? t("employer:applicants.refreshing") : t("common:actions.refresh")}
            </Button>
            {jobId && (
              <Button as={Link} to="/employer/applicants" variant="outline" size="sm">
                {t("employer:applicants.viewAll")}
              </Button>
            )}
          </>
        }
      />

      {error && (
        <div
          role="alert"
          className="flex flex-col justify-between gap-3 rounded-card border border-danger/30 bg-danger/10 p-4 text-danger sm:flex-row sm:items-center"
        >
          <div className="flex items-center space-x-3">
            <FiAlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
            <p className="text-sm font-medium">{message(error)}</p>
          </div>
          <Button variant="danger" size="sm" onClick={() => fetchData(true)} className="shrink-0">
            {t("employer:applicants.retryLoading")}
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {KPI_TILES.map(({ key, tone }) => (
          <Card key={key} padding="sm" shadow={false}>
            <span className={`text-[11px] font-bold uppercase tracking-wider ${tone}`}>
              {t(`employer:applicants.kpi.${key}`)}
            </span>
            <p className="mt-1 text-2xl font-extrabold text-ink">{pipelineMetrics[key]}</p>
          </Card>
        ))}
      </div>

      <Card padding="sm">
        <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          <Input
            type="search"
            leftIcon={<FiSearch />}
            aria-label={t("employer:applicants.searchLabel")}
            placeholder={t("employer:applicants.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label={t("employer:applicants.filterStatus")}
          >
            <option value="all">{t("employer:applicants.allStatuses")}</option>
            {APPLICATION_STATUSES.map((value) => (
              <option key={value} value={value}>
                {label("applicationStatus", value)}
              </option>
            ))}
          </Select>
          {!jobId && (
            <Select
              value={selectedJobFilter}
              onChange={(e) => setSelectedJobFilter(e.target.value)}
              aria-label={t("employer:applicants.filterJob")}
            >
              <option value="all">{t("employer:applicants.allJobs")}</option>
              {employerJobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </Select>
          )}
          <p className="flex items-center space-x-1.5 px-1 text-xs font-semibold text-muted sm:justify-end">
            <FiFilter className="h-3.5 w-3.5 text-primary-text" aria-hidden="true" />
            <span>
              {t("employer:applicants.showing", { shown: filteredApplicants.length, total: applicants.length })}
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
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-line" />
                  <div className="space-y-2">
                    <div className="h-4 w-36 rounded bg-line" />
                    <div className="h-3 w-28 rounded bg-line" />
                  </div>
                </div>
                <div className="h-8 w-24 rounded-pill bg-line" />
              </div>
            ))}
          </div>
        ) : filteredApplicants.length === 0 ? (
          <EmptyState
            icon={<FiUsers />}
            title={applicants.length === 0 ? t("employer:applicants.empty.noneTitle") : t("employer:applicants.empty.noMatchTitle")}
            description={applicants.length === 0 ? t("employer:applicants.empty.noneText") : t("employer:applicants.empty.noMatchText")}
            action={
              hasActiveFilters ? (
                <Button variant="outline" size="sm" onClick={resetFilters}>
                  {t("employer:applicants.empty.resetFilters")}
                </Button>
              ) : null
            }
          />
        ) : (
          <ApplicantTable
            applicants={filteredApplicants}
            downloadingResumeId={downloadingResumeId}
            onReview={setActiveApplicant}
            onChangeStatus={openStatusModal}
            onDownloadResume={handleDownloadResume}
          />
        )}
      </Card>

      {activeApplicant && (
        <ApplicantDetailModal
          applicant={activeApplicant}
          downloading={downloadingResumeId === activeApplicant.id}
          onClose={() => setActiveApplicant(null)}
          onDownloadResume={handleDownloadResume}
          onChangeStatus={openStatusModal}
        />
      )}

      {statusChangeTarget && (
        <ApplicantStatusModal
          target={statusChangeTarget}
          notes={statusNotes}
          updating={isUpdatingStatus}
          onNotesChange={setStatusNotes}
          onSelectStatus={handleExecuteStatusChange}
          onSaveNotes={handleExecuteStatusChange}
          onClose={() => setStatusChangeTarget(null)}
        />
      )}
    </div>
  );
};

export default ApplicantTracker;
