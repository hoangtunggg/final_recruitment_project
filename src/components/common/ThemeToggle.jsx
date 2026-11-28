import { FiSun, FiMoon } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";

const SIZES = {
  sm: { box: "h-10 min-w-10 px-2", icon: "h-4 w-4" },
  md: { box: "h-11 min-w-11 px-2.5", icon: "h-5 w-5" },
  lg: { box: "h-12 min-w-12 px-3", icon: "h-6 w-6" },
};

/**
 * Light/dark switch. Props: className, showLabel (text next to the icon), size "sm" | "md" | "lg".
 * Label text lives in the `common` namespace (theme.*).
 */
const ThemeToggle = ({ className = "", showLabel = false, size = "md" }) => {
  const { isDark, toggleTheme } = useTheme();
  const { t } = useTranslation("common");
  const { box, icon } = SIZES[size] || SIZES.md;
  const label = isDark ? t("theme.switchToLight") : t("theme.switchToDark");

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-pill border border-transparent text-muted transition-colors hover:border-line hover:bg-tint hover:text-ink ${box} ${className}`}
      aria-label={label}
      title={label}
      data-testid="theme-toggle-btn"
    >
      {isDark ? (
        <FiSun className={`${icon} text-amber-400`} aria-hidden="true" />
      ) : (
        <FiMoon className={icon} aria-hidden="true" />
      )}
      {showLabel && (
        <span className="text-sm font-semibold">
          {isDark ? t("theme.light") : t("theme.dark")}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;
