// Low-level HTTP client of the AI interview page (ported from the AI repo's interview-api.js).
// Everything goes through the JobPortal gateway:  ${API_URL}/interviews/ai/<x>  (ai-service),
// ${API_URL}/interviews/voice/<x> (voice-service) and ${API_URL}/interviews/quota. The browser only ever sends
// the user's JWT; the internal tokens of the AI services stay in interview-service.
import { API_URL } from "../utils/apiConfig";

export const aiUrl = (path) => `${API_URL}/interviews/ai/${path}`;
export const voiceUrl = (path) => `${API_URL}/interviews/voice/${path}`;
export const quotaUrl = () => `${API_URL}/interviews/quota`;
export const jobUrl = (id) => `${API_URL}/jobs/${encodeURIComponent(id)}`;

/** Error carrying what the UI needs: HTTP status, machine code and the API's own (Vietnamese) message. */
export class InterviewApiError extends Error {
  constructor(message, { status, code, serverMessage, stream = false } = {}) {
    super(message);
    this.name = "InterviewApiError";
    this.status = status;
    this.code = code;
    this.serverMessage = serverMessage;
    this.stream = stream; // true: the SSE stream broke or reported an error event
  }
}

const authHeaders = (json) => {
  const headers = json ? { "Content-Type": "application/json" } : {};
  const token = localStorage.getItem("token");
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

// ai-service errors look like {error: "<code>", message: "<vi text>"}; interview-service ones like
// {success: false, error: "<english text>", code?: "<code>"}. Gateway 502/504 pages may not be JSON at all.
async function toApiError(response) {
  const raw = await response.text();
  let body = {};
  try {
    body = JSON.parse(raw);
  } catch {
    /* not JSON */
  }
  const looksLikeCode =
    typeof body.error === "string" && /^[a-z][a-z0-9_]*$/.test(body.error);
  const code = body.code || (looksLikeCode ? body.error : undefined);
  const serverMessage =
    typeof body.message === "string" ? body.message : undefined;
  return new InterviewApiError(serverMessage || `HTTP ${response.status}`, {
    status: response.status,
    code,
    serverMessage,
  });
}

async function request(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) throw await toApiError(response);
  return response;
}

export async function getJson(url, signal) {
  const response = await request(url, { headers: authHeaders(false), signal });
  return response.json();
}

export async function postJson(url, body, signal) {
  const response = await request(url, {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify(body),
    signal,
  });
  return response.json();
}

/** multipart upload: the browser sets the boundary, so no Content-Type here. */
export async function postForm(url, form, signal) {
  const response = await request(url, {
    method: "POST",
    headers: authHeaders(false),
    body: form,
    signal,
  });
  return response.json();
}

/** POST that returns a binary body (TTS audio). */
export async function postForBlob(url, body, signal) {
  const response = await request(url, {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify(body),
    signal,
  });
  return response.blob();
}

/**
 * POST + read Server-Sent Events (EventSource cannot POST). Calls onEvent(name, payload) per event,
 * resolves with the payload of the `done` event and throws on an `error` event or a stream cut before `done`.
 */
export async function postSse(url, body, onEvent, signal) {
  const response = await request(url, {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify(body),
    signal,
  });
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let done = null;
  try {
    for (;;) {
      const { value, done: finished } = await reader.read();
      if (finished) break;
      buffer += decoder.decode(value, { stream: true });
      let end;
      while ((end = buffer.indexOf("\n\n")) >= 0) {
        const block = buffer.slice(0, end);
        buffer = buffer.slice(end + 2);
        let name = "";
        let data = "{}";
        for (const line of block.split("\n")) {
          if (line.startsWith("event: ")) name = line.slice(7);
          else if (line.startsWith("data: ")) data = line.slice(6);
        }
        const payload = JSON.parse(data);
        if (name === "error") {
          throw new InterviewApiError(payload.message, {
            code: payload.errorCode,
            stream: true,
          });
        }
        if (name === "done") done = payload;
        onEvent(name, payload);
      }
    }
  } finally {
    // Error event, bad JSON or a throwing handler: stop reading so the upstream LLM stream is cancelled too.
    reader.cancel().catch(() => {});
  }
  if (!done) throw new InterviewApiError("stream_cut", { stream: true });
  return done;
}
