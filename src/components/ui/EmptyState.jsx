import { cx } from "./ui-styles";

/**
 * Actionable empty / error state.
 * Props: icon (node), title (required), description, action (node, e.g. a <Button>), className.
 */
const EmptyState = ({ icon, title, description, action, className = "" }) => (
  <div
    className={cx(
      "flex flex-col items-center rounded-card border border-dashed border-tint-line bg-tint px-6 py-10 text-center",
      className
    )}
  >
    {icon && (
      <span
        aria-hidden="true"
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-2xl text-primary-700 dark:bg-primary-900/50 dark:text-primary-300"
      >
        {icon}
      </span>
    )}
    <h3 className="text-lg font-bold text-ink">{title}</h3>
    {description && <p className="mt-1 max-w-md text-muted">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export default EmptyState;
