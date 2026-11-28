// Postgres bookkeeping for interview-service: who owns which ai-service session, and how much each user spent today.
const { withTransaction } = require("@jobportal/service-kit");

const DAILY_LIMIT = Number(process.env.INTERVIEW_DAILY_LIMIT || 3);
// Paid helper calls (TTS, STT, CV / JD parsing) per user per day. One session ~ 15 turns x (speak + transcribe).
const HELPER_DAILY_LIMIT = Number(process.env.INTERVIEW_HELPER_DAILY_LIMIT || 300);
// Re-sending a start for the same id counts as a retry only shortly after the first try (ai-service /api/start
// re-plans and overwrites the session, so an unlimited retry would be an unlimited free interview).
const RETRY_WINDOW = "5 minutes";

async function usedToday(db, userId) {
  const { rows } = await db.query(
    "SELECT count(*)::int AS used FROM interview_sessions WHERE user_id=$1 AND started_at >= date_trunc('day', now())",
    [userId]
  );
  return rows[0].used;
}

/**
 * Bind a client-chosen session id to the user before forwarding /api/start.
 * Serialised per user (advisory lock) so concurrent starts cannot overshoot the daily limit.
 * Returns { status: "new" | "retry" | "forbidden" | "reused" | "quota" }; only "new" inserted a row (refundable).
 */
async function claimSession(pool, { sessionId, userId, track, level, jobId }) {
  return withTransaction(pool, async (client) => {
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [userId]);
    const existing = (await client.query(
      `SELECT user_id, finalized_at IS NULL AND started_at > now() - interval '${RETRY_WINDOW}' AS retryable
       FROM interview_sessions WHERE session_id=$1`,
      [sessionId]
    )).rows[0];
    if (existing) {
      if (existing.user_id !== userId) return { status: "forbidden" };
      return { status: existing.retryable ? "retry" : "reused" };
    }
    if (await usedToday(client, userId) >= DAILY_LIMIT) return { status: "quota" };
    await client.query(
      "INSERT INTO interview_sessions(session_id,user_id,track,level,job_id) VALUES($1,$2,$3,$4,$5)",
      [sessionId, userId, track, level, jobId]
    );
    return { status: "new" };
  });
}

async function ownsSession(pool, sessionId, userId) {
  if (typeof sessionId !== "string") return false;
  return (await pool.query("SELECT 1 FROM interview_sessions WHERE session_id=$1 AND user_id=$2", [sessionId, userId]))
    .rowCount > 0;
}

/** Counts one paid helper call; false when the user is over today's helper budget. */
async function takeHelperCall(pool, userId) {
  const { rows } = await pool.query(
    `INSERT INTO interview_helper_usage(user_id, day, calls) VALUES($1, current_date, 1)
     ON CONFLICT (user_id, day) DO UPDATE SET calls = interview_helper_usage.calls + 1 RETURNING calls`,
    [userId]
  );
  return rows[0].calls <= HELPER_DAILY_LIMIT;
}

// Bookkeeping that runs while / after a response streams must never throw into the request (headers are sent).
async function quietly(logger, label, work) {
  try { await work(); } catch (error) { logger?.error({ err: error }, `${label} failed`); }
}

const refundSession = (pool, sessionId, userId) =>
  pool.query("DELETE FROM interview_sessions WHERE session_id=$1 AND user_id=$2", [sessionId, userId]);
const markFinalized = (pool, sessionId) =>
  pool.query("UPDATE interview_sessions SET finalized_at=now() WHERE session_id=$1", [sessionId]);

module.exports = {
  DAILY_LIMIT, usedToday, claimSession, ownsSession, takeHelperCall, refundSession, markFinalized, quietly,
};
