import assert from "node:assert/strict";
import test from "node:test";
import type { MealListItem } from "@lifeplate/shared";
import { buildMacroSources } from "../macroSources";

function meal(partial: Partial<MealListItem> & Pick<MealListItem, "id">): MealListItem {
  return {
    id: partial.id,
    mealType: partial.mealType ?? "lunch",
    mealName: partial.mealName ?? "Meal",
    imageUrl: partial.imageUrl ?? "",
    createdAt: partial.createdAt ?? new Date().toISOString(),
    calories: partial.calories ?? 400,
    protein: partial.protein ?? 20,
    carbs: partial.carbs ?? 40,
    fat: partial.fat ?? 10,
    fibre: partial.fibre ?? 2,
    sugar: partial.sugar ?? null,
    sodium: partial.sodium ?? null,
    confidence: partial.confidence ?? 0.8,
    foods: partial.foods ?? [],
    notes: partial.notes ?? null,
  };
}

test("buildMacroSources matches chicken sushi from meal name when foods are generic", () => {
  const sources = buildMacroSources(
    [
      meal({
        id: "1",
        mealName: "Chicken sushi",
        foods: ["sushi", "rice", "nori"],
        protein: 18,
      }),
    ],
    "protein",
  );

  assert.deepEqual(sources, ["Chicken sushi"]);
});

test("buildMacroSources matches egg sushi from food list", () => {
  const sources = buildMacroSources(
    [
      meal({
        id: "1",
        mealName: "Lunch",
        foods: ["egg sushi", "pickled ginger"],
        protein: 12,
      }),
    ],
    "protein",
  );

  assert.deepEqual(sources, ["egg sushi"]);
});

test("buildMacroSources falls back to logged foods when meal has protein but no keyword hit", () => {
  const sources = buildMacroSources(
    [
      meal({
        id: "1",
        mealName: "Bento box",
        foods: ["onigiri", "miso soup"],
        protein: 8,
      }),
    ],
    "protein",
  );

  assert.deepEqual(sources, ["onigiri", "miso soup"]);
});

test("buildMacroSources matches rice from chicken sushi meal foods", () => {
  const sources = buildMacroSources(
    [
      meal({
        id: "1",
        mealName: "Chicken sushi",
        foods: ["sushi", "rice", "nori"],
        carbs: 45,
      }),
    ],
    "carbs",
  );

  assert.deepEqual(sources, ["rice", "Chicken sushi"]);
});

test("buildMacroSources skips meals with no macro and no keyword match", () => {
  const sources = buildMacroSources(
    [
      meal({
        id: "1",
        mealName: "Water",
        foods: ["water"],
        protein: 0,
        fibre: 0,
      }),
    ],
    "protein",
  );

  assert.deepEqual(sources, []);
});
