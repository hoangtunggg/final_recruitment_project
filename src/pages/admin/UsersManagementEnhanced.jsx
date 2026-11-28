import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  FiEdit2,
  FiTrash2,
  FiEye,
  FiShield,
  FiUser,
  FiMail,
  FiCalendar,
  FiMapPin,
  FiClock,
  FiRefreshCw,
} from "react-icons/fi";
import userApi from "../../services/userApi";
import { Button } from "../../components/ui";
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
import UserDetailsModal from "../../components/admin/users/UserDetailsModal";
import { UserRoleBadge, UserStatusBadge } from "../../components/admin/users/UserBadges";
import { UserRoleModal, UserStatusModal } from "../../components/admin/users/UserRoleStatusModals";

const USER_ROLES = ["jobseeker", "employer", "admin"];
const USER_STATUSES = ["active", "inactive", "blocked"];

const UsersManagementEnhanced = () => {
  const { t } = useTranslation("admin");
  const label = useEnumLabel();
  const locale = useLocale();

  // Server-side query state
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 10;

  // Data & loading state
  const [users, setUsers] = useState([]);
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
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Selected item state
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [userDetails, setUserDetails] = useState(null);
  const [userActivity, setUserActivity] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Success / error banner
  const { notification, showFeedback, dismiss } = useAdminFeedback();

  // Fetch users from server
  const loadUsers = useCallback(
    async (targetPage = page, search = searchTerm, role = roleFilter, status = statusFilter) => {
      setLoading(true);
      setError(null);
      try {
        const result = await userApi.getAllUsers({
          page: targetPage,
          limit,
          search,
          role,
          status,
          sortBy: "createdAt",
          sortOrder: "DESC",
        });

        setUsers(result.data || []);
        setPagination(
          result.pagination || {
            currentPage: targetPage,
            totalPages: 1,
            totalUsers: (result.data || []).length,
            hasNext: false,
            hasPrev: false,
          }
        );
      } catch (err) {
        console.error("Error loading users:", err);
        setError({ message: err.response?.data?.error || err.message || "" });
      } finally {
        setLoading(false);
      }
    },
    [page, searchTerm, roleFilter, statusFilter]
  );

  // Debounced search / filter trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers(page, searchTerm, roleFilter, statusFilter);
    }, 300);

    return () => clearTimeout(timer);
  }, [loadUsers, page, searchTerm, roleFilter, statusFilter]);

  // Handlers for filter controls (always reset to page 1)
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleRoleChange = (e) => {
    setRoleFilter(e.target.value);
    setPage(1);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setRoleFilter("all");
    setStatusFilter("all");
    setPage(1);
  };


  // View user details
  const handleViewUser = async (user) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
    setDetailsLoading(true);
    try {
      const [detailsRes, activityRes] = await Promise.allSettled([
        userApi.getUserById(user.id),
        userApi.getUserActivity(user.id),
      ]);

      if (detailsRes.status === "fulfilled" && detailsRes.value?.data) {
        setUserDetails(detailsRes.value.data);
      } else {
        setUserDetails(user);
      }

      if (activityRes.status === "fulfilled" && activityRes.value?.data) {
        setUserActivity(activityRes.value.data);
      } else {
        setUserActivity(null);
      }
    } catch (err) {
      console.error("Error fetching user details modal:", err);
      setUserDetails(user);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Open role modal
  const openRoleModal = (user) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setShowRoleModal(true);
  };

  // Submit role update
  const handleUpdateRole = async () => {
    if (!selectedUser || !newRole) return;
    setActionLoading(true);
    try {
      await userApi.updateUserRole(selectedUser.id, newRole);
      showFeedback(
        "success",
        t("users.toast.roleUpdated", { name: selectedUser.name, role: label("userRole", newRole) })
      );
      setShowRoleModal(false);
      setSelectedUser(null);
      loadUsers();
    } catch (err) {
      console.error("Error updating user role:", err);
      showFeedback("error", err.response?.data?.error || t("users.errors.role"));
    } finally {
      setActionLoading(false);
    }
  };

  // Open status modal
  const openStatusModal = (user) => {
    setSelectedUser(user);
    setNewStatus(user.status);
    setShowStatusModal(true);
  };

  // Submit status update
  const handleUpdateStatus = async () => {
    if (!selectedUser || !newStatus) return;
    setActionLoading(true);
    try {
      await userApi.updateUserStatus(selectedUser.id, newStatus);
      showFeedback(
        "success",
        t("users.toast.statusUpdated", {
          name: selectedUser.name,
          status: t(`users.status.${newStatus}`, { defaultValue: newStatus }),
        })
      );
      setShowStatusModal(false);
      setSelectedUser(null);
      loadUsers();
    } catch (err) {
      console.error("Error updating user status:", err);
      showFeedback("error", err.response?.data?.error || t("users.errors.status"));
    } finally {
      setActionLoading(false);
    }
  };

  // Open delete modal
  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  // Submit delete user
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await userApi.deleteUser(selectedUser.id);
      showFeedback(
        "success",
        t("users.toast.deleted", { name: selectedUser.name, email: selectedUser.email })
      );
      setShowDeleteModal(false);
      setSelectedUser(null);
      loadUsers();
    } catch (err) {
      console.error("Error deleting user:", err);
      showFeedback("error", err.response?.data?.error || t("users.errors.delete"));
    } finally {
      setActionLoading(false);
    }
  };


  const closeDetails = () => {
    setShowDetailsModal(false);
    setUserDetails(null);
    setUserActivity(null);
  };
  const hasFilters = searchTerm || roleFilter !== "all" || statusFilter !== "all";

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title={t("users.title")}
        subtitle={t("users.subtitle")}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadUsers()}
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
          placeholder={t("users.searchPlaceholder")}
          testId="admin-users-search"
        />
        <AdminFilterSelect value={roleFilter} onChange={handleRoleChange} ariaLabel={t("users.filterRoleAria")}>
          <option value="all">{t("users.allRoles")}</option>
          {USER_ROLES.map((value) => (
            <option key={value} value={value}>
              {label("userRole", value)}
            </option>
          ))}
        </AdminFilterSelect>
        <AdminFilterSelect
          value={statusFilter}
          onChange={handleStatusFilterChange}
          ariaLabel={t("users.filterStatusAria")}
        >
          <option value="all">{t("users.allStatuses")}</option>
          {USER_STATUSES.map((value) => (
            <option key={value} value={value}>
              {t(`users.status.${value}`)}
            </option>
          ))}
        </AdminFilterSelect>
      </AdminFilterBar>

      <AdminTableCard>
        {loading ? (
          <AdminLoadingState text={t("users.loading")} />
        ) : error ? (
          <AdminErrorState
            title={t("users.loadFailedTitle")}
            message={error.message || t("users.errors.loadDb")}
            onRetry={() => loadUsers()}
          />
        ) : users.length === 0 ? (
          <AdminEmptyListState
            icon={<FiUser className="mx-auto" />}
            title={t("users.emptyTitle")}
            description={hasFilters ? t("users.emptyFiltered") : t("users.emptyNone")}
            onClear={hasFilters ? handleClearFilters : undefined}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className={ADMIN_TABLE} data-testid="admin-users-table">
                <thead className={ADMIN_THEAD}>
                  <tr>
                    <th className={ADMIN_TH}>{t("users.th.user")}</th>
                    <th className={ADMIN_TH}>{t("users.th.role")}</th>
                    <th className={ADMIN_TH}>{t("users.th.status")}</th>
                    <th className={ADMIN_TH}>{t("users.th.joined")}</th>
                    <th className={ADMIN_TH}>{t("users.th.lastLogin")}</th>
                    <th className={ADMIN_TH_RIGHT}>{t("users.th.actions")}</th>
                  </tr>
                </thead>
                <tbody className={ADMIN_TBODY}>
                  {users.map((user) => (
                    <tr key={user.id} className={ADMIN_TR}>
                      <td className={ADMIN_TD}>
                        <div className="flex items-center">
                          <AdminAvatar name={user.name} />
                          <div className="ml-4">
                            <div className="text-sm font-medium text-ink">{user.name}</div>
                            <div className="text-sm text-muted flex items-center gap-1">
                              <FiMail className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>{user.email}</span>
                            </div>
                            {user.location && (
                              <div className="text-xs text-muted flex items-center gap-1 mt-0.5">
                                <FiMapPin className="w-3 h-3" aria-hidden="true" />
                                <span>{user.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className={ADMIN_TD}>
                        <UserRoleBadge role={user.role} />
                      </td>
                      <td className={ADMIN_TD}>
                        <UserStatusBadge status={user.status} />
                      </td>
                      <td className={ADMIN_TD_MUTED}>
                        <div className="flex items-center gap-1.5">
                          <FiCalendar className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>
                            {user.createdAt
                              ? new Date(user.createdAt).toLocaleDateString(locale)
                              : t("shared.unknown")}
                          </span>
                        </div>
                      </td>
                      <td className={ADMIN_TD_MUTED}>
                        <div className="flex items-center gap-1.5">
                          <FiClock className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>
                            {user.lastLogin
                              ? new Date(user.lastLogin).toLocaleDateString(locale)
                              : t("users.never")}
                          </span>
                        </div>
                      </td>
                      <td className={ADMIN_TD_ACTIONS}>
                        <div className="flex items-center justify-end gap-1">
                          <AdminIconButton
                            icon={FiEye}
                            label={t("users.actions.viewAria", { name: user.name })}
                            onClick={() => handleViewUser(user)}
                          />
                          <AdminIconButton
                            icon={FiShield}
                            label={t("users.actions.changeRoleAria", { name: user.name })}
                            onClick={() => openRoleModal(user)}
                          />
                          <AdminIconButton
                            icon={FiEdit2}
                            tone="warning"
                            label={t("users.actions.changeStatusAria", { name: user.name })}
                            onClick={() => openStatusModal(user)}
                          />
                          <AdminIconButton
                            icon={FiTrash2}
                            tone="danger"
                            label={t("users.actions.deleteAria", { name: user.name })}
                            onClick={() => openDeleteModal(user)}
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
              total={pagination.totalUsers}
              limit={limit}
              noun={t("users.noun")}
              hasPrev={pagination.hasPrev}
              hasNext={pagination.hasNext}
              loading={loading}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => p + 1)}
            />
          </>
        )}
      </AdminTableCard>

      {showDetailsModal && selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          details={userDetails}
          activity={userActivity}
          loading={detailsLoading}
          onClose={closeDetails}
        />
      )}

      {showRoleModal && selectedUser && (
        <UserRoleModal
          user={selectedUser}
          role={newRole}
          setRole={setNewRole}
          loading={actionLoading}
          onCancel={() => setShowRoleModal(false)}
          onConfirm={handleUpdateRole}
        />
      )}

      {showStatusModal && selectedUser && (
        <UserStatusModal
          user={selectedUser}
          status={newStatus}
          setStatus={setNewStatus}
          loading={actionLoading}
          onCancel={() => setShowStatusModal(false)}
          onConfirm={handleUpdateStatus}
        />
      )}

      {showDeleteModal && selectedUser && (
        <AdminConfirmDeleteModal
          label={t("users.delete.aria")}
          title={t("users.delete.title")}
          confirmLabel={t("users.delete.confirm")}
          loading={actionLoading}
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteUser}
        >
          {t("users.delete.message", { name: selectedUser.name, email: selectedUser.email })}
        </AdminConfirmDeleteModal>
      )}
    </div>
  );
};

export default UsersManagementEnhanced;
