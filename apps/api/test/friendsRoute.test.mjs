import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

test("GET /api/friends route uses combined social response", () => {
  const source = readFileSync(join(__dirname, "../src/routes/friends.ts"), "utf-8");
  assert.match(source, /getFriendsSocialResponse/);
  assert.match(source, /getFriendProfile/);
  assert.doesNotMatch(source, /getFriendsListResponse/);
});
