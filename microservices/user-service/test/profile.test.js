const test = require("node:test"); const assert = require("node:assert/strict");
test("UUIDs remain opaque strings", () => assert.equal(Number.isNaN(Number("3ba1e516-0000-4000-8000-000000000001")), true));
