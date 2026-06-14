import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeLifeplateInsight,
  ruleBasedNudge,
} from "../dist/services/coaching.js";

const baseCtx = {
  goal: "Increase protein",
  todayMealsCount: 1,
  todayProteinTotal: 10,
  weekMealsLogged: 4,
  weekProteinAverage: 20,
  weekVegMeals: 0,
  recentFoods: ["toast"],
};

const meal = {
  mealName: "Toast",
  foods: ["toast"],
  estimatedCalories: 300,
  protein: 10,
  carbs: 50,
  fat: 8,
  fibre: 3,
  sugar: 4,
  sodium: 200,
  confidence: 0.8,
};

test("normalizeLifeplateInsight strips wrapping quotes and extra whitespace", () => {
  assert.equal(normalizeLifeplateInsight('"Great day today."'), "Great day today.");
});

test("ruleBasedNudge suggests protein when goal is protein-focused", () => {
  const nudge = ruleBasedNudge(baseCtx, meal);
  assert.match(nudge, /protein/i);
});

test("ruleBasedNudge suggests greens when week has no vegetable meals", () => {
  const nudge = ruleBasedNudge(
    { ...baseCtx, goal: "Track symptoms", weekMealsLogged: 3 },
    { ...meal, protein: 30 },
  );
  assert.match(nudge, /greens/i);
});

test("ruleBasedNudge encourages more logging when week is sparse", () => {
  const nudge = ruleBasedNudge({ ...baseCtx, weekMealsLogged: 1 }, null);
  assert.match(nudge, /log/i);
});
