import assert from "node:assert/strict";
import test from "node:test";
import { computeStreaksFromDayKeys } from "../dist/services/streaks.js";

function dayOffset(offset) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}

test("computeStreaksFromDayKeys returns zeros for empty input", () => {
  assert.deepEqual(computeStreaksFromDayKeys([]), { current: 0, longest: 0 });
});

test("computeStreaksFromDayKeys finds longest consecutive run", () => {
  const result = computeStreaksFromDayKeys([
    dayOffset(-10),
    dayOffset(-9),
    dayOffset(-8),
    dayOffset(-5),
    dayOffset(-4),
  ]);
  assert.equal(result.longest, 3);
});

test("computeStreaksFromDayKeys counts current streak from today backward", () => {
  const result = computeStreaksFromDayKeys([dayOffset(-1), dayOffset(0)]);
  assert.equal(result.current, 2);
});

test("computeStreaksFromDayKeys dedupes duplicate day keys", () => {
  const today = dayOffset(0);
  const result = computeStreaksFromDayKeys([today, today, dayOffset(-1)]);
  assert.equal(result.current, 2);
  assert.equal(result.longest, 2);
});

test("computeStreaksFromDayKeys breaks current streak when today is missing", () => {
  const result = computeStreaksFromDayKeys([dayOffset(-2), dayOffset(-1)]);
  assert.equal(result.current, 0);
  assert.equal(result.longest, 2);
});
