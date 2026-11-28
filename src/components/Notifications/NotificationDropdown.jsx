import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNotifications } from "../../context/NotificationContext";
import { useLocale } from "../../i18n/helpers";
import {
  FiBell,
  FiCheck,
  FiX,
  FiClock,
  FiBriefcase,
  FiCheckCircle,
} from "react-icons/fi";

const NotificationDropdown = () => {
  const { t } = useTranslation("common");
  const locale = useLocale();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const getNotificationIcon = (type) => {
    switch (type) {
      case "job_alert":
        return <FiBriefcase className="h-4 w-4 text-blue-500" />;
      case "application_update":
        return <FiCheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <FiBell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "border-l-red-500";
      case "medium":
        return "border-l-yellow-500";
      default:
        return "border-l-gray-300";
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return t("notifications.justNow");
    if (diffInMinutes < 60) return t("notifications.minutesAgo", { n: diffInMinutes });
    if (diffInMinutes < 1440)
      return t("notifications.hoursAgo", { n: Math.floor(diffInMinutes / 60) });
    if (diffInMinutes < 2880) return t("notifications.yesterday");
    return date.toLocaleDateString(locale);
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    // Handle navigation if needed
    if (notification.jobId) {
      // Navigate to job detail
      console.log(`Navigate to job ${notification.jobId}`);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-control text-ink transition-colors hover:bg-tint"
        aria-label={t("notifications.title")}
        aria-expanded={isOpen}
      >
        <FiBell className="h-5 w-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-red text-xs font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Content */}
          <div className="absolute right-0 z-20 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-card border border-tint-line bg-surface shadow-card">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-line p-4">
              <h3 className="font-semibold text-ink">{t("notifications.title")}</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="min-h-11 cursor-pointer text-sm font-medium text-primary-text transition-colors hover:underline"
                  >
                    {t("notifications.markAllRead")}
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-control text-muted hover:text-ink"
                  aria-label={t("notifications.close")}
                >
                  <FiX className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-muted">
                  <FiBell className="mx-auto mb-2 h-8 w-8 text-line-strong" aria-hidden="true" />
                  <p>{t("notifications.empty")}</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    onKeyDown={(event) => {
                      if (event.target !== event.currentTarget) return;
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleNotificationClick(notification);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={t("notifications.open", { title: notification.title })}
                    className={`border-l-4 ${getPriorityColor(
                      notification.priority
                    )} ${
                      !notification.read ? "bg-primary-50 dark:bg-primary-900/30" : "bg-surface"
                    } cursor-pointer transition-colors hover:bg-tint`}
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-ink">
                                {notification.title}
                              </p>
                              <p className="mt-1 text-sm text-muted">
                                {notification.message}
                              </p>
                              <div className="mt-2 flex items-center gap-2">
                                <FiClock className="h-3 w-3 text-muted" aria-hidden="true" />
                                <span className="text-xs text-muted">
                                  {formatTime(notification.timestamp)}
                                </span>
                                {!notification.read && (
                                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary-text">
                                    <span className="h-2 w-2 rounded-full bg-primary-500"></span>
                                    {t("notifications.new")}
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              aria-label={t("notifications.delete", { title: notification.title })}
                              className="flex-shrink-0 cursor-pointer p-1 text-muted transition-colors hover:text-danger"
                            >
                              <FiX className="h-3 w-3" aria-hidden="true" />
                            </button>
                          </div>
                          {!notification.read && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              aria-label={t("notifications.markReadAria", { title: notification.title })}
                              className="mt-2 flex cursor-pointer items-center gap-1 text-xs font-medium text-primary-text transition-colors hover:underline"
                            >
                              <FiCheck className="h-3 w-3" aria-hidden="true" />
                              {t("notifications.markRead")}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="border-t border-line bg-tint p-3">
                <button
                  onClick={() => {
                    // Navigate to notifications page
                    console.log("Navigate to all notifications");
                    setIsOpen(false);
                  }}
                  className="cursor-pointer text-sm font-medium text-primary-text transition-colors hover:underline"
                >
                  {t("notifications.viewAll")}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationDropdown;
