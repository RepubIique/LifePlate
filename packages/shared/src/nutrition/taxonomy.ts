import type { FoodClassification } from "./types.js";
import { parsePlantFoodText, sumPlantServes } from "./plantQuantity.js";

const PLANT_KEYWORDS: Array<{ keyword: string; label: string }> = [
  { keyword: "broccoli", label: "Broccoli" },
  { keyword: "spinach", label: "Spinach" },
  { keyword: "salad", label: "Salad" },
  { keyword: "lettuce", label: "Lettuce" },
  { keyword: "carrot", label: "Carrot" },
  { keyword: "pepper", label: "Capsicum" },
  { keyword: "capsicum", label: "Capsicum" },
  { keyword: "tomato", label: "Tomato" },
  { keyword: "cucumber", label: "Cucumber" },
  { keyword: "kale", label: "Kale" },
  { keyword: "vegetable", label: "Vegetables" },
  { keyword: "beans", label: "Beans" },
  { keyword: "peas", label: "Peas" },
  { keyword: "zucchini", label: "Zucchini" },
  { keyword: "asparagus", label: "Asparagus" },
  { keyword: "cabbage", label: "Cabbage" },
  { keyword: "greens", label: "Greens" },
  { keyword: "berry", label: "Berries" },
  { keyword: "berries", label: "Berries" },
  { keyword: "apple", label: "Apple" },
  { keyword: "banana", label: "Banana" },
  { keyword: "orange", label: "Orange" },
  { keyword: "kiwi", label: "Kiwi" },
  { keyword: "avocado", label: "Avocado" },
  { keyword: "mushroom", label: "Mushroom" },
  { keyword: "lentil", label: "Lentils" },
  { keyword: "chickpea", label: "Chickpeas" },
  { keyword: "almond", label: "Almonds" },
  { keyword: "walnut", label: "Walnuts" },
  { keyword: "peanut", label: "Peanuts" },
  { keyword: "peanuts", label: "Peanuts" },
  { keyword: "oat", label: "Oats" },
  { keyword: "oats", label: "Oats" },
];

const FERMENTED_KEYWORDS: Array<{ keyword: string; label: string }> = [
  { keyword: "yoghurt", label: "Yoghurt" },
  { keyword: "yogurt", label: "Yoghurt" },
  { keyword: "kefir", label: "Kefir" },
  { keyword: "kimchi", label: "Kimchi" },
  { keyword: "sauerkraut", label: "Sauerkraut" },
  { keyword: "miso", label: "Miso" },
  { keyword: "kombucha", label: "Kombucha" },
  { keyword: "tempeh", label: "Tempeh" },
];

const PREBIOTIC_KEYWORDS: Array<{ keyword: string; label: string }> = [
  { keyword: "chia", label: "Chia seeds" },
  { keyword: "oat", label: "Oats" },
  { keyword: "oats", label: "Oats" },
  { keyword: "garlic", label: "Garlic" },
  { keyword: "onion", label: "Onion" },
  { keyword: "banana", label: "Banana" },
  { keyword: "lentil", label: "Lentils" },
  { keyword: "bean", label: "Beans" },
  { keyword: "asparagus", label: "Asparagus" },
];

const OMEGA3_KEYWORDS: Array<{ keyword: string; label: string }> = [
  { keyword: "salmon", label: "Salmon" },
  { keyword: "sardine", label: "Sardines" },
  { keyword: "mackerel", label: "Mackerel" },
  { keyword: "walnut", label: "Walnuts" },
  { keyword: "chia", label: "Chia seeds" },
  { keyword: "flax", label: "Flax seeds" },
  { keyword: "herring", label: "Herring" },
];

const PROCESSED_KEYWORDS = [
  "mcdonald",
  "kfc",
  "uber eats",
  "deliveroo",
  "takeaway",
  "pizza hut",
  "subway",
  "grab",
  "foodpanda",
  "fast food",
  "fried chicken",
  "instant noodle",
];

function matchLabels(
  text: string,
  entries: Array<{ keyword: string; label: string }>,
): string[] {
  const hits = new Set<string>();
  for (const entry of entries) {
    if (text.includes(entry.keyword)) {
      hits.add(entry.label);
    }
  }
  return [...hits];
}

/** Plant taxonomy labels matched in a single food name. */
export function plantLabelsForFood(food: string): string[] {
  const { name } = parsePlantFoodText(food);
  return matchLabels(name.toLowerCase(), PLANT_KEYWORDS);
}

export function resolvedPlantServes(classification: FoodClassification): number {
  return classification.plantServes ?? classification.plants.length;
}

function isProcessedMeal(mealName: string, foods: string[]): boolean {
  const text = `${mealName} ${foods.join(" ")}`.toLowerCase();
  return PROCESSED_KEYWORDS.some((keyword) => text.includes(keyword));
}

export function classifyFoods(
  foods: string[],
  mealNames: string[] = [],
): FoodClassification {
  const plants = new Set<string>();
  const fermented = new Set<string>();
  const prebiotic = new Set<string>();
  const omega3 = new Set<string>();

  for (const food of foods) {
    const { name } = parsePlantFoodText(food);
    const text = name.toLowerCase();
    for (const label of matchLabels(text, PLANT_KEYWORDS)) plants.add(label);
    for (const label of matchLabels(text, FERMENTED_KEYWORDS)) fermented.add(label);
    for (const label of matchLabels(text, PREBIOTIC_KEYWORDS)) prebiotic.add(label);
    for (const label of matchLabels(text, OMEGA3_KEYWORDS)) omega3.add(label);
  }

  const plantServes = sumPlantServes(foods, (food) => plantLabelsForFood(food).length > 0);

  let processedMealCount = 0;
  const uniqueMeals = [...new Set(mealNames)];
  for (const mealName of uniqueMeals) {
    if (isProcessedMeal(mealName, foods)) processedMealCount += 1;
  }

  return {
    plants: [...plants],
    plantServes,
    fermented: [...fermented],
    prebiotic: [...prebiotic],
    omega3: [...omega3],
    processedMealCount,
  };
}

export function countProcessedMeals(
  rows: Array<{ mealName: string; foods: string[] }>,
): number {
  const mealMap = new Map<string, string[]>();
  for (const row of rows) {
    const existing = mealMap.get(row.mealName) ?? [];
    mealMap.set(row.mealName, [...existing, ...row.foods]);
  }

  let count = 0;
  for (const [mealName, foods] of mealMap) {
    if (isProcessedMeal(mealName, foods)) count += 1;
  }
  return count;
}
