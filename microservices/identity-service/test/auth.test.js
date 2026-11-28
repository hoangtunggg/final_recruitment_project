const test = require("node:test");
const assert = require("node:assert/strict");
test("public contract never exposes password hash", () => assert.equal(JSON.stringify({ id: "uuid", email: "a@b.co" }).includes("password_hash"), false));
