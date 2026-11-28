import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES } from "../../i18n";

const SIZES = { sm: "min-h-9 min-w-9 px-2.5 text-xs", md: "min-h-10 min-w-10 px-3 text-sm" };

/**
 * VI | EN segmented switch. Persists to localStorage `lang` and updates <html lang>
 * through the i18n bootstrap (src/i18n/index.js).
 * Props: className, size "sm" | "md" (default "md"), showLabel (full names instead of codes).
 * Test ids: `lang-toggle` (group), `lang-vi`, `lang-en` (buttons, aria-pressed = active).
 */
const LanguageToggle = ({ className = "", size = "md", showLabel = false }) => {
  const { t, i18n } = useTranslation("common");
  const active = i18n.resolvedLanguage || i18n.language;

  return (
    <div
      role="group"
      aria-label={t("language.label")}
      data-testid="lang-toggle"
      className={`inline-flex items-center rounded-pill border border-line bg-surface p-0.5 ${className}`}
    >
      {SUPPORTED_LANGUAGES.map((code) => {
        const isActive = active === code;
        const name = t(`language.${code}`);
        return (
          <button
            key={code}
            type="button"
            lang={code}
            data-testid={`lang-${code}`}
            aria-pressed={isActive}
            aria-label={t("language.switchTo", { language: name })}
            title={name}
            onClick={() => i18n.changeLanguage(code)}
            className={`inline-flex cursor-pointer items-center justify-center rounded-pill font-bold transition-colors ${
              SIZES[size] || SIZES.md
            } ${
              isActive
                ? "bg-primary-600 text-white"
                : "text-muted hover:bg-tint hover:text-ink"
            }`}
          >
            {showLabel ? name : code.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
};

export default LanguageToggle;
