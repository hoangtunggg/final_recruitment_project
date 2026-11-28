// List readers live in a shared module (admin uses them too); re-exported for existing employer imports.
export { extractApplications, extractTotal } from "../../services/application-list-response";

/**
 * Message worth showing verbatim: the server's `error` text. Transport failures (Axios "Network Error",
 * "Request failed with status code 500") return null so the caller shows its translated fallback instead.
 */
export const serverErrorText = (err) =>
  err?.response?.data?.error || (err?.isAxiosError ? null : err?.message) || null;
