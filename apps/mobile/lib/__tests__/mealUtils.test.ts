import assert from "node:assert/strict";
import test from "node:test";
import type { MealListSummary } from "@lifeplate/shared";
import { dateKeyFromIso } from "@lifeplate/shared";
import {
  buildTimelineDayGroups,
  capitalize,
  countMealsThisWeek,
  mealTypeIcon,
} from "../mealUtils";

function meal(
  id: string,
  createdAt: string,
  mealType = "lunch",
  sortIndex = 0,
): MealListSummary {
  return {
    id,
    mealName: `Meal ${id}`,
    mealType,
    imageUrl: "",
    createdAt,
    logDate: dateKeyFromIso(createdAt),
    sortIndex,
  };
}

function mealOnLocalDay(
  id: string,
  dateKey: string,
  hour = 12,
  sortIndex = 0,
): MealListSummary {
  const [year, month, day] = dateKey.split("-").map(Number);
  return {
    ...meal(id, new Date(year, month - 1, day, hour, 0, 0, 0).toISOString(), "lunch", sortIndex),
    logDate: dateKey,
  };
}

test("buildTimelineDayGroups groups meals by day and sorts newest first", () => {
  const groups = buildTimelineDayGroups(
    [
      mealOnLocalDay("1", "2026-06-10"),
      mealOnLocalDay("2", "2026-06-12", 12, 1),
      mealOnLocalDay("3", "2026-06-12", 18, 0),
    ],
    { "2026-06-11": 3 },
  );

  assert.equal(groups.length, 3);
  assert.equal(groups[0]?.dateKey, "2026-06-12");
  assert.equal(groups[0]?.meals.length, 2);
  assert.equal(groups[1]?.dateKey, "2026-06-11");
  assert.equal(groups[1]?.hydrationGlasses, 3);
  assert.equal(groups[1]?.meals.length, 0);
});

test("buildTimelineDayGroups sorts meals within a day by sortIndex ascending", () => {
  const groups = buildTimelineDayGroups(
    [
      mealOnLocalDay("early", "2026-06-10", 8, 2),
      mealOnLocalDay("late", "2026-06-10", 20, 0),
      mealOnLocalDay("mid", "2026-06-10", 14, 1),
    ],
    {},
  );

  const day = groups.find((group) => group.dateKey === "2026-06-10");
  assert.ok(day);
  assert.deepEqual(
    day.meals.map((entry) => entry.id),
    ["late", "mid", "early"],
  );
});

test("countMealsThisWeek includes recent meals only", () => {
  const now = new Date();
  const sixDaysAgo = new Date(now);
  sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);
  const eightDaysAgo = new Date(now);
  eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

  const count = countMealsThisWeek([
    meal("recent", sixDaysAgo.toISOString()),
    meal("old", eightDaysAgo.toISOString()),
  ]);
  assert.equal(count, 1);
});

test("mealTypeIcon maps known meal types", () => {
  assert.equal(mealTypeIcon("breakfast"), "weather-sunset-up");
  assert.equal(mealTypeIcon("lunch"), "white-balance-sunny");
  assert.equal(mealTypeIcon("dinner"), "weather-night");
  assert.equal(mealTypeIcon("snack"), "cookie-outline");
  assert.equal(mealTypeIcon("beverage"), "cup-outline");
  assert.equal(mealTypeIcon("unknown"), "silverware-fork-knife");
});

test("capitalize uppercases the first character", () => {
  assert.equal(capitalize("hello"), "Hello");
});
