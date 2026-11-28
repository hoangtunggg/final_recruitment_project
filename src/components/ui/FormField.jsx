import { cx } from "./ui-styles";

/**
 * Label + control + hint + error wrapper used by Input / Textarea / Select.
 * `error` is announced politely and shown next to the field (never colour only).
 */
const FormField = ({
  fieldId,
  hintId,
  errorId,
  label,
  hint,
  error,
  required = false,
  className = "",
  children,
}) => (
  <div className={cx("flex flex-col gap-1", className)}>
    {label && (
      <label htmlFor={fieldId} className="text-sm font-medium text-ink">
        {label}
        {required && (
          <span className="ml-0.5 text-danger" aria-hidden="true">
            *
          </span>
        )}
      </label>
    )}
    {children}
    {hint && !error && (
      <p id={hintId} className="text-sm text-muted">
        {hint}
      </p>
    )}
    {error && (
      <p id={errorId} role="alert" className="text-sm font-medium text-danger">
        {error}
      </p>
    )}
  </div>
);

export default FormField;
