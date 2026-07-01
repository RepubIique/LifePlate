import assert from "node:assert/strict";
import test from "node:test";
import { buildPlanSuggestions } from "../dist/nutrition/recommendations.js";

test("buildPlanSuggestions returns top fibre and protein tips", () => {
  const suggestions = buildPlanSuggestions({
    proteinG: 15,
    fibreG: 8,
    plantServes: 0,
    hydrationGlasses: 0,
  });
  assert.equal(suggestions.length, 2);
  assert.equal(suggestions[0]?.pillar, "fibre");
  assert.match(suggestions[0]?.message ?? "", /fibre/i);
  assert.equal(suggestions[1]?.pillar, "protein");
});

test("buildPlanSuggestions caps at two items", () => {
  const suggestions = buildPlanSuggestions({
    proteinG: 20,
    fibreG: 10,
    plantServes: 3,
    hydrationGlasses: 3,
  });
  assert.equal(suggestions.length, 2);
});

test("buildPlanSuggestions returns empty when gaps are small", () => {
  const suggestions = buildPlanSuggestions({
    proteinG: 2,
    fibreG: 1,
    plantServes: 0,
    hydrationGlasses: 0,
  });
  assert.deepEqual(suggestions, []);
});
