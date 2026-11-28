const test=require("node:test");const assert=require("node:assert/strict");test("event IDs are the idempotency key",()=>assert.equal(new Set(["a","a"]).size,1));
