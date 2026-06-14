import assert from "node:assert/strict";
import test from "node:test";
import {
  computeMacroBreakdown,
  energyUnitLabel,
  formatEnergyValue,
} from "../macroMath";

test("computeMacroBreakdown calculates macro percentages", () => {
  const breakdown = computeMacroBreakdown(500, 25, 50, 20);
  assert.equal(breakdown.proteinCal, 100);
  assert.equal(breakdown.carbsCal, 200);
  assert.equal(breakdown.fatCal, 180);
  assert.equal(
    breakdown.proteinPct + breakdown.carbsPct + breakdown.fatPct,
    1,
  );
});

test("computeMacroBreakdown avoids divide-by-zero with zero macros", () => {
  const breakdown = computeMacroBreakdown(0, 0, 0, 0);
  assert.equal(breakdown.macroCalories, 0);
  assert.equal(breakdown.proteinPct, 0);
});

test("formatEnergyValue converts kcal to kJ", () => {
  assert.equal(formatEnergyValue(100, "kcal"), 100);
  assert.equal(formatEnergyValue(100, "kj"), 418);
});

test("energyUnitLabel returns display labels", () => {
  assert.equal(energyUnitLabel("kcal"), "kcal");
  assert.equal(energyUnitLabel("kj"), "kJ");
});
