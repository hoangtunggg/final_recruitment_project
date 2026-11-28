import { useEffect, useMemo, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FiBell,
  FiMenu,
  FiSearch,
  FiCheck,
  FiX,
} from "react-icons/fi";
import notificationService from "../../services/notificationService";
import SidebarCollapseButton from "../common/SidebarCollapseButton";
import ThemeToggle from "../common/ThemeToggle";
import LanguageToggle from "../common/LanguageToggle";
import { useLocale } from "../../i18n/helpers";

const AdminHeader = ({
  toggleSidebar,
  sidebarOpen = false,
  sidebarCollapsed = false,
  onToggleCollapse,
}) => {
  const { t } = useTranslation("admin");
  const locale = useLocale();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    const fetchNotifs = async () => {
      try {
        const response = await notificationService.getNotifications({ limit: 5 });
        if (isMounted) {
          const items = response.data?.notifications || [];
          setNotifications(items);
          setUnreadCount(response.data?.unreadCount || 0);
        }
      } catch {
        if (isMounted) {
          setNotifications([]);
          setUnreadCount(0);
        }
      }
    };

    fetchNotifs();
    return () => {
      isMounted = false;
    };
  }, []);

  // Close notifications dropdown on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setIsNotificationOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const computedUnreadCount = useMemo(
    () => (unreadCount > 0 ? unreadCount : notifications.filter((n) => !n.isRead).length),
    [unreadCount, notifications]
  );

  const getNotificationIcon = (type) => {
    switch (type) {
      case "success":
        return <FiCheck className="w-4 h-4 text-success" />;
      case "error":
        return <FiX className="w-4 h-4 text-danger" />;
      default:
        return <FiBell className="w-4 h-4 text-primary-text" />;
    }
  };

  const markAsRead = async (notification) => {
    if (notification.isRead) return;
    try {
      await notificationService.markAsRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  return (
    <header className="bg-surface border-b border-line transition-colors duration-200">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3">
        <div className="flex items-center">
          <button
            type="button"
            onClick={toggleSidebar}
            aria-controls="admin-navigation"
            aria-expanded={sidebarOpen}
            data-testid="admin-sidebar-toggle"
            className="inline-flex h-11 w-11 items-center justify-center text-muted hover:text-ink rounded-control hover:bg-tint lg:hidden"
            aria-label={t("header.toggleSidebar")}
          >
            <FiMenu className="w-6 h-6" />
          </button>
          <SidebarCollapseButton
            collapsed={sidebarCollapsed}
            onToggle={onToggleCollapse}
            controls="admin-navigation"
            label={t(sidebarCollapsed ? "header.expandSidebar" : "header.collapseSidebar")}
            testId="admin-sidebar-collapse"
          />
          <div className="relative mx-3 hidden sm:block">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FiSearch className="w-4 h-4 text-muted" />
            </span>
            <input
              disabled
              className="w-36 min-h-11 pl-9 pr-3 text-sm text-muted bg-tint border border-line rounded-control cursor-not-allowed opacity-75 sm:w-64 focus:outline-none"
              placeholder={t("header.searchPlaceholder")}
              title={t("header.searchDisabledHint")}
              type="text"
              aria-label={t("header.searchAria")}
            />
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          <LanguageToggle size="sm" />
          <ThemeToggle size="sm" />
          <div className="relative" ref={notificationRef}>
            <button
              type="button"
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              aria-expanded={isNotificationOpen}
              aria-controls="admin-notification-panel"
              aria-label={t("header.notificationsAria")}
              data-testid="admin-notifications-button"
              className="inline-flex h-11 w-11 items-center justify-center text-ink rounded-control hover:bg-tint relative"
            >
              <FiBell className="w-5 h-5" />
              {computedUnreadCount > 0 && (
                <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-brand-red ring-2 ring-surface"></span>
              )}
            </button>

            {isNotificationOpen && (
              <div id="admin-notification-panel" className="absolute right-0 w-80 sm:w-96 max-w-[calc(100vw-2rem)] mt-2 bg-surface rounded-card shadow-card border border-line z-50 max-h-96 overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-line flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-ink">
                      {t("header.notifications")}
                    </h3>
                    <p className="text-xs text-muted mt-0.5">
                      {computedUnreadCount > 0
                        ? t("header.unread", { n: computedUnreadCount })
                        : t("header.allRead")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsNotificationOpen(false)}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-control text-muted hover:text-ink hover:bg-tint"
                    aria-label={t("header.closePanel")}
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>

                <div className="divide-y divide-line overflow-y-auto max-h-64">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-muted">
                      {t("header.empty")}
                    </div>
                  ) : (
                    notifications.map((notification) => {
                      const isUnread = !notification.isRead;
                      return (
                        <div
                          key={notification.id}
                          onClick={() => markAsRead(notification)}
                          className={`px-4 py-3 cursor-pointer hover:bg-tint ${
                            isUnread
                              ? "bg-tint/60 border-l-4 border-primary-600"
                              : "border-l-4 border-transparent"
                          } transition-colors`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 mt-0.5">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-xs ${
                                  isUnread ? "text-ink font-semibold" : "text-ink font-medium"
                                } line-clamp-1`}
                              >
                                {notification.title}
                              </p>
                              <p className="text-xs text-muted line-clamp-2 mt-0.5">
                                {notification.message}
                              </p>
                              <p className="text-[10px] text-muted mt-1">
                                {new Date(notification.createdAt).toLocaleDateString(locale)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="px-4 py-2.5 border-t border-line bg-tint flex items-center justify-between">
                  <span className="text-xs text-muted flex items-center">
                    <FiBell className="w-3.5 h-3.5 mr-1 text-primary-text" />
                    {t("header.notifications")}
                  </span>
                  <Link
                    to="/admin/notifications"
                    onClick={() => setIsNotificationOpen(false)}
                    className="text-xs text-primary-text hover:underline font-semibold"
                  >
                    {t("header.viewAll")}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
