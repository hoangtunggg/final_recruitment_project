import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import DashboardStats from "../../components/admin/DashboardStats";
import AuditActionBadge from "../../components/admin/AuditActionBadge";
import { Badge, Button, Card, PageHeader } from "../../components/ui";
import { API_URL } from "../../utils/apiConfig";
import auditService from "../../services/auditService";
import { useEnumLabel, useLocale } from "../../i18n/helpers";
import {
  FiRefreshCw,
  FiActivity,
  FiUser,
  FiAlertCircle,
  FiCheckCircle,
  FiArrowRight,
  FiClock,
} from "react-icons/fi";

const ROLE_TONES = { admin: "primary", employer: "warning", jobseeker: "info" };

const AdminDashboard = () => {
  const { t } = useTranslation("adminOps");
  const enumLabel = useEnumLabel();
  const locale = useLocale();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalJobs: 0,
    totalApplications: 0,
    recentActivity: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    blockedUsers: 0,
    roleStats: [],
    recentUsers: [],
    registrationTrend: [],
  });
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const [statsRes, auditRes] = await Promise.allSettled([
        fetch(`${API_URL}/users/statistics`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        auditService.getAuditLogs({ limit: 10 }),
      ]);

      if (statsRes.status === "fulfilled" && statsRes.value.ok) {
        const statsData = await statsRes.value.json();
        if (statsData.success && statsData.data) {
          setStats(statsData.data);
        }
      } else if (statsRes.status === "rejected" || (statsRes.value && !statsRes.value.ok)) {
        console.warn("Failed to retrieve user statistics from server");
      }

      if (auditRes.status === "fulfilled" && auditRes.value?.success) {
        setAuditLogs(auditRes.value.data?.logs || []);
      } else {
        console.warn("Failed to retrieve audit trail from server");
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError(t("dashboard.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const userLabel = (id) => t("dashboard.audit.userId", { id });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("dashboard.title")}
        subtitle={t("dashboard.subtitle")}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboardData}
            disabled={loading}
            title={t("dashboard.refreshTitle")}
            leftIcon={<FiRefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />}
          >
            {loading ? t("dashboard.refreshing") : t("dashboard.refresh")}
          </Button>
        }
      />

      {error && (
        <div
          role="alert"
          className="p-4 bg-danger/10 border border-danger/30 rounded-card flex items-center justify-between gap-3"
        >
          <div className="flex items-center space-x-3">
            <FiAlertCircle className="w-5 h-5 text-danger flex-shrink-0" />
            <p className="text-sm text-danger">{error}</p>
          </div>
          <Button variant="danger" size="sm" onClick={fetchDashboardData}>
            {t("common:states.retry")}
          </Button>
        </div>
      )}

      <DashboardStats stats={stats} loading={loading} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Audit trail (2 cols) */}
        <Card padding="none" className="lg:col-span-2 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-line flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FiActivity className="w-5 h-5 text-primary-text" />
              <h2 className="text-base font-semibold text-ink">{t("dashboard.audit.title")}</h2>
            </div>
            <Link
              to="/admin/reports"
              className="text-xs font-medium text-primary-text hover:underline inline-flex items-center whitespace-nowrap flex-shrink-0 ml-2"
            >
              {t("dashboard.audit.viewAll")}
              <FiArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          <div className="p-6 flex-1">
            {loading && auditLogs.length === 0 ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="p-3 bg-tint rounded-lg animate-pulse h-16"></div>
                ))}
              </div>
            ) : auditLogs.length > 0 ? (
              <div className="space-y-3">
                {auditLogs.map((log) => {
                  const performedBy =
                    log.performedByUser?.name ||
                    log.performedByUser?.email ||
                    (log.performedBy ? userLabel(log.performedBy) : t("dashboard.audit.system"));
                  const targetUser =
                    log.targetUser?.name ||
                    log.targetUser?.email ||
                    (log.targetUserId ? userLabel(log.targetUserId) : null);

                  return (
                    <div
                      key={log.id}
                      className="p-3.5 bg-tint rounded-lg border border-line flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-colors hover:border-tint-line"
                    >
                      <div className="flex items-start space-x-3">
                        <AuditActionBadge action={log.action} className="mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-ink">
                            {log.details || log.action?.replace(/_/g, " ")}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-muted mt-1">
                            <span>
                              {t("dashboard.audit.by")}: <strong className="font-medium text-ink">{performedBy}</strong>
                            </span>
                            {targetUser && (
                              <span>
                                • {t("dashboard.audit.target")}: <strong className="font-medium text-ink">{targetUser}</strong>
                              </span>
                            )}
                            {log.ipAddress && (
                              <span className="hidden md:inline">
                                • {t("dashboard.audit.ip")}: {log.ipAddress}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center text-[11px] text-muted sm:text-right flex-shrink-0">
                        <FiClock className="w-3 h-3 mr-1" aria-hidden="true" />
                        {new Date(log.createdAt).toLocaleString(locale, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <FiCheckCircle className="mx-auto h-10 w-10 text-muted mb-2" aria-hidden="true" />
                <p className="text-sm font-medium text-ink">{t("dashboard.audit.emptyTitle")}</p>
                <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
                  {t("dashboard.audit.emptyDesc")}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Recent registrations (1 col) */}
        <Card padding="none" className="overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-line flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FiUser className="w-5 h-5 text-primary-text" />
              <h2 className="text-base font-semibold text-ink">{t("dashboard.recent.title")}</h2>
            </div>
            <Link
              to="/admin/users"
              className="text-xs font-medium text-primary-text hover:underline inline-flex items-center whitespace-nowrap flex-shrink-0 ml-2"
            >
              {t("dashboard.recent.all")}
              <FiArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          <div className="p-6 flex-1">
            {loading && (!stats.recentUsers || stats.recentUsers.length === 0) ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-3 bg-tint rounded-lg animate-pulse h-14"></div>
                ))}
              </div>
            ) : stats.recentUsers && stats.recentUsers.length > 0 ? (
              <div className="divide-y divide-line">
                {stats.recentUsers.map((u) => {
                  const initials = u.name
                    ? u.name
                        .trim()
                        .split(/\s+/)
                        .map((p) => p[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()
                    : "U";

                  return (
                    <div
                      key={u.id}
                      className="py-3 flex items-center justify-between first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-900/40 text-primary-text font-semibold text-xs flex items-center justify-center flex-shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-ink truncate">
                            {u.name || t("dashboard.recent.unnamed")}
                          </p>
                          <p className="text-[11px] text-muted truncate">{u.email}</p>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0 ml-2">
                        <Badge tone={ROLE_TONES[(u.role || "").toLowerCase()] || "neutral"} size="sm">
                          {enumLabel("userRole", u.role)}
                        </Badge>
                        <p className="text-[10px] text-muted mt-0.5">
                          {new Date(u.createdAt).toLocaleDateString(locale, {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10">
                <FiUser className="mx-auto h-8 w-8 text-muted mb-2" aria-hidden="true" />
                <p className="text-xs text-muted">{t("dashboard.recent.empty")}</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
