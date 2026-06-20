import assert from "node:assert/strict";
import test from "node:test";
import { currentWeekStartKey } from "../weekInsightsWindow";

test("currentWeekStartKey returns the rolling 7-day window start", () => {
  const now = new Date("2026-06-14T12:00:00");
  assert.equal(currentWeekStartKey(now), "2026-06-08");
});

test("currentWeekStartKey advances when the calendar week rolls", () => {
  const sunday = new Date("2026-06-14T12:00:00");
  const monday = new Date("2026-06-15T12:00:00");
  assert.notEqual(currentWeekStartKey(sunday), currentWeekStartKey(monday));
});
