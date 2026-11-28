// interview-service: backend-for-frontend between the JobPortal web app and the AI repo's ai-service / voice-service.
// - JWT required (candidates and admins); the internal tokens of the AI services stay here, never in the browser.
// - Each ai-service session id is bound to the user who started it, so nobody can drive or read another user's
//   interview by guessing its id.
// - Daily budgets per user (sessions + paid helper calls): registration is open, every call spends LLM / speech credit.
// The three session endpoints exist ONLY as explicit routes below; the passthrough allowlist never contains them,
// so an encoded path (e.g. /ai/st%61rt) cannot reach ai-service around the quota / ownership checks.
const express = require("express");
const { createService, roles, asyncHandler } = require("@jobportal/service-kit");
const { resolveRoute, forward } = require("./upstream-proxy");
const store = require("./session-store");

const SESSION_ID = /^[A-Za-z0-9_-]{8,128}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CLAIM_ERRORS = {
  forbidden: [403, "Session belongs to another user", "session_forbidden"],
  reused: [409, "This session id was already used; start a new session", "session_id_reused"],
  quota: [429, `Daily limit of ${store.DAILY_LIMIT} interview sessions reached`, "interview_quota_exceeded"],
};

function router(pool) {
  const r = express.Router();
  r.use(...roles("jobseeker", "admin")); // roles() includes JWT verification

  r.get("/quota", asyncHandler(async (req, res) => {
    const used = await store.usedToday(pool, req.user.id);
    const limit = store.DAILY_LIMIT;
    res.json({ success: true, data: { limit, used, remaining: Math.max(limit - used, 0) } });
  }));

  r.post("/ai/start", asyncHandler(async (req, res) => {
    const sessionId = req.body?.session_id;
    if (typeof sessionId !== "string" || !SESSION_ID.test(sessionId)) {
      return res.status(400).json({ success: false, error: "session_id must be 8-128 characters [A-Za-z0-9_-]" });
    }
    const claim = await store.claimSession(pool, {
      sessionId,
      userId: req.user.id,
      track: String(req.body.track || "").slice(0, 64) || null,
      level: String(req.body.level || "").slice(0, 32) || null,
      jobId: typeof req.body.job_id === "string" && UUID.test(req.body.job_id) ? req.body.job_id : null,
    });
    const error = CLAIM_ERRORS[claim.status];
    if (error) return res.status(error[0]).json({ success: false, error: error[1], code: error[2] });

    const { job_id: _ignored, ...upstreamBody } = req.body; // job_id is ours; ai-service rejects unknown fields
    req.body = upstreamBody;
    const response = await forward(req, res, "ai", "/api/start");
    // Rejected start (bad track, ai-service down...): give the slot back, but only if THIS request created it.
    if (claim.status === "new" && !response?.ok) {
      await store.quietly(req.log, "quota refund", () => store.refundSession(pool, sessionId, req.user.id));
    }
  }));

  // Later turns: only the owner of the session may continue or finalize it.
  for (const step of ["next-turn", "finalize"]) {
    r.post(`/ai/${step}`, asyncHandler(async (req, res) => {
      const sessionId = req.body?.session_id;
      if (!(await store.ownsSession(pool, sessionId, req.user.id))) {
        return res.status(404).json({ success: false, error: "Interview session not found" });
      }
      const response = await forward(req, res, "ai", `/api/${step}`);
      if (step === "finalize" && response?.ok) {
        await store.quietly(req.log, "mark finalized", () => store.markFinalized(pool, sessionId));
      }
    }));
  }

  // Stateless paid helpers (CV / JD parsing, STT phrases, speech): allowlisted passthrough with a daily budget.
  r.all("/:target/*path", asyncHandler(async (req, res) => {
    const upstreamPath = resolveRoute(req.params.target, req.method, [].concat(req.params.path).join("/"));
    if (!upstreamPath) return res.status(404).json({ success: false, error: "Route not found" });
    if (req.method === "POST" && !(await store.takeHelperCall(pool, req.user.id))) {
      return res.status(429).json({ success: false, error: "Daily AI helper limit reached", code: "interview_helper_quota_exceeded" });
    }
    await forward(req, res, req.params.target, upstreamPath);
  }));
  return r;
}

const service = createService({ name: "interview-service", mount: "/api/interviews", router });
service.start().catch((error) => { service.logger.fatal({ err: error }, "startup failed"); process.exit(1); });
