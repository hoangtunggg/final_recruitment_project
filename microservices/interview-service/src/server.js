// interview-service: backend-for-frontend between the JobPortal web app and the AI repo's ai-service / voice-service.
// - JWT required (candidates and admins); the internal tokens of the AI services stay here, never in the browser.
// - Each ai-service session id is bound to the user who started it, so nobody can drive or read another user's
//   interview by guessing its id.
// - INTERVIEW_DAILY_LIMIT sessions per user per day: registration is open, and every session spends LLM + speech credit.
const express = require("express");
const { createService, roles, asyncHandler } = require("@jobportal/service-kit");
const { resolveRoute, forward } = require("./upstream-proxy");

const DAILY_LIMIT = Number(process.env.INTERVIEW_DAILY_LIMIT || 3);
const SESSION_ID = /^[A-Za-z0-9_-]{8,128}$/;

async function usedToday(pool, userId) {
  const { rows } = await pool.query(
    "SELECT count(*)::int AS used FROM interview_sessions WHERE user_id=$1 AND started_at >= date_trunc('day', now())",
    [userId]
  );
  return rows[0].used;
}

function router(pool) {
  const r = express.Router();
  r.use(...roles("jobseeker", "admin")); // roles() includes JWT verification

  r.get("/quota", asyncHandler(async (req, res) => {
    const used = await usedToday(pool, req.user.id);
    res.json({ success: true, data: { limit: DAILY_LIMIT, used, remaining: Math.max(DAILY_LIMIT - used, 0) } });
  }));

  // Start: bind the client-chosen session id to this user (re-sending the same id is a retry, not a new session).
  r.post("/ai/start", asyncHandler(async (req, res) => {
    const sessionId = req.body?.session_id;
    if (typeof sessionId !== "string" || !SESSION_ID.test(sessionId)) {
      return res.status(400).json({ success: false, error: "session_id must be 8-128 characters [A-Za-z0-9_-]" });
    }
    const existing = (await pool.query("SELECT user_id FROM interview_sessions WHERE session_id=$1", [sessionId])).rows[0];
    if (existing && existing.user_id !== req.user.id) return res.status(403).json({ success: false, error: "Session belongs to another user" });
    if (!existing) {
      if (await usedToday(pool, req.user.id) >= DAILY_LIMIT) {
        return res.status(429).json({ success: false, error: `Daily limit of ${DAILY_LIMIT} interview sessions reached`, code: "interview_quota_exceeded" });
      }
      const jobId = typeof req.body.job_id === "string" && /^[0-9a-f-]{36}$/i.test(req.body.job_id) ? req.body.job_id : null;
      await pool.query(
        "INSERT INTO interview_sessions(session_id,user_id,track,level,job_id) VALUES($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING",
        [sessionId, req.user.id, String(req.body.track || "").slice(0, 64) || null, String(req.body.level || "").slice(0, 32) || null, jobId]
      );
    }
    const { job_id: _ignored, ...upstreamBody } = req.body; // job_id is ours; ai-service rejects unknown fields
    req.body = upstreamBody;
    const response = await forward(req, res, "ai", "/api/start");
    // Rejected start (bad track, ai-service down...): give the quota back so a typo does not cost a session.
    if (!existing && !response?.ok) {
      await pool.query("DELETE FROM interview_sessions WHERE session_id=$1 AND user_id=$2", [sessionId, req.user.id]);
    }
  }));

  // Later turns: only the owner of the session may continue or finalize it.
  for (const step of ["next-turn", "finalize"]) {
    r.post(`/ai/${step}`, asyncHandler(async (req, res) => {
      const sessionId = req.body?.session_id;
      const owned = typeof sessionId === "string" && (await pool.query(
        "SELECT 1 FROM interview_sessions WHERE session_id=$1 AND user_id=$2", [sessionId, req.user.id]
      )).rowCount > 0;
      if (!owned) return res.status(404).json({ success: false, error: "Interview session not found" });
      const response = await forward(req, res, "ai", `/api/${step}`);
      if (step === "finalize" && response?.ok) {
        await pool.query("UPDATE interview_sessions SET finalized_at=now() WHERE session_id=$1", [sessionId]);
      }
    }));
  }

  // Stateless helpers (CV / JD parsing, STT phrases, speech): allowlisted passthrough.
  r.all("/:target/*path", asyncHandler(async (req, res) => {
    const upstreamPath = resolveRoute(req.params.target, req.method, [].concat(req.params.path).join("/"));
    if (!upstreamPath) return res.status(404).json({ success: false, error: "Route not found" });
    await forward(req, res, req.params.target, upstreamPath);
  }));
  return r;
}

const service = createService({ name: "interview-service", mount: "/api/interviews", router });
service.start().catch((error) => { service.logger.fatal({ err: error }, "startup failed"); process.exit(1); });
