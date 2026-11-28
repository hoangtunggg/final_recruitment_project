/**
 * i18n bootstrap (i18next + react-i18next). Imported once from src/main.jsx.
 *
 * - Default language `vi`, fallback `en`.
 * - The chosen language is stored in localStorage key `lang` and mirrored on <html lang>.
 * - Change language with `i18n.changeLanguage("en")` or the <LanguageToggle /> component.
 */
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import resources, { NAMESPACES } from "./resources";

export const SUPPORTED_LANGUAGES = ["vi", "en"];
export const DEFAULT_LANGUAGE = "vi";
export const LANGUAGE_STORAGE_KEY = "lang";

const readStoredLanguage = () => {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return SUPPORTED_LANGUAGES.includes(stored) ? stored : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
};

i18n.use(initReactI18next).init({
  resources,
  lng: readStoredLanguage(),
  fallbackLng: "en",
  supportedLngs: SUPPORTED_LANGUAGES,
  ns: NAMESPACES,
  defaultNS: "common",
  interpolation: { escapeValue: false }, // React already escapes
  returnNull: false,
  react: { useSuspense: false }, // resources are bundled, nothing to wait for
  // In dev, tell translators which keys still fall back to another language.
  saveMissing: import.meta.env.DEV,
  missingKeyHandler: (languages, namespace, key) => {
    console.warn(`[i18n] missing ${languages.join(",")} key "${namespace}:${key}"`);
  },
});

// Keep storage and <html lang> in sync with whatever language is active.
const syncLanguage = (language) => {
  document.documentElement.lang = language;
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    /* storage unavailable (private mode): language still works for this session */
  }
};
i18n.on("languageChanged", syncLanguage);
syncLanguage(i18n.language);

export default i18n;
