import React, { useState, useEffect, useCallback } from "react";
import {
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiBriefcase,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiChevronDown,
  FiAlertCircle,
  FiCheckCircle,
  FiX,
  FiRefreshCw,
  FiGlobe,
  FiLayers,
} from "react-icons/fi";
import userApi from "../../services/userApi";
import jobApi from "../../services/jobApi";
import { Trans, useTranslation } from "react-i18next";
import { Badge, Button, PageHeader } from "../../components/ui";
import { useEnumLabel, useLocale } from "../../i18n/helpers";

const STATUS_TONES = { active: "success", inactive: "warning", blocked: "danger" };
const PLAN_TONES = { enterprise: "warning", premium: "primary", basic: "info" };
const JOB_STATUS_TONES = { active: "success", closed: "neutral" };

// Badges: API values (active, free, ...) stay as-is, only the label is translated.
const UserStatusBadge = ({ status }) => {
  const { t } = useTranslation("adminOps");
  return (
    <Badge tone={STATUS_TONES[status] || "neutral"} size="sm">
      {t(`userStatus.${status}`, { defaultValue: String(status ?? "") })}
    </Badge>
  );
};

const PlanBadge = ({ plan }) => {
  const { t } = useTranslation("adminOps");
  const key = String(plan).toLowerCase();
  return (
    <Badge tone={PLAN_TONES[key] || "neutral"} size="sm">
      {t(`employers.plan.${key}`, { defaultValue: String(plan) })}
    </Badge>
  );
};

const EmployerManagement = () => {
  const { t } = useTranslation("adminOps");
  const enumLabel = useEnumLabel();
  const locale = useLocale();
  // Query state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 10;

  // Data & loading state
  const [employers, setEmployers] = useState([]);
  const [employerJobCounts, setEmployerJobCounts] = useState({});
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals state
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Selected item state
  const [selectedEmployer, setSelectedEmployer] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [employerDetails, setEmployerDetails] = useState(null);
  const [employerJobs, setEmployerJobs] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Notification banners
  const [notification, setNotification] = useState(null);

  const showFeedback = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  // Safe JSON parser helper
  const safeParseJSON = (data) => {
    if (!data) return {};
    if (typeof data === "object") return data;
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  };

  // Load employers from backend
  const loadEmployers = useCallback(
    async (targetPage = page, search = searchTerm, status = statusFilter) => {
      setLoading(true);
      setError(null);
      try {
        const result = await userApi.getAllUsers({
          role: "employer",
          page: targetPage,
          limit,
          search,
          status,
          sortBy: "createdAt",
          sortOrder: "DESC",
        });

        const list = result.data || [];
        setEmployers(list);
        setPagination(
          result.pagination || {
            currentPage: targetPage,
            totalPages: 1,
            totalUsers: list.length,
            hasNext: false,
            hasPrev: false,
          }
        );

        // Fetch real job counts for loaded employers
        if (list.length > 0) {
          const counts = {};
          await Promise.all(
            list.map(async (emp) => {
              try {
                const res = await jobApi.getMyJobs({ employerId: emp.id, limit: 1 });
                counts[emp.id] = res.pagination?.total ?? 0;
              } catch {
                counts[emp.id] = 0;
              }
            })
          );
          setEmployerJobCounts(counts);
        } else {
          setEmployerJobCounts({});
        }
      } catch (err) {
        console.error("Error loading employers:", err);
        setError(err.response?.data?.error || err.message || t("employers.errors.load"));
      } finally {
        setLoading(false);
      }
    },
    [page, searchTerm, statusFilter, t]
  );

  // Debounced search / filter trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      loadEmployers(page, searchTerm, statusFilter);
    }, 300);

    return () => clearTimeout(timer);
  }, [loadEmployers, page, searchTerm, statusFilter]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setPage(1);
  };

  // Status / plan badges live at module level (UserStatusBadge, PlanBadge).

  // View employer full details
  const handleViewEmployer = async (employer) => {
    setSelectedEmployer(employer);
    setShowDetailsModal(true);
    setDetailsLoading(true);
    try {
      const [userRes, jobsRes] = await Promise.allSettled([
        userApi.getUserById(employer.id),
        jobApi.getMyJobs({ employerId: employer.id, limit: 10 }),
      ]);

      if (userRes.status === "fulfilled" && userRes.value?.data) {
        setEmployerDetails(userRes.value.data);
      } else {
        setEmployerDetails(employer);
      }

      if (jobsRes.status === "fulfilled" && jobsRes.value?.data) {
        setEmployerJobs(jobsRes.value.data);
      } else {
        setEmployerJobs([]);
      }
    } catch (err) {
      console.error("Error loading employer details:", err);
      setEmployerDetails(employer);
      setEmployerJobs([]);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Status modal
  const openStatusModal = (employer) => {
    setSelectedEmployer(employer);
    setNewStatus(employer.status);
    setShowStatusModal(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedEmployer || !newStatus) return;
    setActionLoading(true);
    try {
      await userApi.updateUserStatus(selectedEmployer.id, newStatus);
      showFeedback(
        "success",
        t("employers.feedback.statusUpdated", {
          name: selectedEmployer.name,
          status: t(`userStatus.${newStatus}`, { defaultValue: newStatus }),
        })
      );
      setShowStatusModal(false);
      setSelectedEmployer(null);
      loadEmployers();
    } catch (err) {
      console.error("Error updating employer status:", err);
      showFeedback("error", err.response?.data?.error || t("employers.errors.updateStatus"));
    } finally {
      setActionLoading(false);
    }
  };

  // Delete modal
  const openDeleteModal = (employer) => {
    setSelectedEmployer(employer);
    setShowDeleteModal(true);
  };

  const handleDeleteEmployer = async () => {
    if (!selectedEmployer) return;
    setActionLoading(true);
    try {
      await userApi.deleteUser(selectedEmployer.id);
      showFeedback("success", t("employers.feedback.deleted", { name: selectedEmployer.name }));
      setShowDeleteModal(false);
      setSelectedEmployer(null);
      loadEmployers();
    } catch (err) {
      console.error("Error deleting employer:", err);
      showFeedback("error", err.response?.data?.error || t("employers.errors.delete"));
    } finally {
      setActionLoading(false);
    }
  };

  const parsedModalCompany = employerDetails
    ? safeParseJSON(employerDetails.employerDetails)
    : {};

  return (
    <div className="space-y-5">
      {/* Header */}
      <PageHeader
        title={t("employers.title")}
        subtitle={t("employers.subtitle")}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadEmployers()}
            disabled={loading}
            leftIcon={<FiRefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />}
          >
            {t("common:actions.refresh")}
          </Button>
        }
      />

      {/* Notification Banner */}
      {notification && (
        <div
          role="alert"
          className={`flex items-center justify-between p-4 rounded-lg  text-sm border ${
            notification.type === "success"
              ? "bg-success/10 text-success border-success/30"
              : "bg-danger/10 text-danger border-danger/30"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <FiCheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <FiAlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-muted hover:text-ink"
            aria-label={t("employers.dismiss")}
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-surface rounded-card shadow-card border border-tint-line p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted w-4 h-4" />
            <input
              type="text"
              placeholder={t("employers.searchPlaceholder")}
              aria-label={t("employers.searchPlaceholder")}
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-10 py-2 text-sm border border-line rounded-lg bg-surface text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted hover:text-ink"
                aria-label={t("employers.clearSearch")}
              >
                <FiX className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-56 relative">
            <select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              aria-label={t("employers.statusFilterLabel")}
              className="w-full appearance-none bg-surface border border-line rounded-lg px-4 py-2 pr-8 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">{t("employers.allStatuses")}</option>
              <option value="active">{t("userStatus.active")}</option>
              <option value="inactive">{t("userStatus.inactive")}</option>
              <option value="blocked">{t("userStatus.blocked")}</option>
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted pointer-events-none w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Employers Table */}
      <div className="bg-surface rounded-card shadow-card border border-tint-line overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-3" />
            <p className="text-sm text-muted">{t("employers.loading")}</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <FiAlertCircle className="w-10 h-10 text-danger mx-auto mb-3" />
            <p className="text-base font-semibold text-ink">{t("employers.loadErrorTitle")}</p>
            <p className="text-sm text-danger mt-1 mb-4">{error}</p>
            <Button size="sm" onClick={() => loadEmployers()}>
              {t("common:states.retry")}
            </Button>
          </div>
        ) : employers.length === 0 ? (
          <div className="p-12 text-center">
            <FiBriefcase className="w-12 h-12 text-muted mx-auto mb-3" />
            <p className="text-base font-medium text-ink">{t("employers.emptyTitle")}</p>
            <p className="text-sm text-muted mt-1 mb-4">
              {searchTerm || statusFilter !== "all"
                ? t("employers.emptyFiltered")
                : t("employers.emptyAll")}
            </p>
            {(searchTerm || statusFilter !== "all") && (
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                {t("common:actions.clearFilters")}
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-line">
                <thead className="bg-tint">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                      {t("employers.table.employer")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                      {t("employers.table.company")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                      {t("employers.table.status")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                      {t("employers.table.jobsPosted")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                      {t("employers.table.plan")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                      {t("employers.table.joined")}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-muted uppercase tracking-wider">
                      {t("employers.table.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-surface divide-y divide-line">
                  {employers.map((employer) => {
                    const parsedDetails = safeParseJSON(employer.employerDetails);
                    const companyName =
                      parsedDetails.company || employer.company || t("employers.notSpecified");
                    const jobsCount = employerJobCounts[employer.id] ?? "...";
                    const plan = employer.subscriptionPlan || "free";

                    return (
                      <tr
                        key={employer.id}
                        className="hover:bg-tint transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0 rounded-full bg-primary-50 dark:bg-primary-900/40 text-primary-text flex items-center justify-center font-bold text-sm">
                              {employer.name ? employer.name.charAt(0).toUpperCase() : "E"}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-ink">
                                {employer.name}
                              </div>
                              <div className="text-sm text-muted flex items-center gap-1">
                                <FiMail className="w-3.5 h-3.5" />
                                <span>{employer.email}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-ink font-medium">
                          {companyName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <UserStatusBadge status={employer.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-ink">
                          <div className="flex items-center gap-1.5">
                            <FiBriefcase className="w-3.5 h-3.5 text-muted" />
                            <span>{jobsCount}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <PlanBadge plan={plan} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                          <div className="flex items-center gap-1.5">
                            <FiCalendar className="w-3.5 h-3.5 text-muted" />
                            <span>
                              {employer.createdAt
                                ? new Date(employer.createdAt).toLocaleDateString(locale)
                                : t("employers.unknown")}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleViewEmployer(employer)}
                              className="p-1.5 text-primary-text rounded hover:bg-tint"
                              title={t("employers.table.viewTitle")}
                              aria-label={t("employers.table.viewAria", { name: employer.name })}
                            >
                              <FiEye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openStatusModal(employer)}
                              className="p-1.5 text-warning rounded hover:bg-warning/10"
                              title={t("employers.table.statusTitle")}
                              aria-label={t("employers.table.statusAria", { name: employer.name })}
                            >
                              <FiEdit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openDeleteModal(employer)}
                              className="p-1.5 text-danger rounded hover:bg-danger/10"
                              title={t("employers.table.deleteTitle")}
                              aria-label={t("employers.table.deleteAria", { name: employer.name })}
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="px-6 py-4 bg-tint border-t border-line flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-ink">
                {t("employers.pagination.showing", {
                  from: (pagination.currentPage - 1) * limit + 1,
                  to: Math.min(pagination.currentPage * limit, pagination.totalUsers),
                  total: pagination.totalUsers,
                })}
              </div>

              <div className="inline-flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!pagination.hasPrev || pagination.currentPage <= 1 || loading}
                  className="px-3 py-1.5 text-sm font-medium rounded-md border border-line bg-surface text-ink hover:bg-tint disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {t("employers.pagination.previous")}
                </button>
                <span className="text-sm text-muted px-2">
                  {t("employers.pagination.pageOf", {
                    page: pagination.currentPage,
                    total: Math.max(1, pagination.totalPages),
                  })}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!pagination.hasNext || pagination.currentPage >= pagination.totalPages || loading}
                  className="px-3 py-1.5 text-sm font-medium rounded-md border border-line bg-surface text-ink hover:bg-tint disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {t("employers.pagination.next")}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Employer Details Modal */}
      {showDetailsModal && selectedEmployer && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={t("employers.details.ariaLabel")}>
          <div className="relative bg-surface rounded-xl max-w-3xl w-full p-6 shadow-xl border border-line">
            <div className="flex items-center justify-between pb-4 border-b border-line">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary-50 dark:bg-primary-900/40 text-primary-text flex items-center justify-center font-bold">
                  {selectedEmployer.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-ink">
                    {parsedModalCompany.company || selectedEmployer.company || selectedEmployer.name}
                  </h3>
                  <p className="text-xs text-muted">
                    {t("employers.details.account", { id: selectedEmployer.id, email: selectedEmployer.email })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setEmployerDetails(null);
                  setEmployerJobs([]);
                }}
                className="text-muted hover:text-ink"
                aria-label={t("employers.details.close")}
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {detailsLoading ? (
              <div className="py-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-2" />
                <p className="text-sm text-muted">{t("employers.details.loading")}</p>
              </div>
            ) : (
              <div className="mt-4 space-y-6 max-h-[70vh] overflow-y-auto pr-1">
                {/* Company & Account Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Company Info Box */}
                  <div className="bg-tint p-4 rounded-lg space-y-3 border border-line">
                    <h4 className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
                      <FiBriefcase className="w-4 h-4 text-primary-text" />
                      {t("employers.details.companyDetails")}
                    </h4>
                    <div>
                      <span className="text-xs text-muted">{t("employers.details.companyName")}</span>
                      <p className="text-sm font-semibold text-ink">
                        {parsedModalCompany.company || selectedEmployer.company || t("employers.notSpecified")}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-muted">{t("employers.details.industry")}</span>
                      <p className="text-sm text-ink">
                        {parsedModalCompany.industry || t("employers.notSpecified")}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-muted">{t("employers.details.companySize")}</span>
                      <p className="text-sm text-ink">
                        {parsedModalCompany.companySize || t("employers.notSpecified")}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-muted">{t("employers.details.website")}</span>
                      <p className="text-sm text-primary-text">
                        {parsedModalCompany.website || selectedEmployer.website ? (
                          <a
                            href={parsedModalCompany.website || selectedEmployer.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline flex items-center gap-1"
                          >
                            <FiGlobe className="w-3.5 h-3.5" />
                            {parsedModalCompany.website || selectedEmployer.website}
                          </a>
                        ) : (
                          t("employers.notSpecified")
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Account & Subscription Box */}
                  <div className="bg-tint p-4 rounded-lg space-y-3 border border-line">
                    <h4 className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
                      <FiLayers className="w-4 h-4 text-warning" />
                      {t("employers.details.accountSub")}
                    </h4>
                    <div>
                      <span className="text-xs text-muted">{t("employers.details.contact")}</span>
                      <p className="text-sm font-medium text-ink">
                        {selectedEmployer.name}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-muted">{t("employers.details.emailPhone")}</span>
                      <p className="text-sm text-ink flex items-center gap-1">
                        <FiMail className="w-3 h-3 text-muted" /> {selectedEmployer.email}
                      </p>
                      {selectedEmployer.phone && (
                        <p className="text-xs text-muted flex items-center gap-1 mt-0.5">
                          <FiPhone className="w-3 h-3 text-muted" /> {selectedEmployer.phone}
                        </p>
                      )}
                    </div>
                    <div>
                      <span className="text-xs text-muted">{t("employers.details.status")}</span>
                      <div className="mt-0.5">
                        <UserStatusBadge status={selectedEmployer.status} />
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-muted">{t("employers.details.plan")}</span>
                      <div className="mt-0.5 flex items-center gap-2">
                        <PlanBadge plan={selectedEmployer.subscriptionPlan || "free"} />
                        <span className="text-xs text-muted">
                          {selectedEmployer.subscriptionExpires
                            ? t("employers.details.expires", {
                                date: new Date(selectedEmployer.subscriptionExpires).toLocaleDateString(locale),
                              })
                            : t("employers.details.noExpiry")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Company Bio / Description */}
                {(employerDetails?.bio || selectedEmployer.bio) && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                      {t("employers.details.bio")}
                    </h4>
                    <p className="text-sm text-ink bg-tint p-3 rounded-lg border border-line">
                      {employerDetails?.bio || selectedEmployer.bio}
                    </p>
                  </div>
                )}

                {/* Job Postings History from real backend */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold text-muted uppercase tracking-wider">
                      {t("employers.details.recentJobs", { n: employerJobs.length })}
                    </h4>
                    <span className="text-xs text-muted">
                      {t("employers.details.totalPosted", {
                        n: employerJobCounts[selectedEmployer.id] ?? employerJobs.length,
                      })}
                    </span>
                  </div>

                  {employerJobs.length > 0 ? (
                    <div className="space-y-2">
                      {employerJobs.map((job) => (
                        <div
                          key={job.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-tint border border-line text-sm"
                        >
                          <div>
                            <p className="font-semibold text-ink">
                              {job.title}
                            </p>
                            <p className="text-xs text-muted flex items-center gap-2 mt-0.5">
                              {job.location && (
                                <span className="flex items-center gap-1">
                                  <FiMapPin className="w-3 h-3" />
                                  {job.location}
                                </span>
                              )}
                              <span>• {enumLabel("jobType", job.type || "Full-time")}</span>
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge tone={JOB_STATUS_TONES[job.status] || "warning"} size="sm">
                              {t(`reports.jobs.status.${String(job.status).toLowerCase()}`, {
                                defaultValue: enumLabel("jobStatus", job.status),
                              })}
                            </Badge>
                            <p className="text-[11px] text-muted mt-0.5">
                              {job.createdAt
                                ? new Date(job.createdAt).toLocaleDateString(locale)
                                : ""}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted italic bg-tint p-4 rounded-lg text-center">
                      {t("employers.details.noJobs")}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-line flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowDetailsModal(false);
                  setEmployerDetails(null);
                  setEmployerJobs([]);
                }}
              >
                {t("employers.details.closeButton")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Modal */}
      {showStatusModal && selectedEmployer && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={t("employers.statusModal.ariaLabel")}>
          <div className="relative bg-surface rounded-xl max-w-md w-full p-6 shadow-xl border border-line">
            <h3 className="text-lg font-bold text-ink mb-2">
              {t("employers.statusModal.title")}
            </h3>
            <p className="text-sm text-muted mb-4">
              <Trans
                i18nKey="employers.statusModal.description"
                ns="adminOps"
                values={{ name: selectedEmployer.name }}
                components={{ strong: <strong className="text-ink" /> }}
              />
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-ink mb-1 uppercase tracking-wider">
                {t("employers.statusModal.accountStatus")}
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-line rounded-lg bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="active">{t("employers.statusModal.optionActive")}</option>
                <option value="inactive">{t("employers.statusModal.optionInactive")}</option>
                <option value="blocked">{t("employers.statusModal.optionBlocked")}</option>
              </select>
            </div>

            {newStatus === "blocked" && (
              <div className="p-3 mb-4 rounded-lg bg-danger/10 border border-danger/30 text-xs text-danger flex items-center gap-2">
                <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{t("employers.statusModal.blockedWarning")}</span>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-line">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowStatusModal(false)}
                disabled={actionLoading}
              >
                {t("common:actions.cancel")}
              </Button>
              <Button
                size="sm"
                onClick={handleUpdateStatus}
                disabled={newStatus === selectedEmployer.status}
                loading={actionLoading}
              >
                {t("employers.statusModal.confirm")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Employer Modal */}
      {showDeleteModal && selectedEmployer && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={t("employers.deleteModal.ariaLabel")}>
          <div className="relative bg-surface rounded-xl max-w-md w-full p-6 shadow-xl border border-line">
            <div className="flex items-center gap-3 text-danger mb-3">
              <FiAlertCircle className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-lg font-bold text-ink">
                {t("employers.deleteModal.title")}
              </h3>
            </div>
            <p className="text-sm text-muted mb-4">
              <Trans
                i18nKey="employers.deleteModal.body"
                ns="adminOps"
                values={{ name: selectedEmployer.name, email: selectedEmployer.email }}
                components={{ strong: <strong className="text-ink" /> }}
              />
            </p>

            <div className="flex justify-end gap-3 pt-3 border-t border-line">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteModal(false)}
                disabled={actionLoading}
              >
                {t("common:actions.cancel")}
              </Button>
              <Button variant="danger" size="sm" onClick={handleDeleteEmployer} loading={actionLoading}>
                {t("employers.deleteModal.confirm")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployerManagement;
