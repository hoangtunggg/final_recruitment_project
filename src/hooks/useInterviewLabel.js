// Label lookup for API enum values (phase, verdict, priority ...): `interview:<group>.<value>`, falling back to
// the raw value when the API sends something this version does not know yet (never hides information).
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

export default function useInterviewLabel() {
  const { t, i18n } = useTranslation("interview");
  return useCallback(
    (group, value) => {
      if (value === undefined || value === null || value === "") return "";
      const key = `${group}.${value}`;
      return i18n.exists(`interview:${key}`) ? t(key) : String(value);
    },
    [t, i18n]
  );
}
