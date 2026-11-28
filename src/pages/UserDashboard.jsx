import React, { useCallback, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useAuth from "../hooks/useAuth";
import { useJobs } from "../context/JobContext";
import { useSavedJobs } from "../context/SavedJobsContext";
import DashboardTopBar from "../components/dashboard/DashboardTopBar";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import DashboardOverview from "../components/dashboard/DashboardOverview";
import { RecommendedJobsTab, SavedJobsTab } from "../components/dashboard/DashboardJobTabs";
import ApplicationList from "../components/dashboard/ApplicationList";
import ResumeManager from "../components/dashboard/ResumeManager";
import ProfileIntegrityCard from "../components/dashboard/ProfileIntegrityCard";
import FeedbackBanner from "../components/dashboard/FeedbackBanner";
import DashboardConfirmDialogs from "../components/dashboard/DashboardConfirmDialogs";
import useWithdrawApplication from "../components/dashboard/useWithdrawApplication";
import useCandidateApplications from "../components/dashboard/useCandidateApplications";
import useCandidateResumes from "../components/dashboard/useCandidateResumes";
import {
  computeApplicationStats,
  parseCandidateSkills,
  rankRecommendedJobs,
  resolveSavedJobs,
} from "../components/dashboard/candidate-dashboard-insights";

const CANDIDATE_TAB_IDS = new Set(["overview", "applications", "saved", "recommended", "resumes"]);

/**
 * Candidate workspace (/dashboard): overview, applications, saved jobs, recommendations and resumes.
 * Data hooks live in components/dashboard/*; this page wires them to the tabs and the two confirm dialogs.
 */
const UserDashboard = () => {
  const { t } = useTranslation("candidate");
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { getPublishedJobs, loading: jobsLoading } = useJobs();
  const { savedJobs, saveJob, unsaveJob, isJobSaved, getSavedJobsCount } = useSavedJobs();
  const publishedJobs = getPublishedJobs();

  const [activeTab, setActiveTab] = useState(() => {
    const initial = location.hash.replace("#", "");
    return CANDIDATE_TAB_IDS.has(initial) ? initial : "overview";
  });
  const [statusFilter, setStatusFilter] = useState("all");
  const [feedback, setFeedback] = useState(null);

  // Deep links such as /dashboard#saved open that tab (also when only the hash changes later).
  const [seenHash, setSeenHash] = useState(location.hash);
  if (location.hash !== seenHash) {
    setSeenHash(location.hash);
    const requested = location.hash.replace("#", "");
    if (CANDIDATE_TAB_IDS.has(requested)) setActiveTab(requested);
  }

  const handleTabChange = useCallback((tabId, filter = "all") => {
    setActiveTab(tabId);
    if (filter) setStatusFilter(filter);
  }, []);

  const showFeedback = useCallback((type, message, duration = 4500) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback((prev) => (prev?.message === message ? null : prev)), duration);
  }, []);

  const applications = useCandidateApplications(user, showFeedback);
  const resumeState = useCandidateResumes(showFeedback);
  const withdraw = useWithdrawApplication(applications.refetch, showFeedback);

  const candidateSkills = useMemo(() => parseCandidateSkills(user?.skills), [user?.skills]);
  const savedResolved = useMemo(() => resolveSavedJobs(savedJobs, publishedJobs), [savedJobs, publishedJobs]);
  const recommendedJobs = useMemo(() => rankRecommendedJobs(publishedJobs, candidateSkills), [publishedJobs, candidateSkills]);
  const stats = computeApplicationStats(applications.applications, getSavedJobsCount());

  const handleSaveJob = (jobOrId) => {
    if (!jobOrId) return;
    const jobId = typeof jobOrId === "object" ? jobOrId.id : jobOrId;
    const job = typeof jobOrId === "object" ? jobOrId : publishedJobs.find((item) => item.id === jobId);
    if (isJobSaved(jobId)) {
      unsaveJob(jobId);
      showFeedback("info", t("feedback.removedSaved"));
    } else if (job) {
      saveJob(job);
      showFeedback("success", t("feedback.saved", { title: job.title }));
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const counts = {
    applications: applications.applications.length,
    saved: getSavedJobsCount(),
    resumes: resumeState.resumes.length,
    recommended: recommendedJobs.length,
  };
  const sectionTitle = t(`sections.${activeTab}`);
  const defaultResume = resumeState.resumes.find((resume) => resume.isDefault);

  return (
    <div className="min-h-screen bg-canvas text-ink" data-testid="candidate-dashboard">
      <a
        href="#candidate-main-content"
        className="fixed left-3 top-3 z-[100] -translate-y-24 rounded-pill bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition-transform focus:translate-y-0"
      >
        {t("shell.skip")}
      </a>

      <DashboardTopBar user={user} activeTab={activeTab} sectionTitle={sectionTitle} counts={counts} onTabChange={handleTabChange} onLogout={handleLogout} />

      <main id="candidate-main-content" tabIndex="-1" className="min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <div className="mx-auto max-w-page">
          <FeedbackBanner feedback={feedback} onDismiss={() => setFeedback(null)} />
          <DashboardHeader user={user} stats={stats} onTabChange={handleTabChange} />

          {activeTab === "overview" && (
            <DashboardOverview
              applications={applications.applications}
              applicationsLoading={applications.loading}
              jobsLoading={jobsLoading}
              recommendedJobs={recommendedJobs}
              hasSkills={candidateSkills.length > 0}
              isJobSaved={isJobSaved}
              onSaveJob={handleSaveJob}
              onTabChange={handleTabChange}
            />
          )}

          {activeTab === "applications" && (
            <div id="dashboard-panel-applications" role="tabpanel" aria-label={t("tabs.applications")}>
              <ApplicationList
                applications={applications.applications}
                loading={applications.loading}
                error={applications.error}
                initialStatus={statusFilter}
                onRetry={applications.refetch}
                onExplore={() => handleTabChange("recommended")}
                onWithdraw={withdraw.request}
                onFeedback={showFeedback}
                actionLoadingId={withdraw.busyId}
              />
            </div>
          )}

          {activeTab === "saved" && (
            <SavedJobsTab jobs={savedResolved} onRemove={handleSaveJob} onExplore={() => handleTabChange("recommended")} />
          )}

          {activeTab === "recommended" && (
            <RecommendedJobsTab
              jobs={recommendedJobs}
              loading={jobsLoading}
              candidateSkills={candidateSkills}
              isJobSaved={isJobSaved}
              onToggleSave={handleSaveJob}
            />
          )}

          {activeTab === "resumes" && (
            <div id="dashboard-panel-resumes" role="tabpanel" aria-label={t("tabs.resumes")} className="space-y-8">
              <ResumeManager
                resumes={resumeState.resumes}
                loading={resumeState.loading}
                error={resumeState.error}
                uploading={resumeState.uploading}
                actionLoadingId={resumeState.actionLoadingId}
                onUpload={resumeState.upload}
                onSetDefault={resumeState.setDefault}
                onDownload={resumeState.download}
                onDelete={resumeState.requestDelete}
                onRetry={resumeState.refetch}
              />
              <ProfileIntegrityCard user={{ ...user, resumePath: defaultResume?.filePath || defaultResume?.fileName || user?.resumePath }} />
            </div>
          )}
        </div>
      </main>

      <DashboardConfirmDialogs
        resume={{
          toDelete: resumeState.toDelete,
          busy: resumeState.actionLoadingId !== null,
          onCancel: resumeState.cancelDelete,
          onConfirm: resumeState.confirmDelete,
        }}
        withdraw={{
          application: withdraw.application,
          busy: withdraw.busyId !== null,
          onCancel: withdraw.cancel,
          onConfirm: withdraw.confirm,
        }}
      />
    </div>
  );
};

export default UserDashboard;
