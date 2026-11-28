import { API_BASE_URL } from "./apiConfig";

export const resolveMediaUrl = (value) => {
  if (!value) return null;
  if (/^(https?:|data:|blob:)/i.test(value)) return value;
  const base = API_BASE_URL || window.location.origin;
  return new URL(value, `${base.replace(/\/$/, "")}/`).toString();
};
