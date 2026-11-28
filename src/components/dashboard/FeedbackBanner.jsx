import { useTranslation } from "react-i18next";
import { FiAlertCircle, FiCheckCircle, FiInfo, FiX } from "react-icons/fi";
import { cx } from "../ui";

const VARIANTS = {
  success: { icon: FiCheckCircle, classes: "border-success/30 bg-success/10 text-success" },
  info: { icon: FiInfo, classes: "border-tint-line bg-tint text-primary-text" },
  error: { icon: FiAlertCircle, classes: "border-danger/30 bg-danger/10 text-danger" },
};

/** Non-blocking status banner (replaces alert()). `feedback` = { type: success|info|error, message } | null. */
const FeedbackBanner = ({ feedback, onDismiss }) => {
  const { t } = useTranslation("candidate");
  if (!feedback) return null;
  const { icon: Icon, classes } = VARIANTS[feedback.type] || VARIANTS.error;

  return (
    <div
      role="alert"
      data-testid="dashboard-feedback"
      className={cx("mb-6 flex items-center justify-between gap-3 rounded-card border p-4 text-sm font-semibold", classes)}
    >
      <span className="flex min-w-0 items-center gap-3">
        <Icon className="shrink-0 text-lg" aria-hidden="true" />
        <span className="break-words">{feedback.message}</span>
      </span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label={t("feedback.dismiss")}
        className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full hover:bg-black/5"
      >
        <FiX aria-hidden="true" />
      </button>
    </div>
  );
};

export default FeedbackBanner;
