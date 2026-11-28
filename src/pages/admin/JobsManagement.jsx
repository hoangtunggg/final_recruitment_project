import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiCheck,
  FiX,
  FiRefreshCw,
  FiMapPin,
  FiBriefcase,
  FiCalendar,
} from "react-icons/fi";
import jobApi from "../../services/jobApi";
import { Button, StatusBadge } from "../../components/ui";
import { useEnumLabel, useLocale } from "../../i18n/helpers";
import AdminNoticeBanner from "../../components/admin/shared/AdminNoticeBanner";
import AdminPageHeader from "../../components/admin/shared/AdminPageHeader";
import AdminPagination from "../../components/admin/shared/AdminPagination";
import { AdminConfirmDeleteModal } from "../../components/admin/shared/AdminModal";
import { AdminIconButton } from "../../components/admin/shared/AdminDetailParts";
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
import JobDetailsModal from "../../components/admin/jobs/JobDetailsModal";
import JobFormModal from "../../components/admin/jobs/JobFormModal";
import { APPROVAL_STATUSES, EMPTY_JOB_FORM, JOB_STATUSES } from "../../components/admin/jobs/job-form-options";

const JobsManagement = () => {
  const { t } = useTranslation("admin");
  const label = useEnumLabel();
  const locale = useLocale();

  // Query state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [approvalFilter, setApprovalFilter] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 10;

  // Data & loading state
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalJobs: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals state
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Selected item & action state
  const [selectedJob, setSelectedJob] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [formData, setFormData] = useState(EMPTY_JOB_FORM);

  // Success / error banner
  const { notification, showFeedback, dismiss } = useAdminFeedback();

  // Fetch jobs from server
  const loadJobs = useCallback(
    async (
      targetPage = page,
      search = searchTerm,
      status = statusFilter,
      approval = approvalFilter
    ) => {
      setLoading(true);
      setError(null);
      try {
        const response = await jobApi.getAllJobsAdmin({
          page: targetPage,
          limit,
          search,
          status,
          approvalStatus: approval,
        });

        if (response.success) {
          const jobData = response.data?.jobs || [];
          setJobs(jobData);
          setPagination(
            response.data?.pagination || {
              currentPage: targetPage,
              totalPages: 1,
              totalJobs: jobData.length,
              hasNext: false,
              hasPrev: false,
            }
          );
        } else {
          throw new Error(response.error || "");
        }
      } catch (err) {
        console.error("Error loading jobs:", err);
        setError({ message: err.response?.data?.error || err.message || "" });
      } finally {
        setLoading(false);
      }
    },
    [page, searchTerm, statusFilter, approvalFilter]
  );

  // Debounced search & filter trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      loadJobs(page, searchTerm, statusFilter, approvalFilter);
    }, 300);

    return () => clearTimeout(timer);
  }, [loadJobs, page, searchTerm, statusFilter, approvalFilter]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  const handleApprovalFilterChange = (e) => {
    setApprovalFilter(e.target.value);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setApprovalFilter("all");
    setPage(1);
  };


  // View details
  const handleViewJob = (job) => {
    setSelectedJob(job);
    setShowViewModal(true);
  };

  // Edit job open
  const handleOpenEdit = (job) => {
    setSelectedJob(job);
    setFormData({
      title: job.title || "",
      company: job.company || "",
      location: job.location || "",
      type: job.type || "Full-time",
      experience: job.experience || "Entry Level",
      salary: job.salary || "",
      status: job.status || "Published",
      approvalStatus: job.approvalStatus || "approved",
      description: job.description || "",
      requirements: job.requirements || "",
      responsibilities: job.responsibilities || "",
      benefits: job.benefits || "",
      applicationDeadline: job.applicationDeadline
        ? new Date(job.applicationDeadline).toISOString().split("T")[0]
        : "",
      contactEmail: job.contactEmail || "",
      contactPhone: job.contactPhone || "",
    });
    setShowEditModal(true);
  };

  // Edit job submit
  const handleUpdateJob = async (e) => {
    e?.preventDefault();
    if (!selectedJob) return;
    setActionLoading(true);
    try {
      const response = await jobApi.updateJob(selectedJob.id, formData);
      if (!response.success) {
        throw new Error(response.error || t("jobs.errors.update"));
      }
      showFeedback("success", t("jobs.toast.updated", { title: formData.title }));
      setShowEditModal(false);
      setSelectedJob(null);
      loadJobs();
    } catch (err) {
      console.error("Error updating job:", err);
      showFeedback("error", err.response?.data?.error || err.message || t("jobs.errors.update"));
    } finally {
      setActionLoading(false);
    }
  };

  // Add job open
  const handleOpenAdd = () => {
    setFormData(EMPTY_JOB_FORM);
    setShowAddModal(true);
  };

  // Add job submit
  const handleCreateJob = async (e) => {
    e?.preventDefault();
    setActionLoading(true);
    try {
      const response = await jobApi.createJob(formData);
      if (!response.success) {
        throw new Error(response.error || t("jobs.errors.create"));
      }
      showFeedback("success", t("jobs.toast.created", { title: formData.title }));
      setShowAddModal(false);
      loadJobs();
    } catch (err) {
      console.error("Error creating job:", err);
      showFeedback("error", err.response?.data?.error || err.message || t("jobs.errors.create"));
    } finally {
      setActionLoading(false);
    }
  };

  // Status moderation actions
  const handleApproveJob = async (job) => {
    setActionLoading(true);
    try {
      const updates = { approvalStatus: "approved" };
      const shouldPublish = !["Closed", "inactive", "filled"].includes(job.status);
      if (shouldPublish) {
        updates.status = "Published";
      }

      await jobApi.updateJobStatus(job.id, updates);
      showFeedback(
        "success",
        shouldPublish
          ? t("jobs.toast.approvedPublished", { title: job.title })
          : t("jobs.toast.approvedOnly", { title: job.title, status: label("jobStatus", job.status) })
      );
      loadJobs();
      if (showViewModal) setShowViewModal(false);
    } catch (err) {
      console.error("Error approving job:", err);
      showFeedback("error", err.response?.data?.error || t("jobs.errors.approve"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectJob = async (job) => {
    setActionLoading(true);
    try {
      await jobApi.updateJobStatus(job.id, {
        approvalStatus: "rejected",
        status: "Closed",
      });
      showFeedback("success", t("jobs.toast.rejected", { title: job.title }));
      loadJobs();
      if (showViewModal) setShowViewModal(false);
    } catch (err) {
      console.error("Error rejecting job:", err);
      showFeedback("error", err.response?.data?.error || t("jobs.errors.reject"));
    } finally {
      setActionLoading(false);
    }
  };

  // Delete modal open
  const handleOpenDelete = (job) => {
    setSelectedJob(job);
    setShowDeleteModal(true);
  };

  // Delete job submit
  const handleDeleteJob = async () => {
    if (!selectedJob) return;
    setActionLoading(true);
    try {
      const response = await jobApi.deleteJob(selectedJob.id);
      if (!response.success) {
        throw new Error(response.error || t("jobs.errors.delete"));
      }
      showFeedback("success", t("jobs.toast.deleted", { title: selectedJob.title }));
      setShowDeleteModal(false);
      setSelectedJob(null);
      loadJobs();
    } catch (err) {
      console.error("Error deleting job:", err);
      showFeedback("error", err.response?.data?.error || t("jobs.errors.delete"));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title={t("jobs.title")}
        subtitle={t("jobs.subtitle")}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadJobs()}
              disabled={loading}
              leftIcon={<FiRefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />}
            >
              {t("common:actions.refresh")}
            </Button>
            <Button size="sm" onClick={handleOpenAdd} leftIcon={<FiPlus className="w-4 h-4" />}>
              {t("jobs.addNew")}
            </Button>
          </>
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
          placeholder={t("jobs.searchPlaceholder")}
          testId="admin-jobs-search"
        />
        <AdminFilterSelect
          value={statusFilter}
          onChange={handleStatusFilterChange}
          ariaLabel={t("jobs.filterStatusAria")}
        >
          <option value="all">{t("jobs.allStatuses")}</option>
          {JOB_STATUSES.map((value) => (
            <option key={value} value={value}>
              {label("jobStatus", value)}
            </option>
          ))}
        </AdminFilterSelect>
        <AdminFilterSelect
          value={approvalFilter}
          onChange={handleApprovalFilterChange}
          ariaLabel={t("jobs.filterApprovalAria")}
          className="md:w-56"
        >
          <option value="all">{t("jobs.allApprovals")}</option>
          {APPROVAL_STATUSES.map((value) => (
            <option key={value} value={value}>
              {label("approvalStatus", value)}
            </option>
          ))}
        </AdminFilterSelect>
      </AdminFilterBar>

      <AdminTableCard>
        {loading ? (
          <AdminLoadingState text={t("jobs.loading")} />
        ) : error ? (
          <AdminErrorState
            title={t("jobs.loadFailedTitle")}
            message={error.message || t("jobs.errors.loadDb")}
            onRetry={() => loadJobs()}
          />
        ) : jobs.length === 0 ? (
          <AdminEmptyListState
            icon={<FiBriefcase className="mx-auto" />}
            title={t("jobs.emptyTitle")}
            description={
              searchTerm || statusFilter !== "all" || approvalFilter !== "all"
                ? t("jobs.emptyFiltered")
                : t("jobs.emptyNone")
            }
            onClear={
              searchTerm || statusFilter !== "all" || approvalFilter !== "all"
                ? handleClearFilters
                : undefined
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className={ADMIN_TABLE} data-testid="admin-jobs-table">
                <thead className={ADMIN_THEAD}>
                  <tr>
                    <th className={ADMIN_TH}>{t("jobs.th.titleCompany")}</th>
                    <th className={ADMIN_TH}>{t("jobs.th.locationType")}</th>
                    <th className={ADMIN_TH}>{t("jobs.th.status")}</th>
                    <th className={ADMIN_TH}>{t("jobs.th.moderation")}</th>
                    <th className={ADMIN_TH}>{t("jobs.th.posted")}</th>
                    <th className={ADMIN_TH_RIGHT}>{t("jobs.th.actions")}</th>
                  </tr>
                </thead>
                <tbody className={ADMIN_TBODY}>
                  {jobs.map((job) => (
                    <tr key={job.id} className={ADMIN_TR}>
                      <td className={ADMIN_TD}>
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 rounded-control bg-tint text-primary-text flex items-center justify-center">
                            <FiBriefcase className="w-5 h-5" aria-hidden="true" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-ink">{job.title}</div>
                            <div className="text-sm text-muted">
                              {job.company}
                              {job.employer && (
                                <span className="text-xs ml-1">
                                  ({job.employer.name || job.employer.email})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className={ADMIN_TD}>
                        <div className="text-sm text-ink flex items-center gap-1">
                          <FiMapPin className="w-3.5 h-3.5 text-muted" aria-hidden="true" />
                          <span>{job.location}</span>
                        </div>
                        <div className="text-xs text-muted mt-0.5">
                          {label("jobType", job.type)} • {label("experienceLevel", job.experience) || t("shared.notSpecified")}
                        </div>
                      </td>
                      <td className={ADMIN_TD}>
                        <StatusBadge group="jobStatus" value={job.status} />
                      </td>
                      <td className={ADMIN_TD}>
                        <StatusBadge group="approvalStatus" value={job.approvalStatus} />
                      </td>
                      <td className={ADMIN_TD_MUTED}>
                        <div className="flex items-center gap-1.5">
                          <FiCalendar className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>
                            {job.createdAt
                              ? new Date(job.createdAt).toLocaleDateString(locale)
                              : t("shared.unknown")}
                          </span>
                        </div>
                      </td>
                      <td className={ADMIN_TD_ACTIONS}>
                        <div className="flex items-center justify-end gap-1">
                          <AdminIconButton
                            icon={FiEye}
                            label={t("jobs.actions.viewAria", { title: job.title })}
                            onClick={() => handleViewJob(job)}
                          />
                          <AdminIconButton
                            icon={FiEdit2}
                            label={t("jobs.actions.editAria", { title: job.title })}
                            onClick={() => handleOpenEdit(job)}
                          />
                          {job.approvalStatus !== "approved" && (
                            <AdminIconButton
                              icon={FiCheck}
                              tone="success"
                              label={
                                ["Closed", "inactive", "filled"].includes(job.status)
                                  ? t("jobs.actions.approveAria", { title: job.title })
                                  : t("jobs.actions.approvePublishAria", { title: job.title })
                              }
                              onClick={() => handleApproveJob(job)}
                              disabled={actionLoading}
                            />
                          )}
                          {job.approvalStatus !== "rejected" && (
                            <AdminIconButton
                              icon={FiX}
                              tone="warning"
                              label={t("jobs.actions.rejectAria", { title: job.title })}
                              onClick={() => handleRejectJob(job)}
                              disabled={actionLoading}
                            />
                          )}
                          <AdminIconButton
                            icon={FiTrash2}
                            tone="danger"
                            label={t("jobs.actions.deleteAria", { title: job.title })}
                            onClick={() => handleOpenDelete(job)}
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
              total={pagination.totalJobs}
              limit={limit}
              noun={t("jobs.noun")}
              hasPrev={pagination.hasPrev}
              hasNext={pagination.hasNext}
              loading={loading}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => p + 1)}
            />
          </>
        )}
      </AdminTableCard>

      {showViewModal && selectedJob && (
        <JobDetailsModal
          job={selectedJob}
          loading={actionLoading}
          onApprove={handleApproveJob}
          onReject={handleRejectJob}
          onClose={() => setShowViewModal(false)}
        />
      )}

      {showEditModal && selectedJob && (
        <JobFormModal
          mode="edit"
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleUpdateJob}
          onClose={() => setShowEditModal(false)}
          loading={actionLoading}
        />
      )}

      {showAddModal && (
        <JobFormModal
          mode="add"
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleCreateJob}
          onClose={() => setShowAddModal(false)}
          loading={actionLoading}
        />
      )}

      {showDeleteModal && selectedJob && (
        <AdminConfirmDeleteModal
          label={t("jobs.delete.aria")}
          title={t("jobs.delete.title")}
          confirmLabel={t("jobs.delete.confirm")}
          loading={actionLoading}
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteJob}
        >
          {t("jobs.delete.message", { title: selectedJob.title, company: selectedJob.company })}
        </AdminConfirmDeleteModal>
      )}
    </div>
  );
};

export default JobsManagement;
