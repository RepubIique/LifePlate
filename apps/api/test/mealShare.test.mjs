import assert from "node:assert/strict";
import test from "node:test";
import { scaleMealForPortions } from "@lifeplate/shared";

test("equal split macros for three people sharing one dish", () => {
  const base = {
    estimatedCalories: 900,
    protein: 30,
    carbs: 90,
    fat: 30,
    fibre: 9,
    sugar: 12,
    sodium: 600,
  };
  const oneShare = scaleMealForPortions(base, 3, 1);
  assert.equal(oneShare.estimatedCalories, 300);
  assert.equal(oneShare.protein, 10);
});
