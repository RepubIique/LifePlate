import assert from "node:assert/strict";
import test from "node:test";
import type { MealListItem } from "@lifeplate/shared";
import { dateKeyFromIso } from "@lifeplate/shared";
import { buildHomeMealsTimeline } from "../homeMealsTimeline";

function meal(
  id: string,
  mealType: string,
  createdAt: string,
  sortIndex = 0,
): MealListItem {
  return {
    id,
    mealName: mealType,
    mealType,
    imageUrl: "",
    createdAt,
    logDate: dateKeyFromIso(createdAt),
    sortIndex,
    calories: null,
    protein: null,
    carbs: null,
    fat: null,
    fibre: null,
    sugar: null,
    sodium: null,
    confidence: null,
    foods: [],
  };
}

test("buildHomeMealsTimeline inserts suggested lunch after breakfast", () => {
  const lunchTime = new Date("2026-06-14T12:00:00");
  const { items, suggestedSlot } = buildHomeMealsTimeline(
    [meal("1", "breakfast", "2026-06-14T08:00:00.000Z")],
    { highlightNextSlot: true, now: lunchTime },
  );

  assert.equal(suggestedSlot, "lunch");
  assert.deepEqual(
    items.map((item) => (item.kind === "meal" ? item.meal.id : item.slot)),
    ["1", "lunch"],
  );
});

test("buildHomeMealsTimeline omits next up after lunch and dinner without breakfast", () => {
  const evening = new Date("2026-06-14T19:00:00");
  const { items, suggestedSlot } = buildHomeMealsTimeline(
    [
      meal("1", "lunch", "2026-06-14T12:00:00.000Z"),
      meal("2", "dinner", "2026-06-14T19:00:00.000Z"),
    ],
    { highlightNextSlot: true, now: evening },
  );

  assert.equal(suggestedSlot, null);
  assert.deepEqual(
    items.map((item) => (item.kind === "meal" ? item.meal.id : item.slot)),
    ["1", "2"],
  );
});

test("buildHomeMealsTimeline shows only suggested slot when nothing is logged", () => {
  const { items, suggestedSlot } = buildHomeMealsTimeline([], {
    highlightNextSlot: true,
  });

  assert.ok(suggestedSlot);
  assert.equal(items.length, 1);
  assert.equal(items[0]?.kind, "suggested");
});

test("buildHomeMealsTimeline skips highlight when disabled", () => {
  const { items, suggestedSlot } = buildHomeMealsTimeline(
    [meal("1", "breakfast", "2026-06-14T08:00:00.000Z")],
    { highlightNextSlot: false },
  );

  assert.equal(suggestedSlot, null);
  assert.deepEqual(
    items.map((item) => item.kind),
    ["meal"],
  );
});
