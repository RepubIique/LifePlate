import assert from "node:assert/strict";
import test from "node:test";
import {
  computeTakeawayPercent,
  countTakeawayMeals,
} from "../dist/services/insightsMetrics.js";

test("computeTakeawayPercent returns zeros when no meals are logged", () => {
  assert.deepEqual(computeTakeawayPercent(0, 0), {
    takeawayPercent: 0,
    homeCookedPercent: 0,
  });
});

test("countTakeawayMeals dedupes takeaway hits per meal", () => {
  const count = countTakeawayMeals([
    { mealId: "meal-1", mealName: "KFC dinner", foodName: "chicken" },
    { mealId: "meal-1", mealName: "KFC dinner", foodName: "coleslaw" },
    { mealId: "meal-2", mealName: "Salad", foodName: "lettuce" },
  ]);
  assert.equal(count, 1);
});

test("computeTakeawayPercent caps at 100 percent", () => {
  assert.deepEqual(computeTakeawayPercent(2, 1), {
    takeawayPercent: 100,
    homeCookedPercent: 0,
  });
});
