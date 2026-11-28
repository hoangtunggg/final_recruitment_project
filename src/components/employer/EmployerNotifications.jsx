import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  FiBell,
  FiUser,
  FiBriefcase,
  FiCalendar,
  FiX,
  FiEye,
  FiAlertCircle,
} from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { useLocale } from "../../i18n/helpers";

const NOTIFICATION_ICONS = {
  new_application: <FiUser className="h-4 w-4 text-primary-text" />,
  interview_scheduled: <FiCalendar className="h-4 w-4 text-primary-text" />,
  application_updated: <FiBriefcase className="h-4 w-4 text-success" />,
  system_alert: <FiAlertCircle className="h-4 w-4 text-danger" />,
  deadline_reminder: <FiEye className="h-4 w-4 text-warning" />,
};

/** Bell dropdown listing live "application submitted" events received while the dashboard is open. */
const EmployerNotifications = () => {
  const { t } = useTranslation(["employer", "common"]);
  const locale = useLocale();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && showDropdown) setShowDropdown(false);
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showDropdown]);

  useEffect(() => {
    // Listen for new applications. Text is built at render time so it follows the active language.
    const handleApplicationSubmitted = (event) => {
      const applicantName = event?.detail?.applicantName || null;
      const jobTitle = event?.detail?.jobTitle || null;

      setNotifications((prev) => [
        {
          id: Date.now(),
          type: "new_application",
          applicantName,
          jobTitle,
          timestamp: new Date(),
          read: false,
        },
        ...prev,
      ]);
      setUnreadCount((prev) => prev + 1);

      // Show browser notification if permitted
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(t("employer:notifications.newApplicationTitle"), {
          body: t("employer:notifications.newApplicationMessage", {
            name: applicantName || t("employer:notifications.aCandidate"),
            job: jobTitle || t("employer:notifications.yourPosition"),
          }),
          icon: "/favicon.ico",
        });
      }
    };

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    window.addEventListener("applicationSubmitted", handleApplicationSubmitted);
    return () => window.removeEventListener("applicationSubmitted", handleApplicationSubmitted);
  }, [t]);

  const markAsRead = (notificationId) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === notificationId ? { ...notif, read: true } : notif))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
    setUnreadCount(0);
  };

  const deleteNotification = (notificationId) => {
    const target = notifications.find((n) => n.id === notificationId);
    setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId));
    if (target && !target.read) setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const formatTimestamp = (timestamp) => {
    const diff = new Date() - new Date(timestamp);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return t("common:notifications.justNow");
    if (minutes < 60) return t("common:notifications.minutesAgo", { n: minutes });
    if (hours < 24) return t("common:notifications.hoursAgo", { n: hours });
    if (days < 7) return t("employer:notifications.daysAgo", { n: days });
    return new Date(timestamp).toLocaleDateString(locale);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setShowDropdown((prev) => !prev)}
        aria-label={t("employer:notifications.view")}
        aria-expanded={showDropdown}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-pill border border-line bg-surface text-muted transition-colors hover:bg-tint hover:text-ink"
      >
        <FiBell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-red px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-card border border-line-strong bg-surface shadow-card sm:w-96">
          <div className="flex items-center justify-between border-b border-line bg-tint/50 px-4 py-3">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-ink">{t("employer:notifications.title")}</h3>
              {unreadCount > 0 && (
                <span className="rounded-pill bg-tint px-2 py-0.5 text-[10px] font-semibold text-primary-text">
                  {t("employer:notifications.newCount", { n: unreadCount })}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-3">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-xs font-medium text-primary-text hover:underline"
                >
                  {t("common:notifications.markAllRead")}
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowDropdown(false)}
                className="rounded-md p-1 text-muted hover:text-ink"
                aria-label={t("common:notifications.close")}
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="max-h-80 divide-y divide-line overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-tint text-muted">
                  <FiBell className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-ink">{t("employer:notifications.emptyTitle")}</p>
                <p className="mt-0.5 text-xs text-muted">{t("employer:notifications.emptyText")}</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 transition-colors ${
                    !notification.read ? "bg-tint/60" : "hover:bg-tint"
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="mt-0.5 shrink-0 rounded-control bg-tint p-1.5">
                      {NOTIFICATION_ICONS[notification.type] || <FiBell className="h-4 w-4 text-muted" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="truncate text-xs font-semibold text-ink">
                          {t("employer:notifications.newApplicationTitle")}
                        </p>
                        <button
                          type="button"
                          onClick={() => deleteNotification(notification.id)}
                          className="ml-2 text-muted hover:text-ink"
                          aria-label={t("employer:notifications.dismiss")}
                        >
                          <FiX className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted">
                        {t("employer:notifications.newApplicationMessage", {
                          name: notification.applicantName || t("employer:notifications.aCandidate"),
                          job: notification.jobTitle || t("employer:notifications.yourPosition"),
                        })}
                      </p>
                      <div className="mt-1.5 flex items-center justify-between">
                        <span className="text-[11px] text-muted">{formatTimestamp(notification.timestamp)}</span>
                        {!notification.read && (
                          <button
                            type="button"
                            onClick={() => markAsRead(notification.id)}
                            className="text-[11px] font-medium text-primary-text hover:underline"
                          >
                            {t("common:notifications.markRead")}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-line bg-tint/60 px-4 py-2.5 text-center">
            <Link
              to="/employer/applicants"
              onClick={() => setShowDropdown(false)}
              className="text-xs font-bold text-primary-text hover:underline"
            >
              {t("employer:notifications.openTracking")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployerNotifications;
