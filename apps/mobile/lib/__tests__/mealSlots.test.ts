import assert from "node:assert/strict";
import test from "node:test";
import type { MealListSummary } from "@lifeplate/shared";
import { dateKeyFromIso } from "@lifeplate/shared";
import {
  getFilledSlots,
  getSuggestedSlot,
  mealMatchesSlot,
  mealsShareDisplaySlot,
  sortMealsByDaySlots,
} from "../mealSlots";

function summary(
  id: string,
  mealName: string,
  mealType: string,
  createdAt: string,
): MealListSummary {
  return {
    id,
    mealName,
    mealType,
    imageUrl: "",
    createdAt,
    logDate: dateKeyFromIso(createdAt),
    sortIndex: 0,
  };
}

test("mealMatchesSlot treats beverages and desserts as snack", () => {
  assert.equal(mealMatchesSlot("beverage", "snack"), true);
  assert.equal(mealMatchesSlot("dessert", "snack"), true);
  assert.equal(mealMatchesSlot("lunch", "breakfast"), false);
  assert.equal(mealMatchesSlot(null, "lunch"), false);
});

test("getFilledSlots marks slots with matching meals", () => {
  const filled = getFilledSlots([
    summary("1", "Oats", "breakfast", "2026-06-14T08:00:00.000Z"),
    summary("2", "Pasta", "dinner", "2026-06-14T19:00:00.000Z"),
  ]);
  assert.deepEqual([...filled], ["breakfast", "dinner"]);
});

test("getSuggestedSlot returns inferred slot when empty", () => {
  const lunchTime = new Date("2026-06-14T12:00:00");
  assert.equal(getSuggestedSlot(new Set(), lunchTime), "lunch");
});

test("getSuggestedSlot returns null when lunch is logged but breakfast was skipped", () => {
  const lunchTime = new Date("2026-06-14T12:00:00");
  assert.equal(getSuggestedSlot(new Set(["lunch"]), lunchTime), null);
});

test("getSuggestedSlot does not suggest breakfast after lunch and dinner", () => {
  const evening = new Date("2026-06-14T19:00:00");
  assert.equal(getSuggestedSlot(new Set(["lunch", "dinner"]), evening), null);
});

test("getSuggestedSlot returns null when every slot is filled", () => {
  const lunchTime = new Date("2026-06-14T12:00:00");
  assert.equal(
    getSuggestedSlot(new Set(["breakfast", "lunch", "dinner", "snack"]), lunchTime),
    null,
  );
});

test("sortMealsByDaySlots orders breakfast, lunch, dinner, then snack", () => {
  const ordered = sortMealsByDaySlots([
    summary("3", "Pasta", "dinner", "2026-06-14T19:00:00.000Z"),
    summary("1", "Oats", "breakfast", "2026-06-14T08:00:00.000Z"),
    summary("2", "Salad", "lunch", "2026-06-14T12:00:00.000Z"),
    summary("4", "Bar", "snack", "2026-06-14T16:00:00.000Z"),
  ]);
  assert.deepEqual(ordered.map((meal) => meal.id), ["1", "2", "3", "4"]);
});

test("mealsShareDisplaySlot groups snacks and separates core meals", () => {
  const breakfast = summary("1", "Oats", "breakfast", "2026-06-14T08:00:00.000Z");
  const lunch = summary("2", "Salad", "lunch", "2026-06-14T12:00:00.000Z");
  const snackA = summary("3", "Bar", "snack", "2026-06-14T16:00:00.000Z");
  const snackB = summary("4", "Tea", "beverage", "2026-06-14T17:00:00.000Z");

  assert.equal(mealsShareDisplaySlot(breakfast, lunch), false);
  assert.equal(mealsShareDisplaySlot(snackA, snackB), true);
});
