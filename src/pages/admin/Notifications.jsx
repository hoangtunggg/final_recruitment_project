import React, { useState, useEffect, useCallback } from "react";
import {
  FiBell,
  FiCheck,
  FiX,
  FiTrash2,
  FiFilter,
  FiSearch,
  FiClock,
  FiUser,
  FiBriefcase,
  FiAlertCircle,
  FiCheckCircle,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
  FiShield,
} from "react-icons/fi";
import { useTranslation } from "react-i18next";
import notificationService from "../../services/notificationService";
import { Badge, Button, PageHeader } from "../../components/ui";
import { useLocale } from "../../i18n/helpers";

const PRIORITY_TONES = { high: "danger", low: "success" };

const Notifications = () => {
  const { t } = useTranslation("adminOps");
  const locale = useLocale();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await notificationService.getNotifications({
        page: currentPage,
        limit: 20,
        filter,
        search: searchTerm,
      });

      if (res.success && res.data) {
        setNotifications(res.data.notifications || []);
        setPagination(
          res.data.pagination || {
            total: (res.data.notifications || []).length,
            page: currentPage,
            limit: 20,
            totalPages: 1,
            hasNext: false,
            hasPrev: false,
          }
        );
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Error loading notifications:", err);
      setError(err.response?.data?.error || t("notifications.errors.load"));
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filter, searchTerm, t]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const showFeedback = (msg) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  const markAsRead = async (id) => {
    try {
      setActionLoading(true);
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((notif) => (notif.id === id ? { ...notif, isRead: true } : notif))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      showFeedback(t("notifications.feedback.markedRead"));
    } catch (err) {
      console.error("Failed to mark as read:", err);
      setError(err.response?.data?.error || t("notifications.errors.update"));
    } finally {
      setActionLoading(false);
    }
  };

  const markAsUnread = async (id) => {
    try {
      setActionLoading(true);
      await notificationService.markAsUnread(id);
      setNotifications((prev) =>
        prev.map((notif) => (notif.id === id ? { ...notif, isRead: false } : notif))
      );
      setUnreadCount((prev) => prev + 1);
      showFeedback(t("notifications.feedback.markedUnread"));
    } catch (err) {
      console.error("Failed to mark as unread:", err);
      setError(err.response?.data?.error || t("notifications.errors.update"));
    } finally {
      setActionLoading(false);
    }
  };

  const deleteNotification = async (id) => {
    try {
      setActionLoading(true);
      await notificationService.deleteNotification(id);
      setNotifications((prev) => prev.filter((notif) => notif.id !== id));
      loadNotifications();
      showFeedback(t("notifications.feedback.deleted"));
    } catch (err) {
      console.error("Failed to delete notification:", err);
      setError(err.response?.data?.error || t("notifications.errors.delete"));
    } finally {
      setActionLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      setActionLoading(true);
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((notif) => ({ ...notif, isRead: true })));
      setUnreadCount(0);
      showFeedback(t("notifications.feedback.allRead"));
    } catch (err) {
      console.error("Failed to mark all as read:", err);
      setError(err.response?.data?.error || t("notifications.errors.markAll"));
    } finally {
      setActionLoading(false);
    }
  };

  const clearAllNotifications = async () => {
    if (!window.confirm(t("notifications.confirmClear"))) {
      return;
    }

    try {
      setActionLoading(true);
      await notificationService.clearAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
      setPagination((prev) => ({ ...prev, total: 0, totalPages: 1 }));
      showFeedback(t("notifications.feedback.cleared"));
    } catch (err) {
      console.error("Failed to clear notifications:", err);
      setError(err.response?.data?.error || t("notifications.errors.clear"));
    } finally {
      setActionLoading(false);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "job_alert":
        return <FiBriefcase className="h-4 w-4 text-primary-text" />;
      case "application_status":
      case "application_update":
        return <FiUser className="h-4 w-4 text-success" />;
      case "error":
        return <FiAlertCircle className="h-4 w-4 text-danger" />;
      case "success":
        return <FiCheckCircle className="h-4 w-4 text-success" />;
      default:
        return <FiBell className="h-4 w-4 text-primary-text" />;
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return t("common:notifications.justNow");
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return t("common:notifications.justNow");
    if (diffInMinutes < 60) return t("common:notifications.minutesAgo", { n: diffInMinutes });
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return t("common:notifications.hoursAgo", { n: diffInHours });
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return t("notifications.daysAgo", { n: diffInDays });
    return date.toLocaleDateString(locale);
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <PageHeader
        title={t("notifications.title")}
        subtitle={
          unreadCount > 0
            ? t(unreadCount === 1 ? "notifications.unreadOne" : "notifications.unreadOther", {
                n: unreadCount,
              })
            : t("notifications.allCaughtUp")
        }
        actions={
          <>
            <Button
              size="sm"
              disabled={actionLoading || unreadCount === 0}
              onClick={markAllAsRead}
              leftIcon={<FiCheck className="w-4 h-4" />}
            >
              {t("notifications.markAllRead")}
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={actionLoading || notifications.length === 0}
              onClick={clearAllNotifications}
              leftIcon={<FiTrash2 className="w-4 h-4" />}
            >
              {t("notifications.clearAll")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={loadNotifications}
              title={t("notifications.refresh")}
              aria-label={t("notifications.refresh")}
              leftIcon={<FiRefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />}
            >
              {t("common:actions.refresh")}
            </Button>
          </>
        }
      />

      {/* Security notice */}
      <div className="flex items-start p-3.5 text-xs rounded-lg border bg-primary-50 dark:bg-primary-900/40 text-primary-text border-tint-line">
        <FiShield className="w-4 h-4 mr-2.5 flex-shrink-0 text-primary-text mt-0.5" />
        <div>
          <span className="font-semibold">{t("notifications.scopeLabel")}</span> {t("notifications.scopeBody")}
        </div>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div role="status" className="p-3.5 rounded-lg bg-success/10 border border-success/30 text-sm text-success flex items-center">
          <FiCheckCircle className="w-4 h-4 mr-2" />
          {feedback}
        </div>
      )}

      {error && (
        <div role="alert" className="p-3.5 rounded-lg bg-danger/10 border border-danger/30 text-sm text-danger flex items-center">
          <FiAlertCircle className="w-4 h-4 mr-2" />
          {error}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-surface rounded-card shadow-card border border-tint-line overflow-hidden">
        <div className="p-4 border-b border-line flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted w-4 h-4" aria-hidden="true" />
            <input
              type="text"
              placeholder={t("notifications.searchPlaceholder")}
              aria-label={t("notifications.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 pr-4 py-2 w-full text-sm border border-line rounded-lg bg-surface text-ink focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <FiFilter className="text-muted w-4 h-4" aria-hidden="true" />
            <select
              value={filter}
              aria-label={t("notifications.filterLabel")}
              onChange={(e) => {
                setFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 text-sm border border-line rounded-lg bg-surface text-ink focus:ring-2 focus:ring-primary-500 focus:outline-none"
            >
              <option value="all">{t("notifications.filter.all")}</option>
              <option value="unread">{t("notifications.filter.unread")}</option>
              <option value="read">{t("notifications.filter.read")}</option>
            </select>
          </div>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-3"></div>
            <p className="text-xs text-muted">{t("notifications.loading")}</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center">
            <FiBell className="mx-auto h-12 w-12 text-muted mb-3" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-ink mb-1">
              {t("notifications.emptyTitle")}
            </h3>
            <p className="text-xs text-muted max-w-sm mx-auto">
              {searchTerm || filter !== "all"
                ? t("notifications.emptyFiltered")
                : t("notifications.emptyAll")}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-line">
            {notifications.map((notif) => {
              const isUnread = !notif.isRead;
              return (
                <div
                  key={notif.id}
                  className={`p-4 transition-colors ${
                    isUnread
                      ? "bg-primary-50 dark:bg-primary-900/40 border-l-4 border-primary-600"
                      : "hover:bg-tint"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <div
                        className={`p-2 rounded-lg flex-shrink-0 ${
                          isUnread
                            ? "bg-primary-50 dark:bg-primary-900/40 text-primary-text"
                            : "bg-tint text-muted"
                        }`}
                      >
                        {getNotificationIcon(notif.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p
                            className={`text-sm font-semibold ${
                              isUnread
                                ? "text-ink"
                                : "text-ink"
                            }`}
                          >
                            {notif.title}
                          </p>
                          {isUnread && (
                            <span className="inline-block w-2 h-2 rounded-full bg-primary-600"></span>
                          )}
                        </div>

                        <p className="text-xs text-muted mt-1 line-clamp-2">
                          {notif.message}
                        </p>

                        <div className="flex items-center gap-3 mt-2 text-[11px] text-muted">
                          <span className="flex items-center">
                            <FiClock className="w-3 h-3 mr-1" />
                            {formatTimestamp(notif.createdAt)}
                          </span>
                          <Badge tone={PRIORITY_TONES[notif.priority] || "warning"} size="sm">
                            {t(`notifications.priority.${notif.priority || "medium"}`, {
                              defaultValue: String(notif.priority),
                            })}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      {isUnread ? (
                        <button
                          type="button"
                          onClick={() => markAsRead(notif.id)}
                          className="p-1.5 text-primary-text rounded hover:bg-tint"
                          title={t("notifications.markRead")}
                          aria-label={t("notifications.markRead")}
                        >
                          <FiCheck className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => markAsUnread(notif.id)}
                          className="p-1.5 text-muted hover:text-ink rounded hover:bg-tint"
                          title={t("notifications.markUnread")}
                          aria-label={t("notifications.markUnread")}
                        >
                          <FiX className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteNotification(notif.id)}
                        className="p-1.5 text-danger rounded hover:bg-danger/10"
                        title={t("notifications.delete")}
                        aria-label={t("notifications.delete")}
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="px-4 py-3 bg-tint border-t border-line flex items-center justify-between">
            <div className="text-xs text-muted">
              {t("notifications.pageInfo", {
                page: pagination.page,
                pages: pagination.totalPages,
                total: pagination.total,
              })}
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                disabled={!pagination.hasPrev || loading}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 text-xs rounded border border-line bg-surface text-ink disabled:opacity-50 inline-flex items-center"
              >
                <FiChevronLeft className="w-3.5 h-3.5 mr-1" />
                {t("notifications.previous")}
              </button>
              <button
                type="button"
                disabled={!pagination.hasNext || loading}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-2.5 py-1 text-xs rounded border border-line bg-surface text-ink disabled:opacity-50 inline-flex items-center"
              >
                {t("notifications.next")}
                <FiChevronRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
