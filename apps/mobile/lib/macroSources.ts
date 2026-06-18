import {
  carbsLabelsForFood,
  fibreLabelsForFood,
  proteinLabelsForFood,
  type MealListItem,
} from "@lifeplate/shared";

export type MacroSourceKind = "protein" | "fibre" | "carbs";

function mealHasMacro(meal: MealListItem, macro: MacroSourceKind): boolean {
  if (macro === "protein") return (meal.protein ?? 0) > 0;
  if (macro === "fibre") return (meal.fibre ?? 0) > 0;
  return (meal.carbs ?? 0) > 0;
}

function labelsForFood(food: string, macro: MacroSourceKind): string[] {
  if (macro === "protein") return proteinLabelsForFood(food);
  if (macro === "fibre") return fibreLabelsForFood(food);
  return carbsLabelsForFood(food);
}

function pushUnique(entries: string[], seen: Set<string>, value: string) {
  const key = value.toLowerCase();
  if (!value.trim() || seen.has(key)) return;
  seen.add(key);
  entries.push(value.trim());
}

function collectMealSourceTexts(meal: MealListItem): string[] {
  const texts: string[] = [];
  for (const food of meal.foods ?? []) {
    const trimmed = food.trim();
    if (trimmed) texts.push(trimmed);
  }
  const mealName = meal.mealName?.trim();
  if (mealName) texts.push(mealName);
  return texts;
}

function textsMatchingMacro(texts: string[], macro: MacroSourceKind): string[] {
  return texts.filter((text) => labelsForFood(text, macro).length > 0);
}

/** Drop generic hits subsumed by a more specific one (e.g. "sushi" inside "Chicken sushi"). */
function preferSpecificHits(hits: string[]): string[] {
  return hits.filter((hit) => {
    const lower = hit.toLowerCase();
    return !hits.some(
      (other) =>
        other !== hit &&
        other.length > hit.length &&
        other.toLowerCase().includes(lower),
    );
  });
}

/** Foods from today's meals that contributed protein, fibre, or carbs. */
export function buildMacroSources(
  meals: MealListItem[],
  macro: MacroSourceKind,
): string[] {
  const matched: string[] = [];
  const matchedSeen = new Set<string>();
  const fallback: string[] = [];
  const fallbackSeen = new Set<string>();

  for (const meal of meals) {
    const texts = collectMealSourceTexts(meal);
    if (texts.length === 0) continue;

    const hits = preferSpecificHits(textsMatchingMacro(texts, macro));
    if (hits.length > 0) {
      for (const text of hits) pushUnique(matched, matchedSeen, text);
      continue;
    }

    if (!mealHasMacro(meal, macro)) continue;

    const foods = (meal.foods ?? []).map((food) => food.trim()).filter(Boolean);
    if (foods.length > 0) {
      for (const food of foods) pushUnique(fallback, fallbackSeen, food);
    } else if (meal.mealName?.trim()) {
      pushUnique(fallback, fallbackSeen, meal.mealName);
    }
  }

  return (matched.length > 0 ? matched : fallback).slice(0, 8);
}
