import { cx } from "./ui-styles";

/**
 * Page title block (Figma intro: 40px/800 title + muted lead).
 * Props: title (required), subtitle, eyebrow (small teal label above), actions (node, right side),
 *        align "left" | "center" (default "left"), level 1-4 heading level (default 1), className.
 */
const PageHeader = ({
  title,
  subtitle,
  eyebrow,
  actions,
  align = "left",
  level = 1,
  className = "",
}) => {
  const Heading = `h${level}`;
  const centered = align === "center";
  return (
    <header
      className={cx(
        "flex flex-wrap items-end justify-between gap-4",
        centered && "flex-col items-center text-center",
        className
      )}
    >
      <div className={cx("min-w-0 max-w-3xl", centered && "mx-auto")}>
        {eyebrow && (
          <p className="mb-1 text-sm font-semibold uppercase tracking-wider text-primary-text">
            {eyebrow}
          </p>
        )}
        <Heading className="text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
          {title}
        </Heading>
        {subtitle && (
          <p className="mt-2 text-base text-muted sm:text-xl sm:leading-7">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className={cx("flex flex-wrap items-center gap-3", centered && "justify-center")}>
          {actions}
        </div>
      )}
    </header>
  );
};

export default PageHeader;
