// Resolves a "status descriptor" ({ key, values?, raw?, prefixKey?, tone? }, see services/interviewErrors.js)
// into the active language. `raw` is the API's own Vietnamese sentence: shown only when the UI is Vietnamese.
import { useTranslation } from "react-i18next";

export default function useInterviewStatusText(status) {
  const { t, i18n } = useTranslation("interview");
  if (!status) return "";
  const language = i18n.resolvedLanguage || i18n.language;
  const body = status.raw && language === "vi" ? status.raw : t(status.key, status.values);
  return status.prefixKey ? `${t(status.prefixKey)} ${body}` : body;
}
