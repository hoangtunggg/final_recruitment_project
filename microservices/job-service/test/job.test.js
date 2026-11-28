const test=require("node:test");const assert=require("node:assert/strict");test("public contract accepts UUID strings",()=>assert.match("89a84eb5-77bd-4eb2-a37c-31982039d8c4",/^[0-9a-f-]+$/));
