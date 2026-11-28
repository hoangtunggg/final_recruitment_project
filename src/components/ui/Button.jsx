import Spinner from "./Spinner";
import { cx } from "./ui-styles";

const VARIANTS = {
  // Filled teal (600 keeps white text >= 4.5:1; brand teal 500 is only 3.1:1)
  primary:
    "border-primary-600 bg-primary-600 text-white hover:border-primary-700 hover:bg-primary-700 active:bg-primary-800",
  outline:
    "border-primary-600 bg-surface text-primary-text hover:bg-tint dark:border-primary-400",
  ghost: "border-transparent bg-transparent text-ink hover:bg-tint",
  danger:
    "border-brand-red bg-brand-red text-white hover:border-red-700 hover:bg-red-700",
  link: "min-h-0 border-transparent bg-transparent px-0 text-primary-text underline-offset-4 hover:underline",
};

const SIZES = {
  sm: "min-h-10 px-5 py-1.5 text-sm",
  md: "min-h-11 px-8 py-2 text-base",
  lg: "min-h-12 px-10 py-2.5 text-lg",
};

/**
 * Pill button (Figma "Button").
 * Props:
 *  - variant   "primary" | "outline" | "ghost" | "danger" | "link"   (default "primary")
 *  - size      "sm" | "md" | "lg"                                       (default "md", 44px)
 *  - as        element/component to render, e.g. `as={Link} to="/x"`    (default "button")
 *  - loading   shows a spinner, disables the button and sets aria-busy
 *  - leftIcon / rightIcon   nodes rendered beside the label
 *  - fullWidth, className, disabled, type (defaults to "button"), ...rest (onClick, ref, aria-*)
 */
const Button = ({
  variant = "primary",
  size = "md",
  as: Component = "button",
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled = false,
  className = "",
  children,
  ...rest
}) => {
  const isNativeButton = Component === "button";
  const isDisabled = disabled || loading;
  const classes = cx(
    "inline-flex cursor-pointer select-none items-center justify-center gap-2 rounded-pill border font-semibold",
    "transition-colors duration-200",
    VARIANTS[variant] || VARIANTS.primary,
    variant === "link" ? "" : SIZES[size] || SIZES.md,
    fullWidth && "w-full",
    isDisabled && "pointer-events-none cursor-not-allowed opacity-50",
    className
  );

  return (
    <Component
      {...(isNativeButton ? { type: rest.type ?? "button", disabled: isDisabled } : {})}
      aria-busy={loading || undefined}
      aria-disabled={!isNativeButton && isDisabled ? true : undefined}
      className={classes}
      {...rest}
    >
      {loading ? <Spinner size="sm" /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </Component>
  );
};

export default Button;
