// Locale-aware number formatter for report figures: num(7.46) -> "7,5" (vi) / "7.5" (en); "–" when missing.
import { useCallback } from "react";
import { formatNumber } from "../components/interview/interview-format";
import { useLocale } from "../i18n/helpers";

export default function useInterviewNumber() {
  const locale = useLocale();
  return useCallback((value, maxFractionDigits = 1) => formatNumber(value, locale, maxFractionDigits), [locale]);
}
