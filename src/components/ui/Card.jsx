import { cx } from "./ui-styles";

const TONES = {
  default: "border-tint-line bg-surface",
  tint: "border-tint-line bg-tint", // Figma teal card
  grey: "border-line-strong bg-neutral-50 dark:bg-surface", // Figma grey card
};

const PADDING = {
  none: "",
  sm: "p-4",
  md: "p-5 sm:p-6",
  lg: "p-6 sm:p-10",
};

/**
 * Card with the Figma soft offset shadow and one softer corner (rounded-card).
 * Props:
 *  - tone        "default" | "tint" | "grey"        (default "default")
 *  - padding     "none" | "sm" | "md" | "lg"        (default "md")
 *  - shadow      boolean, offset shadow             (default true)
 *  - interactive boolean, hover lift + pointer      (default false; for clickable cards)
 *  - as          element/component                  (default "div"), className, ...rest
 */
const Card = ({
  tone = "default",
  padding = "md",
  shadow = true,
  interactive = false,
  as = "div",
  className = "",
  children,
  ...rest
}) => {
  const Component = as;
  return (
    <Component
      className={cx(
        "rounded-card border text-ink",
        TONES[tone] || TONES.default,
        PADDING[padding] ?? PADDING.md,
        shadow && "shadow-card",
        interactive &&
          "cursor-pointer transition-shadow duration-200 hover:shadow-card-hover",
        className
      )}
      {...rest}
    >
      {children}
    </Component>
  );
};

export default Card;
