import assert from "node:assert/strict";
import test from "node:test";
import { assertMealReanalyzeAllowed } from "../dist/services/mealReanalyze.js";
import { MealGuardrailError } from "../dist/services/mealGuardrails.js";

test("assertMealReanalyzeAllowed allows meals under the cap", () => {
  assert.doesNotThrow(() => assertMealReanalyzeAllowed(0));
  assert.doesNotThrow(() => assertMealReanalyzeAllowed(1));
});

test("assertMealReanalyzeAllowed blocks meals at the cap", () => {
  assert.throws(
    () => assertMealReanalyzeAllowed(2),
    (err) => err instanceof MealGuardrailError && err.code === "REANALYZE_LIMIT",
  );
});
