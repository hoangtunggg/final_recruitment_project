import { useTranslation } from "react-i18next";
import { FiAlertCircle, FiX } from "react-icons/fi";
import { Button } from "../../ui";

const SIZES = { sm: "max-w-md", md: "max-w-2xl", lg: "max-w-3xl" };

/** Dialog shell used by every admin modal. `label` is the translated accessible name. */
const AdminModal = ({ label, size = "md", children }) => (
  <div
    className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4"
    role="dialog"
    aria-modal="true"
    aria-label={label}
  >
    <div
      className={`relative bg-surface text-ink rounded-card w-full p-6 shadow-card border border-line ${
        SIZES[size] || SIZES.md
      }`}
    >
      {children}
    </div>
  </div>
);

/** Title row with a close button. Props: title, subtitle, leading (node before the title), onClose (omit for no X). */
export const AdminModalHeader = ({ title, subtitle, leading, onClose }) => {
  const { t } = useTranslation("admin");
  return (
    <div className="flex items-center justify-between gap-3 pb-4 border-b border-line">
      <div className="flex items-center gap-3 min-w-0">
        {leading}
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-ink">{title}</h3>
          {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-muted hover:text-ink hover:bg-tint"
          aria-label={t("shared.closeDialog")}
        >
          <FiX className="w-5 h-5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
};

/** Footer row for dialog buttons. `justify` = "end" (default) | "between". */
export const AdminModalActions = ({ justify = "end", children }) => (
  <div
    className={`mt-6 pt-4 border-t border-line flex flex-wrap items-center gap-3 ${
      justify === "between" ? "justify-between" : "justify-end"
    }`}
  >
    {children}
  </div>
);

/**
 * Destructive confirmation dialog.
 * Props: label (aria), title, children (message), confirmLabel, loading, onCancel, onConfirm.
 */
export const AdminConfirmDeleteModal = ({
  label,
  title,
  children,
  confirmLabel,
  loading = false,
  onCancel,
  onConfirm,
}) => {
  const { t } = useTranslation("admin");
  return (
    <AdminModal label={label} size="sm">
      <div className="flex items-center gap-3 text-danger mb-3">
        <FiAlertCircle className="w-6 h-6 flex-shrink-0" aria-hidden="true" />
        <h3 className="text-lg font-bold text-ink">{title}</h3>
      </div>
      <p className="text-sm text-muted mb-4">{children}</p>
      <AdminModalActions>
        <Button variant="outline" size="sm" onClick={onCancel} disabled={loading}>
          {t("common:actions.cancel")}
        </Button>
        <Button variant="danger" size="sm" onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </AdminModalActions>
    </AdminModal>
  );
};

export default AdminModal;
