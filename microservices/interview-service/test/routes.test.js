const test = require("node:test");
const assert = require("node:assert");
const { resolveRoute } = require("../src/upstream-proxy");

test("allowlist maps only the interview endpoints", () => {
  assert.equal(resolveRoute("ai", "POST", "cv/parse"), "/api/cv/parse");
  assert.equal(resolveRoute("voice", "POST", "transcribe"), "/api/voice/transcribe");
  assert.equal(resolveRoute("ai", "GET", "cv/parse"), null);
  assert.equal(resolveRoute("ai", "POST", "admin/reindex"), null);
  assert.equal(resolveRoute("other", "GET", "health"), null);
});
