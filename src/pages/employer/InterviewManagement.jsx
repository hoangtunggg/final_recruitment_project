import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  FiCalendar,
  FiClock,
  FiUser,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
  FiSearch,
  FiArrowRight,
} from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { applicationService } from "../../services/applicationService";
import { jobService } from "../../services/jobService";
import { Button, Card, EmptyState, Input, PageHeader, Select } from "../../components/ui";
import { useEnumLabel } from "../../i18n/helpers";
import StatCard from "../../components/employer/EmployerStatCard";
import InterviewCandidateCard from "./interviews/InterviewCandidateCard";
import { candidateNameOf } from "./interviews/interview-helpers";
import InterviewStatusModal from "./interviews/InterviewStatusModal";
import { extractApplications, serverErrorText } from "./employer-api-helpers";

const InterviewManagement = () => {
  const { t } = useTranslation(["employer", "common"]);
  const label = useEnumLabel();
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null); // { raw } | { key }
  const [toast, setToast] = useState(null); // { type, raw?, key?, params? }

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState("all"); // 'all' | 'interview_scheduled' | 'interviewed'
  const [selectedJobId, setSelectedJobId] = useState("all");

  // Status update modal
  const [statusModalTarget, setStatusModalTarget] = useState(null);
  const [newStatus, setNewStatus] = useState("interviewed");
  const [statusNotes, setStatusNotes] = useState("");
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);
  const [downloadingResumeId, setDownloadingResumeId] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ ...message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Close modal on Escape key
  useEffect(() => {
    if (!statusModalTarget) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setStatusModalTarget(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [statusModalTarget]);

  // Load real applications and jobs
  const fetchInterviewData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      setError(null);
      const [appsRes, jobsRes] = await Promise.all([
        applicationService.getAllApplications({ limit: 100 }),
        jobService.getMyJobs({ limit: 100 }),
      ]);
      setApplications(extractApplications(appsRes));
      setJobs(jobsRes?.success && Array.isArray(jobsRes.data) ? jobsRes.data : []);
    } catch (err) {
      console.error("Failed to load interview candidates:", err);
      const raw = serverErrorText(err);
      setError(raw ? { raw } : { key: "interviews.loadFailed" });
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchInterviewData(false);
  }, [fetchInterviewData]);

  // Candidates specifically in interview stages
  const interviewCandidates = useMemo(
    () =>
      applications.filter((app) => app.status === "interview_scheduled" || app.status === "interviewed"),
    [applications]
  );

  const filteredCandidates = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return interviewCandidates.filter((app) => {
      const name = (candidateNameOf(app) || "").toLowerCase();
      const email = (app.user?.email || app.applicantEmail || app.email || "").toLowerCase();
      const jobTitle = (app.job?.title || "").toLowerCase();
      const matchesSearch =
        !term || name.includes(term) || email.includes(term) || jobTitle.includes(term);
      const matchesStage = stageFilter === "all" || app.status === stageFilter;
      const matchesJob =
        selectedJobId === "all" || String(app.jobId || app.job?.id) === String(selectedJobId);
      return matchesSearch && matchesStage && matchesJob;
    });
  }, [interviewCandidates, searchTerm, stageFilter, selectedJobId]);

  const scheduledCount = interviewCandidates.filter((a) => a.status === "interview_scheduled").length;
  const completedCount = interviewCandidates.filter((a) => a.status === "interviewed").length;

  const handleDownloadResume = async (app) => {
    const candidateName = candidateNameOf(app) || t("employer:interviews.candidate");
    setDownloadingResumeId(app.id);
    try {
      await applicationService.downloadResume(app.id, candidateName);
      showToast({ key: "interviews.toast.resumeDownloaded", params: { name: candidateName } });
    } catch (err) {
      console.error("Resume download error:", err);
      const raw = serverErrorText(err);
      showToast(raw ? { raw } : { key: "interviews.toast.noResume" }, "error");
    } finally {
      setDownloadingResumeId(null);
    }
  };

  const openStatusModal = (app) => {
    setStatusModalTarget(app);
    setNewStatus(app.status === "interview_scheduled" ? "interviewed" : "offered");
    setStatusNotes(app.notes || "");
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!statusModalTarget) return;

    setIsSubmittingStatus(true);
    const prevApps = [...applications];

    // Optimistic UI update
    setApplications((prev) =>
      prev.map((app) =>
        app.id === statusModalTarget.id ? { ...app, status: newStatus, notes: statusNotes } : app
      )
    );

    try {
      const response = await applicationService.updateApplicationStatus(statusModalTarget.id, {
        status: newStatus,
        notes: statusNotes || undefined,
      });
      if (response?.success) {
        showToast({ key: "interviews.toast.moved", params: { status: label("applicationStatus", newStatus) } });
        setStatusModalTarget(null);
      } else {
        throw new Error(response?.error || "");
      }
    } catch (err) {
      console.error("Status update error:", err);
      setApplications(prevApps); // revert optimistic update
      const raw = serverErrorText(err);
      showToast(raw ? { raw } : { key: "interviews.toast.updateFailed" }, "error");
    } finally {
      setIsSubmittingStatus(false);
    }
  };

  const message = (m) => m.raw || t(`employer:${m.key}`, m.params);
  const stageTabs = [
    { value: "all", text: t("employer:interviews.tabs.all", { n: interviewCandidates.length }) },
    { value: "interview_scheduled", text: t("employer:interviews.tabs.scheduled", { n: scheduledCount }) },
    { value: "interviewed", text: t("employer:interviews.tabs.completed", { n: completedCount }) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("employer:interviews.title")}
        subtitle={t("employer:interviews.subtitle")}
        actions={
          <>
            <Button as={Link} to="/employer/applicants" variant="outline" size="sm" leftIcon={<FiUser />}>
              {t("employer:interviews.allApplicants")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchInterviewData(true)}
              disabled={refreshing || loading}
              leftIcon={<FiRefreshCw className={refreshing ? "animate-spin" : ""} />}
            >
              {refreshing ? t("employer:interviews.refreshing") : t("common:actions.refresh")}
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
            <p className="text-sm font-medium">{message(error)}</p>
          </div>
          <Button variant="danger" size="sm" onClick={() => fetchInterviewData(true)} className="shrink-0">
            {t("common:states.retry")}
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={FiCalendar}
          tone="primary"
          chip={{ text: t("employer:interviews.stats.pipelineChip") }}
          label={t("employer:interviews.stats.total")}
          value={interviewCandidates.length}
          footnote={t("employer:interviews.stats.totalFootnote")}
        />
        <StatCard
          icon={FiClock}
          tone="warning"
          chip={{ text: t("employer:interviews.stats.upcomingChip") }}
          label={t("employer:interviews.stats.scheduled")}
          value={scheduledCount}
          footnote={t("employer:interviews.stats.scheduledFootnote")}
        />
        <StatCard
          icon={FiCheckCircle}
          tone="success"
          chip={{ text: t("employer:interviews.stats.doneChip") }}
          label={t("employer:interviews.stats.completed")}
          value={completedCount}
          footnote={t("employer:interviews.stats.completedFootnote")}
        />
      </div>

      <Card padding="sm" className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <Input
          className="max-w-md flex-1"
          type="search"
          leftIcon={<FiSearch />}
          aria-label={t("employer:interviews.searchLabel")}
          placeholder={t("employer:interviews.searchPlaceholder")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-pill bg-tint p-1 text-xs font-semibold" role="group" aria-label={t("employer:interviews.stageFilter")}>
            {stageTabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                aria-pressed={stageFilter === tab.value}
                onClick={() => setStageFilter(tab.value)}
                className={`rounded-pill px-3 py-1.5 transition-colors ${
                  stageFilter === tab.value
                    ? "bg-surface text-primary-text shadow-sm"
                    : "text-muted hover:text-ink"
                }`}
              >
                {tab.text}
              </button>
            ))}
          </div>
          {jobs.length > 0 && (
            <Select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              aria-label={t("employer:interviews.jobFilter")}
            >
              <option value="all">{t("employer:interviews.allJobs")}</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </Select>
          )}
        </div>
      </Card>

      {loading ? (
        <div className="space-y-4" role="status" aria-label={t("common:states.loading")}>
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse space-y-4 p-6">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 rounded-card bg-line" />
                <div className="space-y-2">
                  <div className="h-4 w-40 rounded bg-line" />
                  <div className="h-3 w-28 rounded bg-line" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : filteredCandidates.length === 0 ? (
        <EmptyState
          icon={<FiCalendar />}
          title={
            interviewCandidates.length === 0
              ? t("employer:interviews.empty.noneTitle")
              : t("employer:interviews.empty.noMatchTitle")
          }
          description={
            interviewCandidates.length === 0
              ? t("employer:interviews.empty.noneText")
              : t("employer:interviews.empty.noMatchText")
          }
          action={
            <Button as={Link} to="/employer/applicants" size="sm" rightIcon={<FiArrowRight />}>
              {t("employer:interviews.empty.viewTracking")}
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredCandidates.map((app) => (
            <InterviewCandidateCard
              key={app.id}
              app={app}
              downloading={downloadingResumeId === app.id}
              onDownloadResume={handleDownloadResume}
              onUpdateStatus={openStatusModal}
            />
          ))}
        </div>
      )}

      {statusModalTarget && (
        <InterviewStatusModal
          target={statusModalTarget}
          newStatus={newStatus}
          notes={statusNotes}
          submitting={isSubmittingStatus}
          onStatusChange={setNewStatus}
          onNotesChange={setStatusNotes}
          onSubmit={handleUpdateStatus}
          onClose={() => setStatusModalTarget(null)}
        />
      )}

      {toast && (
        <div
          role="alert"
          className={`!mt-0 fixed bottom-5 right-5 z-[80] flex items-center space-x-2 rounded-card border px-4 py-3 text-sm font-medium shadow-card ${
            toast.type === "error"
              ? "border-danger/30 bg-surface text-danger"
              : "border-success/30 bg-surface text-success"
          }`}
        >
          {toast.type === "error" ? (
            <FiAlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          ) : (
            <FiCheckCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          )}
          <span>{message(toast)}</span>
        </div>
      )}
    </div>
  );
};

export default InterviewManagement;
