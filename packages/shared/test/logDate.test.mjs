import assert from "node:assert/strict";
import test from "node:test";
import {
  applyMealSortIndices,
  compareMealsTimeline,
  dateKeyFromIso,
  formatLogDateLabel,
  isValidLogDateKey,
  loggedAtForDateKey,
  mergeLoggedAtDateKey,
  setLoggedAtTime,
  clampLoggedAtToNow,
  offsetLogDateKey,
  recentLogDateKeys,
  todayDateKey,
  monthStartKey,
  monthEndKey,
  previousMonthStartKey,
  previousMonthEndKey,
  enumerateLogDateKeys,
  formatMonthLabel,
  isValidPlanDateKey,
  planHorizonEndKey,
  planWeekDateKeys,
  upcomingPlanDateKeys,
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
  assert.equal(isValidLogDateKey("2026-06-03", NOW), false);
  assert.equal(isValidLogDateKey("2026-06-14", NOW), true);
  assert.equal(isValidLogDateKey("2026-06-04", NOW), true);
});

test("isValidLogDateKey allows paid users to log further back", async () => {
  const { isValidLogDateKeyForUser } = await import("../dist/logDate.js");
  assert.equal(isValidLogDateKeyForUser("2026-06-03", false, NOW), false);
  assert.equal(isValidLogDateKeyForUser("2026-03-14", false, NOW), false);
  assert.equal(isValidLogDateKeyForUser("2026-03-05", true, NOW), false);
  assert.equal(isValidLogDateKeyForUser("2026-03-06", true, NOW), true);
  assert.equal(isValidLogDateKeyForUser("2026-03-14", true, NOW), true);
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

test("mergeLoggedAtDateKey keeps time when changing calendar date", () => {
  const source = new Date(2026, 5, 10, 17, 30, 0, 0).toISOString();
  const merged = mergeLoggedAtDateKey("2026-06-12", source);
  assert.equal(dateKeyFromIso(merged), "2026-06-12");
  const d = new Date(merged);
  assert.equal(d.getHours(), 17);
  assert.equal(d.getMinutes(), 30);
});

test("setLoggedAtTime updates clock without changing date", () => {
  const source = new Date(2026, 5, 10, 8, 0, 0, 0).toISOString();
  const next = setLoggedAtTime(source, 13, 45);
  assert.equal(dateKeyFromIso(next), "2026-06-10");
  const d = new Date(next);
  assert.equal(d.getHours(), 13);
  assert.equal(d.getMinutes(), 45);
});

test("clampLoggedAtToNow caps future times on today", () => {
  const now = new Date(2026, 5, 14, 15, 0, 0, 0);
  const future = clampLoggedAtToNow(new Date(2026, 5, 14, 20, 0, 0, 0).toISOString(), now);
  assert.equal(future, now.toISOString());
  const past = clampLoggedAtToNow(new Date(2026, 5, 14, 10, 0, 0, 0).toISOString(), now);
  assert.equal(past, new Date(2026, 5, 14, 10, 0, 0, 0).toISOString());
});

test("loggedAtForDateKey preserves local calendar date for early-morning meals", () => {
  const earlyMorning = new Date(2026, 5, 18, 2, 0, 0, 0);
  const dateKey = todayDateKey(earlyMorning);
  const iso = loggedAtForDateKey(dateKey, "lunch");
  assert.equal(dateKeyFromIso(iso), dateKey);
});

test("applyMealSortIndices assigns sortIndex without changing createdAt", () => {
  const dayMeals = [
    { id: "a", createdAt: "2026-06-10T12:00:00.000Z", sortIndex: 0 },
    { id: "b", createdAt: "2026-06-10T11:00:00.000Z", sortIndex: 1 },
    { id: "c", createdAt: "2026-06-10T10:00:00.000Z", sortIndex: 2 },
  ];
  const reordered = applyMealSortIndices([
    dayMeals[2],
    dayMeals[0],
    dayMeals[1],
  ]);
  assert.deepEqual(
    reordered.map((meal) => meal.createdAt),
    [
      "2026-06-10T10:00:00.000Z",
      "2026-06-10T12:00:00.000Z",
      "2026-06-10T11:00:00.000Z",
    ],
  );
  assert.deepEqual(
    reordered.map((meal) => meal.sortIndex),
    [0, 1, 2],
  );
});

test("applyMealSortIndices preserves meal fields besides sortIndex", () => {
  const dayMeals = [
    { id: "a", mealName: "Breakfast", createdAt: "2026-06-10T08:00:00.000Z", sortIndex: 1 },
    { id: "b", mealName: "Dinner", createdAt: "2026-06-10T20:00:00.000Z", sortIndex: 0 },
  ];
  const reordered = applyMealSortIndices([dayMeals[0], dayMeals[1]]);
  assert.equal(reordered[0].id, "a");
  assert.equal(reordered[0].mealName, "Breakfast");
  assert.equal(reordered[0].sortIndex, 0);
  assert.equal(reordered[1].id, "b");
  assert.equal(reordered[1].mealName, "Dinner");
  assert.equal(reordered[1].sortIndex, 1);
});

test("compareMealsTimeline orders by logDate then sortIndex", () => {
  const meals = [
    { createdAt: "2026-06-09T12:00:00.000Z", logDate: "2026-06-09", sortIndex: 0 },
    { createdAt: "2026-06-10T08:00:00.000Z", logDate: "2026-06-10", sortIndex: 1 },
    { createdAt: "2026-06-10T20:00:00.000Z", logDate: "2026-06-10", sortIndex: 0 },
  ];
  const sorted = [...meals].sort(compareMealsTimeline);
  assert.deepEqual(sorted.map((meal) => meal.sortIndex), [0, 1, 0]);
  assert.equal(sorted[0].logDate, "2026-06-10");
});

test("isValidPlanDateKey accepts only future dates within horizon", () => {
  assert.equal(isValidPlanDateKey("2026-06-14", NOW), false);
  assert.equal(isValidPlanDateKey("2026-06-15", NOW), true);
  assert.equal(isValidPlanDateKey("2026-06-28", NOW), true);
  assert.equal(isValidPlanDateKey("2026-06-29", NOW), false);
  assert.equal(planHorizonEndKey(NOW), "2026-06-28");
});

test("upcomingPlanDateKeys lists tomorrow through horizon", () => {
  const keys = upcomingPlanDateKeys(14, NOW);
  assert.deepEqual(keys[0], "2026-06-15");
  assert.equal(keys.at(-1), "2026-06-28");
  assert.equal(keys.length, 14);
});

test("planWeekDateKeys returns Monday through Sunday", () => {
  assert.deepEqual(planWeekDateKeys("2026-06-14"), [
    "2026-06-08",
    "2026-06-09",
    "2026-06-10",
    "2026-06-11",
    "2026-06-12",
    "2026-06-13",
    "2026-06-14",
  ]);
});

test("month helpers derive calendar month boundaries", () => {
  assert.equal(monthStartKey("2026-06-14"), "2026-06-01");
  assert.equal(monthEndKey("2026-06-14", NOW), "2026-06-14");
  assert.equal(monthEndKey("2026-05-10", NOW), "2026-05-31");
  assert.equal(previousMonthStartKey("2026-06-14"), "2026-05-01");
  assert.equal(previousMonthEndKey("2026-06-14"), "2026-05-31");
  assert.deepEqual(enumerateLogDateKeys("2026-06-12", "2026-06-14"), [
    "2026-06-12",
    "2026-06-13",
    "2026-06-14",
  ]);
  assert.equal(formatMonthLabel("2026-06-14", NOW), "This month");
  assert.equal(formatMonthLabel("2026-05-01", NOW), "Last month");
});
