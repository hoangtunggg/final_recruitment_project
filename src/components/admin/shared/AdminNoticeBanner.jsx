import { useTranslation } from "react-i18next";
import { FiAlertCircle, FiCheckCircle, FiX } from "react-icons/fi";

/** Success / error banner under the page header. `notification` = { type: "success" | "error", message } | null. */
const AdminNoticeBanner = ({ notification, onDismiss }) => {
  const { t } = useTranslation("admin");
  if (!notification) return null;
  const isSuccess = notification.type === "success";
  return (
    <div
      role="alert"
      className={`flex items-center justify-between gap-3 p-4 rounded-card border text-sm ${
        isSuccess
          ? "border-success/30 bg-success/10 text-success"
          : "border-danger/30 bg-danger/10 text-danger"
      }`}
    >
      <div className="flex items-center gap-2">
        {isSuccess ? (
          <FiCheckCircle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
        ) : (
          <FiAlertCircle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
        )}
        <span>{notification.message}</span>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="inline-flex h-11 w-11 items-center justify-center rounded-control hover:bg-surface/60"
        aria-label={t("shared.dismissAlert")}
      >
        <FiX className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
};

export default AdminNoticeBanner;
