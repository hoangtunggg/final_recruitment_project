const test = require("node:test");
const assert = require("node:assert");
const { resolveRoute } = require("../src/upstream-proxy");

test("allowlist maps only the stateless helper endpoints", () => {
  assert.equal(resolveRoute("ai", "POST", "cv/parse"), "/api/cv/parse");
  assert.equal(resolveRoute("voice", "POST", "transcribe"), "/api/voice/transcribe");
  assert.equal(resolveRoute("ai", "GET", "cv/parse"), null);
  assert.equal(resolveRoute("ai", "POST", "admin/reindex"), null);
  assert.equal(resolveRoute("other", "GET", "health"), null);
});

test("session endpoints are never reachable through the passthrough (encoded-path bypass)", () => {
  // Express decodes /ai/st%61rt to params "start": it must NOT resolve, or quota + ownership checks are skipped.
  for (const step of ["start", "next-turn", "finalize"]) assert.equal(resolveRoute("ai", "POST", step), null);
});
