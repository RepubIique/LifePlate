import assert from "node:assert/strict";
import test from "node:test";
import {
  assertMealAnalysis,
  MealGuardrailError,
  MAX_REASONABLE_CALORIES,
  MIN_MEAL_CONFIDENCE,
  rejectNonMealPhoto,
} from "../dist/services/mealGuardrails.js";

function confirmAnalysis(overrides = {}) {
  return {
    mealName: "Lunch",
    foods: ["rice"],
    estimatedCalories: 500,
    protein: 20,
    carbs: 60,
    fat: 15,
    fibre: 4,
    sugar: 2,
    sodium: 300,
    confidence: 0.8,
    ...overrides,
  };
}

test("assertMealAnalysis accepts valid confirm payloads", () => {
  assert.doesNotThrow(() => assertMealAnalysis(confirmAnalysis()));
});

test("assertMealAnalysis rejects confirm payloads with extreme calories", () => {
  assert.throws(
    () =>
      assertMealAnalysis(
        confirmAnalysis({ estimatedCalories: MAX_REASONABLE_CALORIES + 1 }),
      ),
    (err) => err instanceof MealGuardrailError,
  );
});

test("assertMealAnalysis accepts valid analysis at boundaries", () => {
  assert.doesNotThrow(() =>
    assertMealAnalysis(
      confirmAnalysis({
        confidence: MIN_MEAL_CONFIDENCE,
        estimatedCalories: MAX_REASONABLE_CALORIES,
      }),
    ),
  );
});

test("assertMealAnalysis rejects empty foods after trimming", () => {
  assert.throws(
    () => assertMealAnalysis(confirmAnalysis({ foods: ["  ", ""] })),
    (err) => err instanceof MealGuardrailError && err.code === "UNCLEAR_PHOTO",
  );
});

test("assertMealAnalysis rejects low confidence", () => {
  assert.throws(
    () => assertMealAnalysis(confirmAnalysis({ confidence: MIN_MEAL_CONFIDENCE - 0.01 })),
    (err) => err instanceof MealGuardrailError && err.status === 422,
  );
});

test("assertMealAnalysis rejects extreme calories", () => {
  assert.throws(
    () => assertMealAnalysis(confirmAnalysis({ estimatedCalories: MAX_REASONABLE_CALORIES + 1 })),
    (err) => err instanceof MealGuardrailError && err.code === "UNCLEAR_PHOTO",
  );
});

test("rejectNonMealPhoto includes optional detail", () => {
  assert.throws(
    () => rejectNonMealPhoto("receipt"),
    (err) =>
      err instanceof MealGuardrailError &&
      err.code === "NOT_FOOD" &&
      err.message.includes("receipt"),
  );
});
