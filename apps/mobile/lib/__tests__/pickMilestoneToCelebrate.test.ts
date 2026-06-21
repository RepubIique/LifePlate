import assert from "node:assert/strict";
import test from "node:test";
import { pickMilestoneToCelebrate } from "../pickMilestoneToCelebrate";

test("pickMilestoneToCelebrate returns null when everything eligible was already seen", () => {
  const result = pickMilestoneToCelebrate(["streak_3", "streak_7"], new Set(["streak_3", "streak_7"]));
  assert.equal(result, null);
});

test("pickMilestoneToCelebrate celebrates the highest unseen milestone and marks all catch-up as seen", () => {
  const result = pickMilestoneToCelebrate(
    ["streak_3", "streak_7", "streak_14", "meals_10"],
    new Set(),
  );
  assert.deepEqual(result, {
    celebrate: "meals_10",
    markSeen: ["streak_3", "streak_7", "streak_14", "meals_10"],
  });
});

test("pickMilestoneToCelebrate skips milestones the user already saw", () => {
  const result = pickMilestoneToCelebrate(
    ["streak_3", "streak_7", "streak_14"],
    new Set(["streak_3", "streak_7"]),
  );
  assert.deepEqual(result, {
    celebrate: "streak_14",
    markSeen: ["streak_14"],
  });
});
