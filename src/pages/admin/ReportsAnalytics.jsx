import React, { useState, useEffect, useCallback } from "react";
import {
  FiBarChart2,
  FiTrendingUp,
  FiUsers,
  FiBriefcase,
  FiFileText,
  FiDownload,
  FiCalendar,
  FiFilter,
  FiChevronDown,
  FiActivity,
  FiPieChart,
  FiClock,
  FiRefreshCw,
  FiAlertCircle,
  FiCheckCircle,
  FiShield,
  FiChevronLeft,
  FiChevronRight,
  FiInfo,
} from "react-icons/fi";
import userApi from "../../services/userApi";
import auditService from "../../services/auditService";
import { useTranslation } from "react-i18next";
import AuditActionBadge from "../../components/admin/AuditActionBadge";
import { Button, PageHeader } from "../../components/ui";
import { useEnumLabel, useLocale } from "../../i18n/helpers";

const ReportsAnalytics = () => {
  const { t } = useTranslation("adminOps");
  const enumLabel = useEnumLabel();
  const locale = useLocale();
  const [dateRange, setDateRange] = useState("30days");
  const [reportType, setReportType] = useState("overview");

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
    applicationTrend: [],
    jobStats: {
      byStatus: [],
      byApprovalStatus: [],
      byType: [],
      topAppliedJobs: [],
    },
    applicationStats: {
      byStatus: [],
    },
    periodStats: null,
  });

  const [auditLogs, setAuditLogs] = useState([]);
  const [auditPagination, setAuditPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalLogs: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [auditActionFilter, setAuditActionFilter] = useState("all");
  const [auditPage, setAuditPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  const getStartDateFromRange = (range) => {
    if (range === "all") return "";
    const daysMap = { "7days": 7, "30days": 30, "90days": 90, "1year": 365 };
    const days = daysMap[range] || 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return cutoff.toISOString();
  };

  // Load Platform Statistics
  const loadStats = useCallback(async () => {
    try {
      setError(null);
      const res = await userApi.getUserStatistics({ dateRange });
      if (res.success && res.data) {
        // Merge over the defaults: the API may omit trend / job / application sections.
        setStats((prev) => ({ ...prev, ...res.data }));
      }
    } catch (err) {
      console.error("Failed to load platform statistics:", err);
      setError(t("reports.errors.stats"));
    }
  }, [dateRange, t]);

  // Load Audit Trail
  const loadAuditLogs = useCallback(async () => {
    try {
      const startDate = getStartDateFromRange(dateRange);
      const res = await auditService.getAuditLogs({
        page: auditPage,
        limit: 15,
        action: auditActionFilter,
        startDate: startDate || undefined,
      });
      if (res.success && res.data) {
        setAuditLogs(res.data.logs || []);
        if (res.data.pagination) {
          setAuditPagination(res.data.pagination);
        }
      }
    } catch (err) {
      console.error("Failed to load audit logs:", err);
      setError(t("reports.errors.audit"));
    }
  }, [auditPage, auditActionFilter, dateRange, t]);

  // Initial and reactive load
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      if (reportType === "audit") {
        await loadAuditLogs();
      } else {
        await loadStats();
      }
      setLoading(false);
    };
    fetchData();
  }, [reportType, loadStats, loadAuditLogs]);

  const handleRefresh = async () => {
    setLoading(true);
    if (reportType === "audit") {
      await loadAuditLogs();
    } else {
      await loadStats();
    }
    setLoading(false);
    showFeedback("success", t("reports.feedback.refreshed"));
  };

  // CSV Helper for In-Browser Exports
  const downloadCsv = (filename, headers, rows, metadata = []) => {
    const escapeField = (f) => `"${String(f ?? "").replace(/"/g, '""')}"`;
    const lines = [];

    if (metadata.length > 0) {
      metadata.forEach((m) => lines.push(escapeField(m)));
      lines.push(""); // empty separator
    }

    lines.push(headers.map(escapeField).join(","));
    rows.forEach((row) => {
      lines.push(row.map(escapeField).join(","));
    });

    const blob = new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // JSON Helper for In-Browser Exports
  const downloadJson = (filename, data) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export Dispatcher
  const handleExport = async (format = "csv") => {
    setExporting(true);
    const today = new Date().toISOString().split("T")[0];

    try {
      if (reportType === "audit") {
        // Direct backend audit export stream with active filters
        const startDate = getStartDateFromRange(dateRange);
        await auditService.exportLogs({
          action: auditActionFilter,
          startDate: startDate || undefined,
          format: "csv",
        });
        showFeedback("success", t("reports.feedback.auditExported"));
        setExporting(false);
        return;
      }

      if (format === "json") {
        const payload = {
          reportType,
          dateRange,
          exportedAt: new Date().toISOString(),
          stats,
        };
        downloadJson(`admin-report-${reportType}-${today}.json`, payload);
        showFeedback("success", t("reports.feedback.jsonExported"));
        setExporting(false);
        return;
      }

      // Format CSV based on active report
      const meta = [
        t("reports.csv.title", { type: t(`reports.tabs.${reportType}`) }),
        t("reports.csv.generated", { date: new Date().toLocaleString(locale) }),
        t("reports.csv.range", { range: t(`reports.range.${dateRange}`) }),
        t("reports.csv.totals", {
          users: stats.totalUsers,
          jobs: stats.totalJobs,
          apps: stats.totalApplications,
        }),
      ];
      const within = t("reports.csv.within", { range: t(`reports.range.${dateRange}`) });

      if (reportType === "overview") {
        const headers = [t("reports.csv.metric"), t("reports.csv.value"), t("reports.csv.notes")];
        const rows = [
          [t("reports.csv.totalUsers"), stats.totalUsers, t("reports.csv.totalUsersNote")],
          [t("reports.csv.activeUsers"), stats.activeUsers, t("reports.csv.activeUsersNote")],
          [t("reports.csv.inactiveUsers"), stats.inactiveUsers, t("reports.csv.inactiveUsersNote")],
          [t("reports.csv.blockedUsers"), stats.blockedUsers, t("reports.csv.blockedUsersNote")],
          [t("reports.csv.totalJobs"), stats.totalJobs, t("reports.csv.totalJobsNote")],
          [t("reports.csv.totalApplications"), stats.totalApplications, t("reports.csv.totalApplicationsNote")],
          [t("reports.csv.recent"), stats.recentActivity, t("reports.csv.recentNote")],
        ];

        if (stats.periodStats) {
          rows.push(
            [t("reports.csv.newUsers"), stats.periodStats.newUsers, within],
            [t("reports.csv.newJobs"), stats.periodStats.newJobs, within],
            [t("reports.csv.newApplications"), stats.periodStats.newApplications, within]
          );
        }

        downloadCsv(`admin-report-overview-${today}.csv`, headers, rows, meta);
      } else if (reportType === "jobs") {
        const headers = [t("reports.csv.category"), t("reports.csv.key"), t("reports.csv.count")];
        const rows = [];

        (stats.jobStats?.byStatus || []).forEach((st) => {
          rows.push([t("reports.csv.listingStatus"), st.status, st.count]);
        });
        (stats.jobStats?.byApprovalStatus || []).forEach((ap) => {
          rows.push([t("reports.csv.approval"), ap.approvalStatus, ap.count]);
        });
        (stats.jobStats?.byType || []).forEach((tp) => {
          rows.push([t("reports.csv.employmentType"), tp.type, tp.count]);
        });
        (stats.jobStats?.topAppliedJobs || []).forEach((job) => {
          rows.push([t("reports.csv.topApplied"), `${job.title} (${job.company})`, job.applicationCount]);
        });

        downloadCsv(`admin-report-jobs-${today}.csv`, headers, rows, meta);
      } else if (reportType === "users") {
        const headers = [t("reports.csv.dimension"), t("reports.csv.roleOrStatus"), t("reports.csv.count")];
        const rows = [];

        (stats.roleStats || []).forEach((r) => {
          rows.push([t("reports.csv.userRole"), r.role, r.count]);
        });
        rows.push([t("reports.csv.accountStatus"), t("userStatus.active"), stats.activeUsers]);
        rows.push([t("reports.csv.accountStatus"), t("userStatus.inactive"), stats.inactiveUsers]);
        rows.push([t("reports.csv.accountStatus"), t("userStatus.blocked"), stats.blockedUsers]);

        (stats.registrationTrend || []).forEach((trend) => {
          rows.push([t("reports.csv.registrationHistory"), trend.date, trend.count]);
        });

        downloadCsv(`admin-report-users-${today}.csv`, headers, rows, meta);
      } else if (reportType === "applications") {
        const headers = [
          t("reports.csv.stage"),
          t("reports.csv.applicationsCount"),
          t("reports.csv.percentage"),
        ];
        const rows = (stats.applicationStats?.byStatus || []).map((app) => [
          app.status,
          app.count,
          `${app.percentage}%`,
        ]);

        downloadCsv(`admin-report-applications-${today}.csv`, headers, rows, meta);
      }

      showFeedback("success", t("reports.feedback.csvExported"));
    } catch (err) {
      console.error("Export error:", err);
      showFeedback("error", err.message || t("reports.feedback.exportFailed"));
    } finally {
      setExporting(false);
    }
  };

  const rangeLabel = t(`reports.range.${dateRange}`);
  const fmt = (n) => (n ?? 0).toLocaleString(locale);
  const jobStatusLabel = (v) =>
    t(`reports.jobs.status.${String(v).toLowerCase()}`, { defaultValue: enumLabel("jobStatus", v) });

  // Render Overview Tab
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Platform Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-surface rounded-card shadow-card border border-tint-line p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted uppercase tracking-wider">
                {t("reports.overview.totalUsers")}
              </p>
              <h3 className="text-2xl font-bold text-ink mt-1">
                {fmt(stats.totalUsers)}
              </h3>
              <p className="text-xs text-muted mt-1">
                {t("reports.overview.activeInactive", {
                  active: stats.activeUsers,
                  inactive: stats.inactiveUsers,
                })}
              </p>
            </div>
            <div className="p-3 bg-primary-50 dark:bg-primary-900/40 rounded-xl text-primary-text">
              <FiUsers className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-card shadow-card border border-tint-line p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted uppercase tracking-wider">
                {t("reports.overview.totalJobs")}
              </p>
              <h3 className="text-2xl font-bold text-ink mt-1">
                {fmt(stats.totalJobs)}
              </h3>
              <p className="text-xs text-muted mt-1">
                {t("reports.overview.totalJobsHint")}
              </p>
            </div>
            <div className="p-3 bg-success/10 rounded-xl text-success">
              <FiBriefcase className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-card shadow-card border border-tint-line p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted uppercase tracking-wider">
                {t("reports.overview.totalApplications")}
              </p>
              <h3 className="text-2xl font-bold text-ink mt-1">
                {fmt(stats.totalApplications)}
              </h3>
              <p className="text-xs text-muted mt-1">
                {t("reports.overview.applicationsHint")}
              </p>
            </div>
            <div className="p-3 bg-brand-orange/10 rounded-xl text-warning">
              <FiFileText className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-card shadow-card border border-tint-line p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted uppercase tracking-wider">
                {t("reports.overview.activity7")}
              </p>
              <h3 className="text-2xl font-bold text-ink mt-1">
                {fmt(stats.recentActivity)}
              </h3>
              <p className="text-xs text-muted mt-1">
                {t("reports.overview.activity7Hint")}
              </p>
            </div>
            <div className="p-3 bg-brand-parrot/20 rounded-xl text-ink">
              <FiActivity className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Period Specific Summary Banner (if filtered) */}
      {stats.periodStats && (
        <div className="bg-primary-50 dark:bg-primary-900/40 border border-tint-line rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <FiClock className="w-5 h-5 text-primary-text" />
            <div>
              <h4 className="text-sm font-semibold text-primary-text">
                {t("reports.overview.periodTitle", { range: rangeLabel })}
              </h4>
              <p className="text-xs text-primary-text">
                {t("reports.overview.periodHint")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div>
              <span className="text-xs text-primary-text font-medium">{t("reports.overview.newUsers")}</span>{" "}
              <span className="font-bold text-primary-text">{stats.periodStats.newUsers}</span>
            </div>
            <div>
              <span className="text-xs text-primary-text font-medium">{t("reports.overview.newJobs")}</span>{" "}
              <span className="font-bold text-primary-text">{stats.periodStats.newJobs}</span>
            </div>
            <div>
              <span className="text-xs text-primary-text font-medium">{t("reports.overview.newApplications")}</span>{" "}
              <span className="font-bold text-primary-text">{stats.periodStats.newApplications}</span>
            </div>
          </div>
        </div>
      )}

      {/* Database Trends Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Registration Trend */}
        <div className="bg-surface rounded-card shadow-card border border-tint-line p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-ink flex items-center gap-2">
              <FiUsers className="text-primary-text" />
              {t("reports.overview.registrationTrend")}
            </h3>
            <span className="text-xs text-muted">
              {t("reports.overview.daysRecorded", { n: stats.registrationTrend.length })}
            </span>
          </div>

          {stats.registrationTrend.length === 0 ? (
            <div className="text-center py-8 text-muted text-sm">
              {t("reports.overview.noRegistrations")}
            </div>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {stats.registrationTrend.slice(-10).map((point, idx) => {
                const max = Math.max(...stats.registrationTrend.map((x) => x.count), 1);
                const pct = Math.min(100, Math.round((point.count / max) * 100));
                return (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="w-24 text-xs font-mono text-muted">{point.date}</span>
                    <div className="flex-1 mx-3 bg-tint rounded-full h-2 overflow-hidden">
                      <div className="bg-primary-600 h-2 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="min-w-12 text-right font-medium text-ink text-xs whitespace-nowrap">
                      {t(point.count === 1 ? "reports.overview.usersOne" : "reports.overview.usersOther", { n: point.count })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Application Submission Trend */}
        <div className="bg-surface rounded-card shadow-card border border-tint-line p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-ink flex items-center gap-2">
              <FiFileText className="text-warning" />
              {t("reports.overview.applicationVolume")}
            </h3>
            <span className="text-xs text-muted">
              {t("reports.overview.daysRecorded", { n: stats.applicationTrend.length })}
            </span>
          </div>

          {stats.applicationTrend.length === 0 ? (
            <div className="text-center py-8 text-muted text-sm">
              {t("reports.overview.noApplications")}
            </div>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {stats.applicationTrend.slice(-10).map((point, idx) => {
                const max = Math.max(...stats.applicationTrend.map((x) => x.count), 1);
                const pct = Math.min(100, Math.round((point.count / max) * 100));
                return (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="w-24 text-xs font-mono text-muted">{point.date}</span>
                    <div className="flex-1 mx-3 bg-tint rounded-full h-2 overflow-hidden">
                      <div className="bg-brand-orange h-2 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="min-w-12 text-right font-medium text-ink text-xs whitespace-nowrap">
                      {t(point.count === 1 ? "reports.overview.appsOne" : "reports.overview.appsOther", { n: point.count })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Unavailable Metrics Notice */}
      <div className="bg-tint border border-line rounded-xl p-4 flex items-start gap-3">
        <FiInfo className="w-5 h-5 text-muted flex-shrink-0 mt-0.5" />
        <div className="text-xs text-muted leading-relaxed">
          <p className="font-semibold text-ink mb-0.5">
            {t("reports.overview.disclosureTitle")}
          </p>
          {t("reports.overview.disclosureBody")}
        </div>
      </div>
    </div>
  );

  // Render Job Analytics Tab
  const renderJobAnalytics = () => (
    <div className="space-y-6">
      {/* Job Distribution Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* By Status */}
        <div className="bg-surface rounded-card shadow-card border border-tint-line p-5">
          <h4 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
            <FiPieChart className="text-primary-text" />
            {t("reports.jobs.byListing")}
          </h4>
          <div className="space-y-2">
            {(stats.jobStats?.byStatus || []).map((st, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-line last:border-0">
                <span className="text-muted">{jobStatusLabel(st.status)}</span>
                <span className="font-semibold text-ink">{st.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* By Approval Status */}
        <div className="bg-surface rounded-card shadow-card border border-tint-line p-5">
          <h4 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
            <FiShield className="text-success" />
            {t("reports.jobs.byModeration")}
          </h4>
          <div className="space-y-2">
            {(stats.jobStats?.byApprovalStatus || []).map((ap, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-line last:border-0">
                <span className="text-muted">{enumLabel("approvalStatus", ap.approvalStatus)}</span>
                <span className="font-semibold text-ink">{ap.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* By Employment Type */}
        <div className="bg-surface rounded-card shadow-card border border-tint-line p-5">
          <h4 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
            <FiBriefcase className="text-warning" />
            {t("reports.jobs.byType")}
          </h4>
          <div className="space-y-2">
            {(stats.jobStats?.byType || []).map((tp, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-line last:border-0">
                <span className="text-muted">{enumLabel("jobType", tp.type)}</span>
                <span className="font-semibold text-ink">{tp.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top 5 Most Applied Jobs Table */}
      <div className="bg-surface rounded-card shadow-card border border-tint-line p-6">
        <h3 className="text-base font-semibold text-ink mb-4 flex items-center gap-2">
          <FiTrendingUp className="text-primary-text" />
          {t("reports.jobs.topApplied")}
        </h3>

        {(!stats.jobStats?.topAppliedJobs || stats.jobStats.topAppliedJobs.length === 0) ? (
          <div className="text-center py-8 text-muted text-sm">
            {t("reports.jobs.noTopApplied")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-line">
              <thead className="bg-tint">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                    {t("reports.jobs.colTitle")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                    {t("reports.jobs.colCompany")}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-muted uppercase tracking-wider">
                    {t("reports.jobs.colApplications")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-surface divide-y divide-line">
                {stats.jobStats.topAppliedJobs.map((job, idx) => (
                  <tr key={idx} className="hover:bg-tint">
                    <td className="px-6 py-3.5 whitespace-nowrap text-sm font-medium text-ink">
                      {job.title}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-sm text-muted">
                      {job.company}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-sm text-right font-bold text-primary-text">
                      {fmt(job.applicationCount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  // Render User Analytics Tab
  const renderUserAnalytics = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Users by Role */}
        <div className="bg-surface rounded-card shadow-card border border-tint-line p-6">
          <h3 className="text-base font-semibold text-ink mb-4 flex items-center gap-2">
            <FiUsers className="text-primary-text" />
            {t("reports.users.byRole")}
          </h3>
          <div className="space-y-4">
            {(stats.roleStats || []).map((roleItem, idx) => {
              const total = stats.totalUsers || 1;
              const pct = Math.round((roleItem.count / total) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-ink">
                      {enumLabel("userRole", roleItem.role)}
                    </span>
                    <span className="text-muted text-xs">
                      {roleItem.count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-tint h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full ${
                        roleItem.role === "admin"
                          ? "bg-primary-600"
                          : roleItem.role === "employer"
                          ? "bg-brand-orange"
                          : "bg-primary-600"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Users by Account Status */}
        <div className="bg-surface rounded-card shadow-card border border-tint-line p-6">
          <h3 className="text-base font-semibold text-ink mb-4 flex items-center gap-2">
            <FiShield className="text-success" />
            {t("reports.users.statusDistribution")}
          </h3>
          <div className="space-y-4">
            {[
              { status: "active", count: stats.activeUsers, color: "bg-brand-green" },
              { status: "inactive", count: stats.inactiveUsers, color: "bg-brand-parrot" },
              { status: "blocked", count: stats.blockedUsers, color: "bg-brand-red" },
            ].map((st, idx) => {
              const total = stats.totalUsers || 1;
              const pct = Math.round((st.count / total) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-ink">{t(`userStatus.${st.status}`)}</span>
                    <span className="text-muted text-xs">
                      {st.count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-tint h-2.5 rounded-full overflow-hidden">
                    <div className={`h-2.5 rounded-full ${st.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  // Render Application Analytics Tab
  const renderApplicationAnalytics = () => (
    <div className="space-y-6">
      <div className="bg-surface rounded-card shadow-card border border-tint-line p-6">
        <h3 className="text-base font-semibold text-ink mb-4 flex items-center gap-2">
          <FiFileText className="text-warning" />
          {t("reports.applications.pipeline")}
        </h3>

        {(!stats.applicationStats?.byStatus || stats.applicationStats.byStatus.length === 0) ? (
          <div className="text-center py-8 text-muted text-sm">
            {t("reports.applications.empty")}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {stats.applicationStats.byStatus.map((app, idx) => (
              <div
                key={idx}
                className="p-4 bg-tint border border-line rounded-xl text-center"
              >
                <div className="text-2xl font-bold text-ink">
                  {fmt(app.count)}
                </div>
                <div className="text-xs font-semibold text-ink mt-1">
                  {enumLabel("applicationStatus", app.status)}
                </div>
                <div className="text-xs text-muted mt-0.5">
                  {t("reports.applications.ofTotal", { pct: app.percentage })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Render Audit Logs Tab
  const renderAuditLogs = () => (
    <div className="space-y-4">
      {/* Action Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-tint p-3.5 rounded-xl border border-line">
        <div className="flex items-center gap-2">
          <FiFilter className="w-4 h-4 text-muted" />
          <label htmlFor="audit-action-filter" className="text-xs font-medium text-ink">
            {t("reports.audit.actionFilter")}
          </label>
          <select
            id="audit-action-filter"
            value={auditActionFilter}
            onChange={(e) => {
              setAuditActionFilter(e.target.value);
              setAuditPage(1);
            }}
            className="text-xs bg-surface border border-line rounded-lg px-2.5 py-1 text-ink focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">{t("reports.audit.allActions")}</option>
            {[
              "ROLE_CHANGE",
              "STATUS_CHANGE",
              "USER_DELETE",
              "JOB_CREATE",
              "JOB_UPDATE",
              "JOB_DELETE",
              "APPLICATION_UPDATE",
            ].map((code) => (
              <option key={code} value={code}>
                {t(`auditActions.${code}`)}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-muted">
          {t("reports.audit.showing", { shown: auditLogs.length, total: auditPagination.totalLogs })}
        </span>
      </div>

      {/* Audit Table */}
      <div className="bg-surface rounded-card shadow-card border border-tint-line overflow-hidden">
        {auditLogs.length === 0 ? (
          <div className="text-center py-12 text-muted text-sm">
            {t("reports.audit.empty")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-line">
              <thead className="bg-tint">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                    {t("reports.audit.timestamp")}
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                    {t("reports.audit.action")}
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                    {t("reports.audit.performedBy")}
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                    {t("reports.audit.targetUser")}
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                    {t("reports.audit.details")}
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                    {t("reports.audit.ipAddress")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-surface divide-y divide-line">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-tint text-xs">
                    <td className="px-5 py-3.5 whitespace-nowrap text-muted font-mono">
                      {log.createdAt ? new Date(log.createdAt).toLocaleString(locale) : t("reports.audit.unknown")}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <AuditActionBadge action={log.action} />
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-ink font-medium">
                      {log.performedByUser?.name ||
                        (log.performedBy
                          ? t("reports.audit.userId", { id: log.performedBy })
                          : t("reports.audit.system"))}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-muted">
                      {log.targetUser?.name ||
                        (log.targetUserId
                          ? t("reports.audit.userId", { id: log.targetUserId })
                          : t("reports.audit.notAvailable"))}
                    </td>
                    <td className="px-5 py-3.5 text-ink max-w-xs truncate" title={log.details}>
                      {log.details || "—"}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-muted font-mono">
                      {log.ipAddress || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Server-Side Pagination */}
        {auditPagination.totalPages > 1 && (
          <div className="px-5 py-3 bg-tint border-t border-line flex items-center justify-between text-xs">
            <span className="text-muted">
              {t("reports.audit.pageOf", {
                page: auditPagination.currentPage,
                total: auditPagination.totalPages,
              })}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                disabled={!auditPagination.hasPrev || loading}
                className="px-2.5 py-1 rounded bg-surface border border-line disabled:opacity-50 text-ink"
              >
                <FiChevronLeft className="w-3.5 h-3.5 inline mr-1" /> {t("reports.audit.prev")}
              </button>
              <button
                onClick={() => setAuditPage((p) => p + 1)}
                disabled={!auditPagination.hasNext || loading}
                className="px-2.5 py-1 rounded bg-surface border border-line disabled:opacity-50 text-ink"
              >
                {t("reports.audit.next")} <FiChevronRight className="w-3.5 h-3.5 inline ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <PageHeader
        title={t("reports.title")}
        subtitle={t("reports.subtitle")}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
              title={t("reports.refresh")}
              aria-label={t("reports.refresh")}
              leftIcon={<FiRefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />}
            >
              {t("common:actions.refresh")}
            </Button>
            <Button
              size="sm"
              onClick={() => handleExport("csv")}
              loading={exporting}
              leftIcon={<FiDownload className="w-4 h-4" />}
            >
              {exporting ? t("reports.exporting") : t("reports.exportCsv")}
            </Button>
            {reportType !== "audit" && (
              <Button variant="outline" size="sm" onClick={() => handleExport("json")} disabled={exporting}>
                {t("reports.exportJson")}
              </Button>
            )}
          </>
        }
      />

      {/* Feedback Banner */}
      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={`p-3.5 rounded-xl border flex items-center gap-2 text-sm ${
            feedback.type === "success"
              ? "bg-success/10 border-success/30 text-success"
              : "bg-danger/10 border-danger/30 text-danger"
          }`}
        >
          {feedback.type === "success" ? (
            <FiCheckCircle className="w-4 h-4 text-success flex-shrink-0" />
          ) : (
            <FiAlertCircle className="w-4 h-4 text-danger flex-shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Navigation Tabs and Date Range Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-line pb-3">
        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-1" data-testid="reports-tabs">
          {[
            { id: "overview", icon: FiActivity },
            { id: "jobs", icon: FiBriefcase },
            { id: "users", icon: FiUsers },
            { id: "applications", icon: FiFileText },
            { id: "audit", icon: FiShield },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = reportType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setReportType(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors ${
                  active
                    ? "bg-primary-50 dark:bg-primary-900/40 text-primary-text"
                    : "text-muted hover:text-ink hover:bg-tint"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t(`reports.tabs.${tab.id}`)}</span>
              </button>
            );
          })}
        </div>

        {/* Date Filter (Available across all tabs) */}
        <div className="flex items-center gap-2">
          <FiCalendar className="w-4 h-4 text-muted" aria-hidden="true" />
          <select
            aria-label={t("reports.rangeLabel")}
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="text-xs bg-surface border border-line rounded-lg px-2.5 py-1.5 text-ink focus:ring-2 focus:ring-primary-500"
          >
            {["7days", "30days", "90days", "1year", "all"].map((range) => (
              <option key={range} value={range}>
                {t(`reports.range.${range}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-surface rounded-card shadow-card border border-tint-line p-12 text-center">
          <FiRefreshCw className="w-8 h-8 text-primary-text animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted">{t("reports.loading")}</p>
        </div>
      ) : error ? (
        <div role="alert" className="bg-surface rounded-card shadow-card border border-danger/40 p-8 text-center space-y-3">
          <FiAlertCircle className="w-10 h-10 text-danger mx-auto" />
          <h3 className="text-base font-semibold text-ink">{t("reports.errorTitle")}</h3>
          <p className="text-xs text-muted max-w-md mx-auto">{error}</p>
          <Button size="sm" onClick={handleRefresh}>
            {t("reports.retryLoading")}
          </Button>
        </div>
      ) : (
        <div>
          {reportType === "overview" && renderOverview()}
          {reportType === "jobs" && renderJobAnalytics()}
          {reportType === "users" && renderUserAnalytics()}
          {reportType === "applications" && renderApplicationAnalytics()}
          {reportType === "audit" && renderAuditLogs()}
        </div>
      )}
    </div>
  );
};

export default ReportsAnalytics;
