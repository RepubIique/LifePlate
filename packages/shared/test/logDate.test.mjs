import assert from "node:assert/strict";
import test from "node:test";
import {
  applyMealOrderTimestamps,
  dateKeyFromIso,
  formatLogDateLabel,
  isValidLogDateKey,
  loggedAtForDateKey,
  createdAtForDayPosition,
  offsetLogDateKey,
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

test("offsetLogDateKey shifts calendar dates", () => {
  assert.equal(offsetLogDateKey("2026-06-14", -1), "2026-06-13");
  assert.equal(offsetLogDateKey("2026-06-01", -1), "2026-05-31");
});

test("loggedAtForDateKey preserves local calendar date for early-morning meals", () => {
  const earlyMorning = new Date(2026, 5, 18, 2, 0, 0, 0);
  const dateKey = todayDateKey(earlyMorning);
  const iso = loggedAtForDateKey(dateKey, "lunch");
  assert.equal(dateKeyFromIso(iso), dateKey);
});

test("createdAtForDayPosition keeps top timeline slot latest within the day", () => {
  const first = createdAtForDayPosition("2026-06-10", 0, 3);
  const last = createdAtForDayPosition("2026-06-10", 2, 3);
  assert.equal(dateKeyFromIso(first), "2026-06-10");
  assert.equal(dateKeyFromIso(last), "2026-06-10");
  assert.ok(new Date(first).getTime() > new Date(last).getTime());
});

test("applyMealOrderTimestamps only permutes existing timestamps", () => {
  const dayMeals = [
    { id: "a", createdAt: "2026-06-10T12:00:00.000Z" },
    { id: "b", createdAt: "2026-06-10T11:00:00.000Z" },
    { id: "c", createdAt: "2026-06-10T10:00:00.000Z" },
  ];
  const reordered = applyMealOrderTimestamps(
    [dayMeals[2], dayMeals[0], dayMeals[1]],
    dayMeals,
  );
  assert.deepEqual(
    reordered.map((meal) => meal.createdAt).sort(),
    dayMeals.map((meal) => meal.createdAt).sort(),
  );
  assert.equal(reordered[0].createdAt, "2026-06-10T12:00:00.000Z");
  assert.equal(reordered[1].createdAt, "2026-06-10T11:00:00.000Z");
  assert.equal(reordered[2].createdAt, "2026-06-10T10:00:00.000Z");
});
