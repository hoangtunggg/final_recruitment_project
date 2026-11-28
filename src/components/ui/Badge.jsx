import { cx } from "./ui-styles";

// All tones keep text >= 4.5:1 on their own tinted background in light and dark mode.
const TONES = {
  neutral: "border-line bg-tint text-muted",
  primary: "border-tint-line bg-primary-50 text-primary-text dark:bg-primary-900/40",
  success: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/10 text-warning",
  danger: "border-danger/30 bg-danger/10 text-danger",
  info: "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-200",
};

const SIZES = { sm: "px-2 py-0.5 text-xs", md: "px-3 py-1 text-sm" };

/**
 * Pill status/label chip. Always pair colour with text (never colour only).
 * Props: tone "neutral" | "primary" | "success" | "warning" | "danger" | "info" (default "neutral"),
 *        size "sm" | "md" (default "md"), dot (leading coloured dot), icon (node), className.
 */
const Badge = ({
  tone = "neutral",
  size = "md",
  dot = false,
  icon,
  className = "",
  children,
  ...rest
}) => (
  <span
    className={cx(
      "inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill border font-semibold",
      TONES[tone] || TONES.neutral,
      SIZES[size] || SIZES.md,
      className
    )}
    {...rest}
  >
    {dot && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />}
    {icon && <span aria-hidden="true">{icon}</span>}
    {children}
  </span>
);

export default Badge;
