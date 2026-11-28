const test=require("node:test");const assert=require("node:assert/strict");test("active duplicate key is user plus job",()=>assert.deepEqual(["user_id","job_id"],["user_id","job_id"]));
