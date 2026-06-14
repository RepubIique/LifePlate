import assert from "node:assert/strict";
import test from "node:test";
import {
  getFilledSlots,
  getSuggestedSlot,
  mealMatchesSlot,
} from "../mealSlots.ts";

test("mealMatchesSlot treats beverages and desserts as snack", () => {
  assert.equal(mealMatchesSlot("beverage", "snack"), true);
  assert.equal(mealMatchesSlot("dessert", "snack"), true);
  assert.equal(mealMatchesSlot("lunch", "breakfast"), false);
  assert.equal(mealMatchesSlot(null, "lunch"), false);
});

test("getFilledSlots marks slots with matching meals", () => {
  const filled = getFilledSlots([
    { id: "1", mealName: "Oats", mealType: "breakfast", createdAt: "2026-06-14T08:00:00.000Z" },
    { id: "2", mealName: "Pasta", mealType: "dinner", createdAt: "2026-06-14T19:00:00.000Z" },
  ]);
  assert.deepEqual([...filled], ["breakfast", "dinner"]);
});

test("getSuggestedSlot returns inferred slot when empty", () => {
  const lunchTime = new Date("2026-06-14T12:00:00");
  assert.equal(getSuggestedSlot(new Set(), lunchTime), "lunch");
});

test("getSuggestedSlot returns first unfilled slot when inferred is taken", () => {
  const lunchTime = new Date("2026-06-14T12:00:00");
  assert.equal(getSuggestedSlot(new Set(["lunch"]), lunchTime), "breakfast");
});

test("getSuggestedSlot returns null when all slots are filled", () => {
  const lunchTime = new Date("2026-06-14T12:00:00");
  assert.equal(
    getSuggestedSlot(new Set(["breakfast", "lunch", "dinner", "snack"]), lunchTime),
    null,
  );
});
