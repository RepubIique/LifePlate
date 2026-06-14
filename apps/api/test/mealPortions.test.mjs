import assert from "node:assert/strict";
import test from "node:test";
import { mergeRawAiPortionMeta } from "../dist/services/mealPortions.js";

const portionMeta = {
  totalPortions: 4,
  portionsEaten: 1,
  baseMacros: {
    estimatedCalories: 800,
    protein: 40,
    carbs: 80,
    fat: 30,
    fibre: 12,
    sugar: 8,
    sodium: 400,
  },
};

test("mergeRawAiPortionMeta merges portionMeta into object raw response", () => {
  const raw = { model: "gpt-4o-mini", foods: ["rice"] };
  const parsed = JSON.parse(mergeRawAiPortionMeta(raw, portionMeta));
  assert.equal(parsed.model, "gpt-4o-mini");
  assert.deepEqual(parsed.portionMeta, portionMeta);
});

test("mergeRawAiPortionMeta wraps primitive raw response", () => {
  const parsed = JSON.parse(mergeRawAiPortionMeta("legacy-value", portionMeta));
  assert.equal(parsed.legacy, "legacy-value");
  assert.deepEqual(parsed.portionMeta, portionMeta);
});

test("mergeRawAiPortionMeta strips portionMeta when null", () => {
  const raw = { model: "gpt-4o-mini", portionMeta };
  const parsed = JSON.parse(mergeRawAiPortionMeta(raw, null));
  assert.equal(parsed.model, "gpt-4o-mini");
  assert.equal(parsed.portionMeta, undefined);
});
