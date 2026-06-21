import test from "node:test";
import assert from "node:assert/strict";

test("plateCompletenessPercent averages pillar progress", async () => {
  const { plateCompletenessPercent, buildDigitalPlateWidgetProps } = await import(
    "@lifeplate/shared"
  );

  assert.equal(plateCompletenessPercent([0.5, 0.5, 0.5, 0.5]), 50);
  assert.equal(plateCompletenessPercent([1, 0, 0.5, 0.25]), 44);

  const props = buildDigitalPlateWidgetProps({
    isPaid: true,
    protein: { progress: 0.8 },
    fibre: { progress: 0.6 },
    plants: { progress: 0.4 },
    carbs: { progress: 0.2 },
    nutritionScore: 72,
    hasMeals: true,
  });

  assert.equal(props.completeness, 50);
  assert.equal(props.nutritionScore, 72);
  assert.equal(props.isPaid, true);
});
