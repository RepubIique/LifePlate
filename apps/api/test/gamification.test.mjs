import assert from "node:assert/strict";
import test from "node:test";
import { computeTogetherStreakFromDayKeys } from "@lifeplate/shared";

test("together streak is zero when friends never log same day", () => {
  assert.equal(
    computeTogetherStreakFromDayKeys(["2026-06-18"], ["2026-06-19"]),
    0,
  );
});
