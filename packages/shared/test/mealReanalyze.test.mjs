import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_MEAL_REANALYZES,
  mealReanalyzeRemaining,
} from "@lifeplate/shared";

test("mealReanalyzeRemaining counts down from the per-meal cap", () => {
  assert.equal(mealReanalyzeRemaining(0), MAX_MEAL_REANALYZES);
  assert.equal(mealReanalyzeRemaining(1), 1);
  assert.equal(mealReanalyzeRemaining(2), 0);
  assert.equal(mealReanalyzeRemaining(99), 0);
});

test("mealReanalyzeRemaining never returns negative values", () => {
  assert.equal(mealReanalyzeRemaining(-1), MAX_MEAL_REANALYZES);
});
