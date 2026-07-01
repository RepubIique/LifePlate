import assert from "node:assert/strict";
import test from "node:test";
import {
  isValidPlanDateKey,
  planHorizonEndKey,
  upcomingPlanDateKeys,
} from "@lifeplate/shared";

const NOW = new Date("2026-06-14T12:00:00.000Z");

test("plan date helpers enforce a 14-day future horizon", () => {
  assert.equal(isValidPlanDateKey("2026-06-14", NOW), false);
  assert.equal(isValidPlanDateKey("2026-06-15", NOW), true);
  assert.equal(isValidPlanDateKey("2026-06-28", NOW), true);
  assert.equal(isValidPlanDateKey("2026-06-29", NOW), false);
  assert.equal(planHorizonEndKey(NOW), "2026-06-28");
  assert.equal(upcomingPlanDateKeys(14, NOW).length, 14);
});
