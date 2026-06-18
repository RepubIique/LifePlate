import assert from "node:assert/strict";
import test from "node:test";
import {
  dateKeyFromIso,
  formatLogDateLabel,
  isValidLogDateKey,
  loggedAtForDateKey,
  recentLogDateKeys,
  todayDateKey,
} from "../dist/logDate.js";

const NOW = new Date("2026-06-14T12:00:00.000Z");

test("todayDateKey returns local calendar date", () => {
  assert.equal(todayDateKey(NOW), "2026-06-14");
});

test("dateKeyFromIso extracts local date from ISO string", () => {
  assert.equal(dateKeyFromIso("2026-06-10T12:00:00.000Z"), "2026-06-10");
});

test("isValidLogDateKey rejects malformed, future, and too-old dates", () => {
  assert.equal(isValidLogDateKey("bad-date", NOW), false);
  assert.equal(isValidLogDateKey("2026-06-15", NOW), false);
  assert.equal(isValidLogDateKey("2026-03-14", NOW), false);
  assert.equal(isValidLogDateKey("2026-06-14", NOW), true);
  assert.equal(isValidLogDateKey("2026-03-16", NOW), true);
});

test("loggedAtForDateKey keeps local date for meal types", () => {
  for (const mealType of ["breakfast", "lunch", "dinner", "snack", "beverage", null]) {
    const iso = loggedAtForDateKey("2026-06-10", mealType);
    assert.equal(dateKeyFromIso(iso), "2026-06-10", `mealType=${mealType}`);
  }
});

test("recentLogDateKeys returns newest-first keys", () => {
  const keys = recentLogDateKeys(3, NOW);
  assert.deepEqual(keys, ["2026-06-14", "2026-06-13", "2026-06-12"]);
});

test("formatLogDateLabel returns Today, Yesterday, or formatted date", () => {
  assert.equal(formatLogDateLabel("2026-06-14", NOW), "Today");
  assert.equal(formatLogDateLabel("2026-06-13", NOW), "Yesterday");
  const label = formatLogDateLabel("2026-06-10", NOW);
  assert.match(label, /Jun/);
  assert.match(label, /10/);
});

test("loggedAtForDateKey preserves local calendar date for early-morning meals", () => {
  const earlyMorning = new Date(2026, 5, 18, 2, 0, 0, 0);
  const dateKey = todayDateKey(earlyMorning);
  const iso = loggedAtForDateKey(dateKey, "lunch");
  assert.equal(dateKeyFromIso(iso), dateKey);
});
