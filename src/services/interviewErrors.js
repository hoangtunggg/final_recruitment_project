// Turns an API / network failure into a "status descriptor" the UI translates when it renders:
//   { key, raw?, prefixKey?, tone }   key = i18n key in the `interview` namespace
// (descriptors, not strings, so a language switch while a message is on screen still re-translates it).
import { InterviewApiError } from "./interviewApiClient";

// Voice / provider problems: one friendly line pointing to the typing fallback.
const VOICE_DOWN_CODES = new Set([
  "voice_service_unreachable",
  "voice_service_timeout",
  "provider_error",
  "provider_timeout",
  "provider_unconfigured",
  "provider_rate_limited",
  "quota_exceeded",
]);

// Codes with their own translated sentence at `errors.codes.<code>`.
const TRANSLATED_CODES = new Set([
  "session_not_found",
  "audio_too_long",
  "invalid_audio",
  "unauthorized",
  "misconfigured",
  "cv_invalid_format",
  "cv_too_large",
  "cv_unreadable",
]);

// Temporary conditions where re-sending the very same turn body is safe (ai-service replays finished turns).
const RETRYABLE_CODES = new Set(["turn_in_progress", "session_store_unavailable"]);

/** True when the user's session token is rejected: the page sends them to the login screen. */
export const isUnauthorized = (error) => error?.status === 401;

/** True for the daily interview quota (429 interview_quota_exceeded). */
export const isQuotaExceeded = (error) => error?.code === "interview_quota_exceeded";

/** Re-sending the same turn can help: network/stream cut, 5xx, or a transient code. Other 4xx will fail again. */
export const canRetryTurn = (error) =>
  error instanceof TypeError ||
  Boolean(error?.stream) ||
  RETRYABLE_CODES.has(error?.code) ||
  (error?.status ?? 500) >= 500;

/**
 * @param {unknown} error caught error
 * @param {string} [prefixKey] optional i18n key whose sentence is shown before the reason
 * @returns {{key: string, raw?: string, prefixKey?: string, tone: "error"}}
 */
export function describeInterviewError(error, prefixKey) {
  const make = (key, extra = {}) => ({ key, prefixKey, tone: "error", ...extra });
  const code = error?.code;
  const status = error?.status;

  if (isUnauthorized(error)) return make("errors.sessionExpired");
  if (isQuotaExceeded(error)) return make("errors.quotaExceeded");
  if (VOICE_DOWN_CODES.has(code)) return make("errors.voiceDown");
  if (TRANSLATED_CODES.has(code)) return make(`errors.codes.${code}`);
  if (error instanceof TypeError) return make("errors.network");
  if (error?.stream) return make("errors.streamCut");
  if (status === 504) return make("errors.timeout");
  if (status === 502 || status === 503) return make("errors.upstream");
  if (status && status < 500 && error instanceof InterviewApiError && error.serverMessage) {
    // The API's own message is Vietnamese; the renderer shows it only in Vietnamese.
    return make("errors.rejected", { raw: error.serverMessage });
  }
  return make("errors.busy");
}
