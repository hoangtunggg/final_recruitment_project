import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  FiEye,
  FiDownload,
  FiCalendar,
  FiMail,
  FiPhone,
  FiTrash2,
  FiEdit2,
  FiRefreshCw,
  FiFileText,
} from "react-icons/fi";
import { applicationService } from "../../services/applicationService";
import jobApi from "../../services/jobApi";
import { Button, Spinner, StatusBadge } from "../../components/ui";
import { useEnumLabel, useLocale } from "../../i18n/helpers";
import AdminNoticeBanner from "../../components/admin/shared/AdminNoticeBanner";
import AdminPageHeader from "../../components/admin/shared/AdminPageHeader";
import AdminPagination from "../../components/admin/shared/AdminPagination";
import { AdminConfirmDeleteModal } from "../../components/admin/shared/AdminModal";
import { AdminAvatar, AdminIconButton } from "../../components/admin/shared/AdminDetailParts";
import { AdminFilterBar, AdminFilterSelect, AdminSearchBox } from "../../components/admin/shared/AdminListFilters";
import {
  AdminEmptyListState,
  AdminErrorState,
  AdminLoadingState,
  AdminTableCard,
} from "../../components/admin/shared/AdminListStates";
import { useAdminFeedback } from "../../components/admin/shared/useAdminFeedback";
import {
  ADMIN_TABLE,
  ADMIN_TBODY,
  ADMIN_TD,
  ADMIN_TD_ACTIONS,
  ADMIN_TD_MUTED,
  ADMIN_TH,
  ADMIN_TH_RIGHT,
  ADMIN_THEAD,
  ADMIN_TR,
} from "../../components/admin/shared/admin-table-classes";
import ApplicationDetailsModal from "../../components/admin/applications/ApplicationDetailsModal";
import ApplicationStatusModal from "../../components/admin/applications/ApplicationStatusModal";
import { APPLICATION_STATUSES } from "../../components/admin/applications/application-status-options";
import { extractApplications, extractPagination } from "../../services/application-list-response";

const ApplicationsManagement = () => {
  const { t } = useTranslation("admin");
  const label = useEnumLabel();
  const locale = useLocale();

  // Query state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [jobFilter, setJobFilter] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 10;

  // Data & loading state
  const [applications, setApplications] = useState([]);
  const [jobsList, setJobsList] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalApplications: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals state
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Selected item state
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [newStatus, setNewStatus] = useState("pending");
  const [reviewerNotes, setReviewerNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [downloadLoadingId, setDownloadLoadingId] = useState(null);

  // Success / error banner
  const { notification, showFeedback, dismiss } = useAdminFeedback();

  // Load jobs list for the job dropdown filter
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await jobApi.getAllJobsAdmin({ limit: 100 });
        if (res.success && res.data?.jobs) {
          setJobsList(res.data.jobs);
        }
      } catch (err) {
        console.error("Error loading jobs for filter:", err);
      }
    };
    fetchJobs();
  }, []);

  // Fetch applications from server
  const loadApplications = useCallback(
    async (
      targetPage = page,
      search = searchTerm,
      status = statusFilter,
      jobId = jobFilter
    ) => {
      setLoading(true);
      setError(null);
      try {
        const response = await applicationService.getAllApplications({
          page: targetPage,
          limit,
          search,
          status,
          jobId,
        });

        if (response.success) {
          // The microservices API nests the list ({ data: { applications, pagination } }): read it tolerantly.
          setApplications(extractApplications(response));
          setPagination(extractPagination(response, { page: targetPage, limit }));
        } else {
          throw new Error(response.error || "");
        }
      } catch (err) {
        console.error("Error loading applications:", err);
        setError({ message: err.response?.data?.error || err.message || "" });
      } finally {
        setLoading(false);
      }
    },
    [page, searchTerm, statusFilter, jobFilter]
  );

  // Debounced search & filter trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      loadApplications(page, searchTerm, statusFilter, jobFilter);
    }, 300);

    return () => clearTimeout(timer);
  }, [loadApplications, page, searchTerm, statusFilter, jobFilter]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  const handleJobFilterChange = (e) => {
    setJobFilter(e.target.value);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setJobFilter("all");
    setPage(1);
  };

  // Translated status label (API value stays untouched)
  const formatStatus = (status) => label("applicationStatus", status) || t("shared.unknown");

  // View details
  const handleViewDetails = (application) => {
    setSelectedApplication(application);
    setShowDetailsModal(true);
  };

  // Open status modal
  const handleOpenStatusModal = (application) => {
    setSelectedApplication(application);
    setNewStatus(application.status || "pending");
    setReviewerNotes(application.notes || "");
    setShowStatusModal(true);
  };

  // Submit status update
  const handleUpdateStatus = async () => {
    if (!selectedApplication) return;
    setActionLoading(true);
    try {
      const response = await applicationService.updateApplicationStatus(
        selectedApplication.id,
        {
          status: newStatus,
          notes: reviewerNotes,
        }
      );

      if (response.success) {
        showFeedback(
          "success",
          t("applications.toast.statusUpdated", {
            name: selectedApplication.applicantName,
            status: formatStatus(newStatus),
          })
        );
        setShowStatusModal(false);
        setSelectedApplication(null);
        loadApplications();
      } else {
        throw new Error(response.error || t("applications.errors.update"));
      }
    } catch (err) {
      console.error("Error updating application status:", err);
      showFeedback(
        "error",
        err.response?.data?.error || err.message || t("applications.errors.update")
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Real resume download
  const handleDownloadResume = async (application) => {
    if (!application?.resumePath && !application?.resume) {
      showFeedback("error", t("applications.errors.noResume"));
      return;
    }

    setDownloadLoadingId(application.id);
    try {
      await applicationService.downloadResume(application.id, application.applicantName);
      showFeedback(
        "success",
        t("applications.toast.resumeDownloaded", { name: application.applicantName })
      );
    } catch (err) {
      console.error("Error downloading resume:", err);
      showFeedback("error", err.message || t("applications.errors.download"));
    } finally {
      setDownloadLoadingId(null);
    }
  };

  // Open delete modal
  const handleOpenDelete = (application) => {
    setSelectedApplication(application);
    setShowDeleteModal(true);
  };

  // Submit delete application
  const handleDeleteApplication = async () => {
    if (!selectedApplication) return;
    setActionLoading(true);
    try {
      const response = await applicationService.deleteApplication(selectedApplication.id);
      if (response.success) {
        showFeedback(
          "success",
          t("applications.toast.deleted", { name: selectedApplication.applicantName })
        );
        setShowDeleteModal(false);
        setSelectedApplication(null);
        loadApplications();
      } else {
        throw new Error(response.error || t("applications.errors.delete"));
      }
    } catch (err) {
      console.error("Error deleting application:", err);
      showFeedback(
        "error",
        err.response?.data?.error || err.message || t("applications.errors.delete")
      );
    } finally {
      setActionLoading(false);
    }
  };


  const hasFilters = searchTerm || statusFilter !== "all" || jobFilter !== "all";

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title={t("applications.title")}
        subtitle={t("applications.subtitle")}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadApplications()}
            disabled={loading}
            leftIcon={<FiRefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />}
          >
            {t("common:actions.refresh")}
          </Button>
        }
      />

      <AdminNoticeBanner notification={notification} onDismiss={dismiss} />

      <AdminFilterBar>
        <AdminSearchBox
          value={searchTerm}
          onChange={handleSearchChange}
          onClear={() => {
            setSearchTerm("");
            setPage(1);
          }}
          placeholder={t("applications.searchPlaceholder")}
          testId="admin-applications-search"
        />
        <AdminFilterSelect
          value={statusFilter}
          onChange={handleStatusFilterChange}
          ariaLabel={t("applications.filterStatusAria")}
          className="md:w-52"
        >
          <option value="all">{t("applications.allStatuses")}</option>
          {APPLICATION_STATUSES.map((value) => (
            <option key={value} value={value}>
              {label("applicationStatus", value)}
            </option>
          ))}
        </AdminFilterSelect>
        <AdminFilterSelect
          value={jobFilter}
          onChange={handleJobFilterChange}
          ariaLabel={t("applications.filterJobAria")}
          className="md:w-56"
        >
          <option value="all">{t("applications.allJobs")}</option>
          {jobsList.map((j) => (
            <option key={j.id} value={j.id}>
              {j.title} ({j.company})
            </option>
          ))}
        </AdminFilterSelect>
      </AdminFilterBar>

      <AdminTableCard>
        {loading ? (
          <AdminLoadingState text={t("applications.loading")} />
        ) : error ? (
          <AdminErrorState
            title={t("applications.loadFailedTitle")}
            message={error.message || t("applications.errors.load")}
            onRetry={() => loadApplications()}
          />
        ) : applications.length === 0 ? (
          <AdminEmptyListState
            icon={<FiFileText className="mx-auto" />}
            title={t("applications.emptyTitle")}
            description={hasFilters ? t("applications.emptyFiltered") : t("applications.emptyNone")}
            onClear={hasFilters ? handleClearFilters : undefined}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className={ADMIN_TABLE} data-testid="admin-applications-table">
                <thead className={ADMIN_THEAD}>
                  <tr>
                    <th className={ADMIN_TH}>{t("applications.th.applicant")}</th>
                    <th className={ADMIN_TH}>{t("applications.th.jobCompany")}</th>
                    <th className={ADMIN_TH}>{t("applications.th.applied")}</th>
                    <th className={ADMIN_TH}>{t("applications.th.status")}</th>
                    <th className={ADMIN_TH}>{t("applications.th.resume")}</th>
                    <th className={ADMIN_TH_RIGHT}>{t("applications.th.actions")}</th>
                  </tr>
                </thead>
                <tbody className={ADMIN_TBODY}>
                  {applications.map((app) => (
                    <tr key={app.id} className={ADMIN_TR}>
                      <td className={ADMIN_TD}>
                        <div className="flex items-center">
                          <AdminAvatar name={app.applicantName} fallback="A" />
                          <div className="ml-4">
                            <div className="text-sm font-medium text-ink">{app.applicantName}</div>
                            <div className="text-sm text-muted flex items-center gap-1">
                              <FiMail className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>{app.applicantEmail}</span>
                            </div>
                            {app.applicantPhone && (
                              <div className="text-xs text-muted flex items-center gap-1 mt-0.5">
                                <FiPhone className="w-3 h-3" aria-hidden="true" />
                                <span>{app.applicantPhone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className={ADMIN_TD}>
                        <div className="text-sm font-semibold text-ink">
                          {app.job?.title || t("applications.jobFallback", { id: app.jobId })}
                        </div>
                        <div className="text-sm text-muted">
                          {app.job?.company || t("applications.unknownCompany")}
                          {app.job?.location ? ` • ${app.job.location}` : ""}
                        </div>
                      </td>
                      <td className={ADMIN_TD_MUTED}>
                        <div className="flex items-center gap-1.5">
                          <FiCalendar className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>
                            {app.applicationDate
                              ? new Date(app.applicationDate).toLocaleDateString(locale)
                              : t("shared.unknown")}
                          </span>
                        </div>
                      </td>
                      <td className={ADMIN_TD}>
                        <StatusBadge group="applicationStatus" value={app.status} />
                      </td>
                      <td className={`${ADMIN_TD} text-sm`}>
                        {app.resumePath || app.resume ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadResume(app)}
                            disabled={downloadLoadingId === app.id}
                            leftIcon={
                              downloadLoadingId === app.id ? (
                                <Spinner size="sm" />
                              ) : (
                                <FiDownload className="w-3.5 h-3.5" />
                              )
                            }
                          >
                            {t("applications.download")}
                          </Button>
                        ) : (
                          <span className="text-xs text-muted italic">{t("applications.noResume")}</span>
                        )}
                      </td>
                      <td className={ADMIN_TD_ACTIONS}>
                        <div className="flex items-center justify-end gap-1">
                          <AdminIconButton
                            icon={FiEye}
                            label={t("applications.actions.viewAria", { name: app.applicantName })}
                            onClick={() => handleViewDetails(app)}
                          />
                          <AdminIconButton
                            icon={FiEdit2}
                            tone="warning"
                            label={t("applications.actions.changeStatusAria", { name: app.applicantName })}
                            onClick={() => handleOpenStatusModal(app)}
                          />
                          <AdminIconButton
                            icon={FiTrash2}
                            tone="danger"
                            label={t("applications.actions.deleteAria", { name: app.applicantName })}
                            onClick={() => handleOpenDelete(app)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <AdminPagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              total={pagination.totalApplications}
              limit={limit}
              noun={t("applications.noun")}
              hasPrev={pagination.hasPrev}
              hasNext={pagination.hasNext}
              loading={loading}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => p + 1)}
            />
          </>
        )}
      </AdminTableCard>

      {showDetailsModal && selectedApplication && (
        <ApplicationDetailsModal
          application={selectedApplication}
          downloadLoading={downloadLoadingId === selectedApplication.id}
          onDownload={handleDownloadResume}
          onChangeStatus={(application) => {
            setShowDetailsModal(false);
            handleOpenStatusModal(application);
          }}
          onClose={() => setShowDetailsModal(false)}
        />
      )}

      {showStatusModal && selectedApplication && (
        <ApplicationStatusModal
          application={selectedApplication}
          status={newStatus}
          setStatus={setNewStatus}
          notes={reviewerNotes}
          setNotes={setReviewerNotes}
          loading={actionLoading}
          onCancel={() => setShowStatusModal(false)}
          onConfirm={handleUpdateStatus}
        />
      )}

      {showDeleteModal && selectedApplication && (
        <AdminConfirmDeleteModal
          label={t("applications.delete.aria")}
          title={t("applications.delete.title")}
          confirmLabel={t("applications.delete.confirm")}
          loading={actionLoading}
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteApplication}
        >
          {t("applications.delete.message", {
            name: selectedApplication.applicantName,
            job: selectedApplication.job?.title || t("applications.delete.thisJob"),
          })}
        </AdminConfirmDeleteModal>
      )}
    </div>
  );
};

export default ApplicationsManagement;
