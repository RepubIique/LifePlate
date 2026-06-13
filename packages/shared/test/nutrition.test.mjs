import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCoachSummary,
  buildFoodRecommendations,
  classifyFoods,
  computeNutritionGaps,
  computeNutritionScore,
  defaultExtendedNutritionTargets,
  formatMacroEquivalents,
  scoreStatus,
} from "../dist/nutrition/index.js";

const targets = defaultExtendedNutritionTargets();

test("classifyFoods detects plants, fermented, and prebiotic foods", () => {
  const result = classifyFoods(
    ["Greek yoghurt", "berries", "chia seeds", "spinach"],
    ["Breakfast bowl"],
  );

  assert.ok(result.plants.includes("Berries"));
  assert.ok(result.fermented.includes("Yoghurt"));
  assert.ok(result.prebiotic.includes("Chia seeds"));
});

test("computeNutritionScore returns higher score with balanced intake", () => {
  const classification = classifyFoods(
    ["chicken", "broccoli", "berries", "yoghurt", "oats", "banana", "spinach"],
    ["Lunch"],
  );

  const strongScore = computeNutritionScore(
    {
      calories: 1900,
      protein: 70,
      carbs: 180,
      fat: 65,
      fibre: 28,
      mealsCount: 3,
    },
    targets,
    classification,
    7,
  );

  const weakScore = computeNutritionScore(
    {
      calories: 900,
      protein: 20,
      carbs: 90,
      fat: 20,
      fibre: 8,
      mealsCount: 1,
    },
    targets,
    classifyFoods(["white bread"], ["Toast"]),
    2,
  );

  assert.ok(strongScore > weakScore);
  assert.equal(scoreStatus(strongScore), "excellent");
});

test("formatMacroEquivalents returns display labels", () => {
  const equivalents = formatMacroEquivalents(30, "protein");
  assert.equal(equivalents.length, 3);
  assert.ok(equivalents[0].includes("egg"));
});

test("buildFoodRecommendations prioritises fibre and protein gaps", () => {
  const gaps = computeNutritionGaps(
    {
      calories: 1200,
      protein: 25,
      carbs: 120,
      fat: 40,
      fibre: 10,
      mealsCount: 2,
    },
    targets,
    classifyFoods(["toast"], ["Breakfast"]),
    2,
  );

  const recs = buildFoodRecommendations(gaps);
  assert.ok(recs.items.length > 0);
  assert.ok(recs.impact.length > 0);
});

test("buildCoachSummary mentions gaps when score is moderate", () => {
  const gaps = computeNutritionGaps(
    {
      calories: 1500,
      protein: 30,
      carbs: 150,
      fat: 50,
      fibre: 12,
      mealsCount: 2,
    },
    targets,
    classifyFoods(["rice"], ["Lunch"]),
    3,
  );

  const summary = buildCoachSummary(gaps, 72);
  assert.ok(summary.length > 10);
});
