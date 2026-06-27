import { MEAL_TYPE_OPTIONS } from "@lifeplate/shared";

const GENERIC_MEAL_NAMES = new Set<string>([
  ...MEAL_TYPE_OPTIONS.map((option) => option.value),
  ...MEAL_TYPE_OPTIONS.map((option) => option.label.toLowerCase()),
  "meal",
  "meals",
  "food",
  "foods",
  "drink",
  "drinks",
  "beverage",
  "snack",
  "item",
  "unknown",
  "misc",
  "other",
]);

const FILLER_WORDS = new Set([
  "a",
  "an",
  "the",
  "my",
  "some",
  "of",
  "and",
  "with",
  "for",
  "had",
  "ate",
  "just",
]);

function normalizeMealName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function titleCaseWords(value: string): string {
  return normalizeMealName(value)
    .split(" ")
    .map((word) => {
      if (!word) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

function truncateMealName(value: string, maxLength = 48): string {
  const normalized = normalizeMealName(value);
  if (normalized.length <= maxLength) return normalized;

  const truncated = normalized.slice(0, maxLength + 1);
  const lastSpace = truncated.lastIndexOf(" ");
  if (lastSpace > maxLength * 0.6) {
    return `${truncated.slice(0, lastSpace).trim()}…`;
  }
  return `${normalized.slice(0, maxLength).trim()}…`;
}

export function isGenericMealName(name: string): boolean {
  const normalized = normalizeMealName(name).toLowerCase();
  if (!normalized) return true;
  if (GENERIC_MEAL_NAMES.has(normalized)) return true;

  const words = normalized.split(" ").filter((word) => !FILLER_WORDS.has(word));
  if (words.length === 0) return true;
  if (words.length === 1 && GENERIC_MEAL_NAMES.has(words[0]!)) return true;

  return false;
}

function pickSpecificFoodName(foods: string[]): string | null {
  const candidates = foods
    .map((food) => normalizeMealName(food))
    .filter((food) => food && !isGenericMealName(food));

  if (candidates.length === 0) return null;

  return candidates.sort((a, b) => b.length - a.length)[0] ?? null;
}

/** Prefer a specific title from AI output, user text, or identified foods. */
export function resolveTextLogMealName(
  mealName: string,
  foods: string[],
  description: string,
): string {
  const normalizedName = normalizeMealName(mealName);
  if (normalizedName && !isGenericMealName(normalizedName)) {
    return normalizedName;
  }

  const normalizedDescription = normalizeMealName(description);
  if (normalizedDescription && !isGenericMealName(normalizedDescription)) {
    return titleCaseWords(truncateMealName(normalizedDescription));
  }

  const foodName = pickSpecificFoodName(foods);
  if (foodName) return foodName;

  if (normalizedName) return normalizedName;
  if (normalizedDescription) return titleCaseWords(truncateMealName(normalizedDescription));
  return "Meal";
}
