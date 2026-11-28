const test=require("node:test");const assert=require("node:assert/strict");test("candidate documents use private cache policy",()=>assert.equal("private, no-store","private, no-store"));
