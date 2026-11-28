import { useEffect } from "react";
import { Button } from "../ui";

/**
 * Accessible confirm dialog (role="dialog", Escape cancels, busy state disables both buttons).
 * Props: titleId, icon (node), title, children (message), cancelLabel, confirmLabel,
 *        tone "danger" | "primary", busy, onCancel, onConfirm.
 */
const ConfirmDialog = ({ titleId, icon, title, children, cancelLabel, confirmLabel, tone = "danger", busy = false, onCancel, onConfirm }) => {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [busy, onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-card border border-tint-line bg-surface p-6 shadow-card"
      >
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-tint text-xl text-primary-text" aria-hidden="true">
            {icon}
          </span>
          <h2 id={titleId} className="text-xl font-bold text-ink">
            {title}
          </h2>
        </div>
        <div className="text-muted">{children}</div>
        <div className="mt-6 flex flex-col-reverse gap-3 border-t border-line pt-4 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button variant={tone === "danger" ? "danger" : "primary"} onClick={onConfirm} loading={busy}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
