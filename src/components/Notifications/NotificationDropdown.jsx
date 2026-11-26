import React, { useState } from "react";
import { useNotifications } from "../../context/NotificationContext";
import {
  FiBell,
  FiCheck,
  FiX,
  FiClock,
  FiBriefcase,
  FiCheckCircle,
} from "react-icons/fi";

const NotificationDropdown = () => {
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

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 120) return "1h ago";
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 2880) return "Yesterday";
    return date.toLocaleDateString();
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
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-lg text-slate-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <FiBell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
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
          <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-slate-300 dark:border-gray-600 z-20">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-gray-700">
              <h3 className="font-semibold text-slate-900 dark:text-white">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="min-h-11 text-sm text-blue-700 dark:text-blue-300 hover:text-blue-800 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="inline-flex h-11 w-11 items-center justify-center text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700"
                  aria-label="Close notifications"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-600 dark:text-gray-300">
                  <FiBell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>No notifications yet</p>
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
                    aria-label={`Open notification: ${notification.title}`}
                    className={`border-l-4 ${getPriorityColor(
                      notification.priority
                    )} ${
                      !notification.read ? "bg-blue-50 dark:bg-blue-950/40" : "bg-white dark:bg-gray-800"
                    } hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors cursor-pointer`}
                  >
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-900 dark:text-white">
                                {notification.title}
                              </p>
                              <p className="text-sm text-slate-600 dark:text-gray-300 mt-1">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <FiClock className="h-3 w-3 text-gray-400" />
                                <span className="text-xs text-gray-500">
                                  {formatTime(notification.timestamp)}
                                </span>
                                {!notification.read && (
                                  <span className="inline-flex items-center gap-1 text-xs text-blue-600">
                                    <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                                    New
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              aria-label={`Delete notification: ${notification.title}`}
                              className="flex-shrink-0 p-1 text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <FiX className="h-3 w-3" />
                            </button>
                          </div>
                          {!notification.read && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              aria-label={`Mark notification as read: ${notification.title}`}
                              className="mt-2 text-xs text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
                            >
                              <FiCheck className="h-3 w-3" />
                              Mark as read
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
              <div className="p-3 border-t border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800">
                <button
                  onClick={() => {
                    // Navigate to notifications page
                    console.log("Navigate to all notifications");
                    setIsOpen(false);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                  View all notifications
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
