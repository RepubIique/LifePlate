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

const PROTEIN_KEYWORDS: Array<{ keyword: string; label: string }> = [
  { keyword: "chicken", label: "Chicken" },
  { keyword: "turkey", label: "Turkey" },
  { keyword: "beef", label: "Beef" },
  { keyword: "steak", label: "Beef" },
  { keyword: "mince", label: "Beef" },
  { keyword: "pork", label: "Pork" },
  { keyword: "lamb", label: "Lamb" },
  { keyword: "ham", label: "Ham" },
  { keyword: "bacon", label: "Bacon" },
  { keyword: "sausage", label: "Sausage" },
  { keyword: "fish", label: "Fish" },
  { keyword: "salmon", label: "Salmon" },
  { keyword: "tuna", label: "Tuna" },
  { keyword: "sardine", label: "Sardines" },
  { keyword: "mackerel", label: "Mackerel" },
  { keyword: "cod", label: "Fish" },
  { keyword: "prawn", label: "Prawns" },
  { keyword: "shrimp", label: "Prawns" },
  { keyword: "crab", label: "Seafood" },
  { keyword: "seafood", label: "Seafood" },
  { keyword: "egg", label: "Eggs" },
  { keyword: "eggs", label: "Eggs" },
  { keyword: "tamago", label: "Egg sushi" },
  { keyword: "sushi", label: "Sushi" },
  { keyword: "nigiri", label: "Sushi" },
  { keyword: "maki", label: "Sushi" },
  { keyword: "tofu", label: "Tofu" },
  { keyword: "tempeh", label: "Tempeh" },
  { keyword: "lentil", label: "Lentils" },
  { keyword: "chickpea", label: "Chickpeas" },
  { keyword: "edamame", label: "Edamame" },
  { keyword: "yoghurt", label: "Yoghurt" },
  { keyword: "yogurt", label: "Yoghurt" },
  { keyword: "cheese", label: "Cheese" },
  { keyword: "cottage", label: "Cottage cheese" },
  { keyword: "milk", label: "Milk" },
  { keyword: "quinoa", label: "Quinoa" },
  { keyword: "protein", label: "Protein" },
  { keyword: "bean", label: "Beans" },
  { keyword: "beans", label: "Beans" },
];

const FIBRE_KEYWORDS: Array<{ keyword: string; label: string }> = [
  { keyword: "broccoli", label: "Broccoli" },
  { keyword: "spinach", label: "Spinach" },
  { keyword: "kale", label: "Kale" },
  { keyword: "carrot", label: "Carrot" },
  { keyword: "cabbage", label: "Cabbage" },
  { keyword: "asparagus", label: "Asparagus" },
  { keyword: "pepper", label: "Capsicum" },
  { keyword: "capsicum", label: "Capsicum" },
  { keyword: "tomato", label: "Tomato" },
  { keyword: "cucumber", label: "Cucumber" },
  { keyword: "zucchini", label: "Zucchini" },
  { keyword: "mushroom", label: "Mushroom" },
  { keyword: "apple", label: "Apple" },
  { keyword: "pear", label: "Pear" },
  { keyword: "orange", label: "Orange" },
  { keyword: "banana", label: "Banana" },
  { keyword: "berry", label: "Berries" },
  { keyword: "berries", label: "Berries" },
  { keyword: "avocado", label: "Avocado" },
  { keyword: "bean", label: "Beans" },
  { keyword: "beans", label: "Beans" },
  { keyword: "lentil", label: "Lentils" },
  { keyword: "chickpea", label: "Chickpeas" },
  { keyword: "pea", label: "Peas" },
  { keyword: "peas", label: "Peas" },
  { keyword: "oat", label: "Oats" },
  { keyword: "oats", label: "Oats" },
  { keyword: "bran", label: "Bran" },
  { keyword: "wholegrain", label: "Whole grains" },
  { keyword: "whole grain", label: "Whole grains" },
  { keyword: "wholemeal", label: "Wholemeal" },
  { keyword: "brown rice", label: "Brown rice" },
  { keyword: "quinoa", label: "Quinoa" },
  { keyword: "chia", label: "Chia seeds" },
  { keyword: "flax", label: "Flax seeds" },
  { keyword: "sweet potato", label: "Sweet potato" },
  { keyword: "almond", label: "Almonds" },
  { keyword: "walnut", label: "Walnuts" },
  { keyword: "peanut", label: "Peanuts" },
  { keyword: "peanuts", label: "Peanuts" },
  { keyword: "salad", label: "Salad" },
  { keyword: "lettuce", label: "Lettuce" },
  { keyword: "greens", label: "Greens" },
];

const CARBS_KEYWORDS: Array<{ keyword: string; label: string }> = [
  { keyword: "rice", label: "Rice" },
  { keyword: "bread", label: "Bread" },
  { keyword: "toast", label: "Bread" },
  { keyword: "bagel", label: "Bagel" },
  { keyword: "pasta", label: "Pasta" },
  { keyword: "spaghetti", label: "Pasta" },
  { keyword: "noodle", label: "Noodles" },
  { keyword: "noodles", label: "Noodles" },
  { keyword: "ramen", label: "Noodles" },
  { keyword: "udon", label: "Noodles" },
  { keyword: "potato", label: "Potato" },
  { keyword: "sweet potato", label: "Sweet potato" },
  { keyword: "banana", label: "Banana" },
  { keyword: "apple", label: "Apple" },
  { keyword: "orange", label: "Orange" },
  { keyword: "oat", label: "Oats" },
  { keyword: "oats", label: "Oats" },
  { keyword: "quinoa", label: "Quinoa" },
  { keyword: "couscous", label: "Couscous" },
  { keyword: "tortilla", label: "Tortilla" },
  { keyword: "wrap", label: "Wrap" },
  { keyword: "pita", label: "Pita" },
  { keyword: "naan", label: "Naan" },
  { keyword: "cereal", label: "Cereal" },
  { keyword: "corn", label: "Corn" },
  { keyword: "pizza", label: "Pizza" },
  { keyword: "bun", label: "Bun" },
  { keyword: "roll", label: "Bread roll" },
  { keyword: "sushi", label: "Sushi" },
  { keyword: "onigiri", label: "Onigiri" },
  { keyword: "maki", label: "Sushi" },
  { keyword: "nigiri", label: "Sushi" },
  { keyword: "granola", label: "Granola" },
  { keyword: "cracker", label: "Crackers" },
  { keyword: "crackers", label: "Crackers" },
  { keyword: "muffin", label: "Muffin" },
  { keyword: "pancake", label: "Pancakes" },
  { keyword: "waffle", label: "Waffles" },
  { keyword: "croissant", label: "Croissant" },
  { keyword: "baguette", label: "Bread" },
  { keyword: "wholemeal", label: "Wholemeal bread" },
  { keyword: "wholegrain", label: "Whole grains" },
  { keyword: "whole grain", label: "Whole grains" },
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

function matchesKeyword(text: string, keyword: string): boolean {
  if (keyword.includes(" ")) return text.includes(keyword);
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pluralSuffix = keyword.endsWith("s") ? "" : "s?";
  return new RegExp(`\\b${escaped}${pluralSuffix}\\b`).test(text);
}

function matchLabels(
  text: string,
  entries: Array<{ keyword: string; label: string }>,
): string[] {
  const hits = new Set<string>();
  for (const entry of entries) {
    if (matchesKeyword(text, entry.keyword)) {
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

/** Protein taxonomy labels matched in a single food name. */
export function proteinLabelsForFood(food: string): string[] {
  const { name } = parsePlantFoodText(food);
  return matchLabels(name.toLowerCase(), PROTEIN_KEYWORDS);
}

/** Fibre taxonomy labels matched in a single food name. */
export function fibreLabelsForFood(food: string): string[] {
  const { name } = parsePlantFoodText(food);
  return matchLabels(name.toLowerCase(), FIBRE_KEYWORDS);
}

/** Carb taxonomy labels matched in a single food name. */
export function carbsLabelsForFood(food: string): string[] {
  const { name } = parsePlantFoodText(food);
  return matchLabels(name.toLowerCase(), CARBS_KEYWORDS);
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
  const protein = new Set<string>();
  const fibre = new Set<string>();
  const carbs = new Set<string>();
  const fermented = new Set<string>();
  const prebiotic = new Set<string>();
  const omega3 = new Set<string>();

  for (const food of foods) {
    const { name } = parsePlantFoodText(food);
    const text = name.toLowerCase();
    for (const label of matchLabels(text, PLANT_KEYWORDS)) plants.add(label);
    for (const label of matchLabels(text, PROTEIN_KEYWORDS)) protein.add(label);
    for (const label of matchLabels(text, FIBRE_KEYWORDS)) fibre.add(label);
    for (const label of matchLabels(text, CARBS_KEYWORDS)) carbs.add(label);
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
    protein: [...protein],
    fibre: [...fibre],
    carbs: [...carbs],
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
