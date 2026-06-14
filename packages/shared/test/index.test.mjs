import assert from "node:assert/strict";
import test from "node:test";
import {
  computeNutritionTargets,
  inferMealType,
  isLikelySharedMeal,
  scaleMealForPortions,
} from "../dist/index.js";

const macros = {
  estimatedCalories: 800,
  protein: 40,
  carbs: 80,
  fat: 30,
  fibre: 12,
  sugar: 8,
  sodium: 400,
};

test("computeNutritionTargets returns null when metrics are incomplete", () => {
  assert.equal(
    computeNutritionTargets({
      weightKg: null,
      heightCm: 175,
      age: 30,
      gender: "male",
    }),
    null,
  );
});

test("computeNutritionTargets uses higher protein for protein-focused goals", () => {
  const proteinGoal = computeNutritionTargets(
    { weightKg: 70, heightCm: 175, age: 30, gender: "male" },
    "Increase protein",
  );
  const general = computeNutritionTargets(
    { weightKg: 70, heightCm: 175, age: 30, gender: "male" },
    "General wellbeing",
  );

  assert.ok(proteinGoal);
  assert.ok(general);
  assert.equal(proteinGoal.dailyProteinG, 112);
  assert.equal(general.dailyProteinG, 84);
});

test("scaleMealForPortions scales macros to portions eaten", () => {
  const scaled = scaleMealForPortions(macros, 4, 1);
  assert.equal(scaled.estimatedCalories, 200);
  assert.equal(scaled.protein, 10);
  assert.equal(scaled.carbs, 20);
  assert.equal(scaled.fat, 8);
});

test("isLikelySharedMeal detects multi-serving and high-calorie meals", () => {
  assert.equal(isLikelySharedMeal({ estimatedCalories: 500, estimatedServings: 2 }), true);
  assert.equal(isLikelySharedMeal({ estimatedCalories: 1200 }, 2000), true);
  assert.equal(isLikelySharedMeal({ estimatedCalories: 400, estimatedServings: 1 }, 2000), false);
});

test("inferMealType maps hours to meal categories", () => {
  assert.equal(inferMealType(new Date("2026-06-14T08:00:00")), "breakfast");
  assert.equal(inferMealType(new Date("2026-06-14T12:00:00")), "lunch");
  assert.equal(inferMealType(new Date("2026-06-14T16:00:00")), "snack");
  assert.equal(inferMealType(new Date("2026-06-14T19:00:00")), "dinner");
});
