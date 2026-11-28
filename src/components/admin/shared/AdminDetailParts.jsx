import { FiAlertCircle } from "react-icons/fi";

// Small building blocks for the admin detail dialogs and action columns.

const ICON_TONES = {
  primary: "text-primary-text hover:bg-tint",
  success: "text-success hover:bg-success/10",
  warning: "text-warning hover:bg-warning/10",
  danger: "text-danger hover:bg-danger/10",
};

/** Icon-only action button. `label` is used for both the tooltip and the accessible name (pass a translated string). */
export const AdminIconButton = ({ icon, label, tone = "primary", onClick, disabled, testId }) => {
  const Icon = icon;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      data-testid={testId}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-control transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        ICON_TONES[tone] || ICON_TONES.primary
      }`}
    >
      <Icon className="w-4 h-4" aria-hidden="true" />
    </button>
  );
};

/** Small caption above a value: `<AdminInfoItem label="Email" icon={<FiMail/>}>{value}</AdminInfoItem>`. */
export const AdminInfoItem = ({ label, icon, children }) => (
  <div>
    <span className="text-xs text-muted">{label}</span>
    <div className="text-sm font-medium text-ink flex items-center gap-1.5 mt-0.5 break-words">
      {icon && (
        <span className="text-muted" aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
    </div>
  </div>
);

/** Upper-case section heading inside a dialog. */
export const AdminSectionTitle = ({ icon, children }) => (
  <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
    {icon}
    {children}
  </h4>
);

/** Multi-line free text (description, cover letter...). */
export const AdminTextBlock = ({ children }) => (
  <div className="text-sm text-ink bg-tint p-3.5 rounded-card border border-line whitespace-pre-line">
    {children}
  </div>
);

/** Avatar circle with the first letter. */
export const AdminAvatar = ({ name, fallback = "U" }) => (
  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-tint text-primary-text flex items-center justify-center font-bold text-sm">
    {name ? name.charAt(0).toUpperCase() : fallback}
  </div>
);

/** Inline warning inside a dialog. tone "warning" (default) | "danger". */
export const AdminCallout = ({ tone = "warning", children }) => (
  <div
    className={`p-3 mb-4 rounded-card border text-xs flex items-center gap-2 ${
      tone === "danger"
        ? "border-danger/30 bg-danger/10 text-danger"
        : "border-warning/30 bg-warning/10 text-warning"
    }`}
  >
    <FiAlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
    <span>{children}</span>
  </div>
);
