import assert from "node:assert/strict";
import test from "node:test";
import {
  isGenericMealName,
  resolveTextLogMealName,
} from "../dist/services/mealNaming.js";

test("isGenericMealName flags category labels", () => {
  assert.equal(isGenericMealName("Beverage"), true);
  assert.equal(isGenericMealName("snack"), true);
  assert.equal(isGenericMealName("Long Mac Latte"), false);
});

test("resolveTextLogMealName prefers user description over generic AI title", () => {
  assert.equal(
    resolveTextLogMealName("Beverage", ["Latte"], "Long Mac latte"),
    "Long Mac Latte",
  );
});

test("resolveTextLogMealName keeps specific AI titles", () => {
  assert.equal(
    resolveTextLogMealName("Iced Oat Latte", ["Iced oat latte"], "iced oat latte"),
    "Iced Oat Latte",
  );
});

test("resolveTextLogMealName falls back to specific foods", () => {
  assert.equal(
    resolveTextLogMealName("Meal", ["Grilled salmon", "Rice"], "dinner"),
    "Grilled salmon",
  );
});
