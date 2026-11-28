/**
 * Small hooks shared by every page so nobody hand-rolls enum label maps or locale strings.
 *
 *   const label = useEnumLabel();
 *   label("applicationStatus", "under_review")  // "Đang xem xét" / "Under review"
 *
 *   const locale = useLocale();                 // "vi-VN" | "en-US"
 *   new Date(x).toLocaleDateString(locale)
 */
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

/**
 * Groups (keys under `common:enums`): applicationStatus, jobStatus, approvalStatus,
 * jobType, experienceLevel, userRole. Unknown values fall back to the raw API value,
 * so the value sent to / received from the API is never changed.
 */
export const useEnumLabel = () => {
  const { t } = useTranslation("common");
  return useCallback(
    (group, value) => {
      if (value === undefined || value === null || value === "") return "";
      return t(`enums.${group}.${value}`, { defaultValue: String(value) });
    },
    [t]
  );
};

/** BCP-47 locale for Intl / toLocaleDateString, re-renders when the language changes. */
export const useLocale = () => {
  const { i18n } = useTranslation();
  return (i18n.resolvedLanguage || i18n.language) === "en" ? "en-US" : "vi-VN";
};
