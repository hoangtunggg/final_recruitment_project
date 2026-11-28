import { useTranslation } from "react-i18next";
import { cx } from "./ui-styles";

/**
 * Logo + "JobPortal" wordmark (Figma: light "Job" + bold teal "Portal").
 * Props: showTagline (small line under the name), size "md" | "lg", className.
 * Not a link itself: wrap it in <Link> where needed. Shrinks a little below `sm`.
 */
const Brand = ({ showTagline = false, size = "md", className = "" }) => {
  const { t } = useTranslation("common");
  const large = size === "lg";
  return (
    <span className={cx("inline-flex items-center gap-2.5", className)}>
      <img
        src="/logo.png"
        alt={t("app.logoAlt")}
        className={cx(
          "shrink-0 object-contain",
          large ? "h-12 w-12" : "h-9 w-9 sm:h-10 sm:w-10"
        )}
      />
      <span className="flex flex-col leading-tight">
        <span
          className={cx(
            "font-normal tracking-tight text-ink",
            large ? "text-3xl" : "text-xl sm:text-2xl"
          )}
        >
          Job<b className="font-bold text-primary-text">Portal</b>
        </span>
        {showTagline && (
          <span className="hidden text-[11px] font-semibold uppercase tracking-wider text-muted sm:block">
            {t("app.tagline")}
          </span>
        )}
      </span>
    </span>
  );
};

export default Brand;
