import { cx } from "./ui-styles";

const SIZES = { sm: "h-4 w-4 border-2", md: "h-8 w-8 border-[3px]", lg: "h-10 w-10 border-4" };

/**
 * Loading spinner (inherits text colour via border-current).
 * Props: size "sm" | "md" | "lg", label (screen-reader text; when set the spinner is a status region),
 *        className. Without `label` it is purely decorative (aria-hidden).
 */
const Spinner = ({ size = "md", label, className = "" }) => (
  <span
    role={label ? "status" : undefined}
    aria-hidden={label ? undefined : true}
    className={cx("inline-flex", className)}
  >
    <span
      className={cx(
        "inline-block animate-spin rounded-full border-current border-t-transparent",
        SIZES[size] || SIZES.md
      )}
    />
    {label && <span className="sr-only">{label}</span>}
  </span>
);

export default Spinner;
