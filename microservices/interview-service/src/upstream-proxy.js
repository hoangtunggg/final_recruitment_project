// Forward one browser request to ai-service or voice-service with the internal token added server side.
// The browser never sees AI_SERVICE_INTERNAL_TOKEN / VOICE_SERVICE_INTERNAL_TOKEN. Bodies and responses are streamed
// so SSE turns (text/event-stream) and TTS audio reach the client as they are produced.
const { Readable } = require("node:stream");

// Stateless endpoints the interview page needs; everything else is 404 so this service is not an open relay.
// NEVER add start / next-turn / finalize here: they have explicit routes with quota + ownership checks (server.js).
const ROUTES = {
  ai: {
    "GET stt/phrases": "/api/stt/phrases",
    "POST cv/parse": "/api/cv/parse",
    "POST jd/parse": "/api/jd/parse",
  },
  voice: {
    "GET health": "/api/health",
    "POST transcribe": "/api/voice/transcribe",
    "POST speak": "/api/voice/speak",
    "POST session-summary": "/api/voice/session-summary",
  },
};

const UPSTREAMS = {
  ai: { url: () => process.env.AI_SERVICE_URL, token: () => process.env.AI_SERVICE_INTERNAL_TOKEN },
  voice: { url: () => process.env.VOICE_SERVICE_URL, token: () => process.env.VOICE_SERVICE_INTERNAL_TOKEN },
};

const TIMEOUT_MS = Number(process.env.UPSTREAM_TIMEOUT_MS || 120000); // a full LLM turn or a Blaze STT call + retry

function resolveRoute(target, method, path) {
  const routes = ROUTES[target];
  return routes ? routes[`${method} ${path}`] || null : null;
}

// JSON bodies were already parsed by the service kit (express.json); multipart is still an unread stream.
function requestBody(req) {
  if (req.method === "GET") return {};
  if (req.is("application/json")) return { body: JSON.stringify(req.body ?? {}), contentType: "application/json" };
  const length = req.headers["content-length"];
  return { body: Readable.toWeb(req), contentType: req.headers["content-type"], length, duplex: "half" };
}

async function forward(req, res, target, upstreamPath) {
  const upstream = UPSTREAMS[target];
  const base = upstream.url();
  if (!base) return res.status(503).json({ success: false, error: `${target}-service is not configured` });
  const query = req.originalUrl.includes("?") ? req.originalUrl.slice(req.originalUrl.indexOf("?")) : "";
  const { body, contentType, length, duplex } = requestBody(req);
  const headers = { "X-Internal-Token": upstream.token() || "", "X-Request-ID": req.id };
  if (contentType) headers["Content-Type"] = contentType;
  if (length) headers["Content-Length"] = length;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  res.on("close", () => controller.abort()); // tab closed: stop the LLM / Blaze call instead of paying for it
  let response;
  try {
    response = await fetch(`${base.replace(/\/$/, "")}${upstreamPath}${query}`, {
      method: req.method, headers, body, duplex, signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timer);
    if (res.headersSent || res.writableEnded) return;
    const timedOut = error.name === "AbortError";
    req.log?.warn({ err: error, target }, "upstream call failed");
    return res.status(timedOut ? 504 : 502).json({
      success: false, error: timedOut ? `${target}-service timed out` : `${target}-service unreachable`,
    });
  }
  // 401/403 from an AI service means OUR internal token is missing or wrong, not that the user's login expired:
  // passing it through would make the web app log the candidate out.
  if (response.status === 401 || response.status === 403) {
    clearTimeout(timer);
    await response.body?.cancel().catch(() => {});
    req.log?.error({ target, status: response.status }, "AI service rejected the internal token");
    res.status(502).json({ success: false, error: `${target}-service rejected the gateway credentials`, code: "upstream_misconfigured" });
    return { ok: false, status: 502 };
  }
  res.status(response.status);
  for (const name of ["content-type", "cache-control"]) {
    const value = response.headers.get(name);
    if (value) res.setHeader(name, value);
  }
  if ((response.headers.get("content-type") || "").startsWith("text/event-stream")) {
    res.setHeader("X-Accel-Buffering", "no"); // NGINX gateway must not hold SSE chunks
  }
  if (!response.body) { clearTimeout(timer); return res.end(); }
  const stream = Readable.fromWeb(response.body);
  stream.on("error", () => res.destroy());
  stream.on("end", () => clearTimeout(timer));
  stream.pipe(res);
  return response;
}

module.exports = { ROUTES, resolveRoute, forward };
