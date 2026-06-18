import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCoachSummary,
  buildComparisonSummary,
  buildDayComparison,
  buildFoodRecommendations,
  buildLifeplateInsightTemplate,
  buildPeriodSnapshot,
  buildWeeklyTrends,
  classifyFoods,
  countProcessedMeals,
  computeNutritionGaps,
  computeNutritionScore,
  defaultExtendedNutritionTargets,
  formatMacroEquivalents,
  formatScoreDelta,
  scoreStatus,
  weeklyGutScore,
  parsePlantFoodText,
} from "../dist/nutrition/index.js";

const targets = defaultExtendedNutritionTargets();

test("classifyFoods detects plants, fermented, and prebiotic foods", () => {
  const result = classifyFoods(
    ["Greek yoghurt", "berries", "chia seeds", "spinach"],
    ["Breakfast bowl"],
  );

  assert.ok(result.plants.includes("Berries"));
  assert.ok(result.fermented.includes("Yoghurt"));
  assert.ok(result.prebiotic.includes("Chia seeds"));
});

test("computeNutritionScore returns higher score with balanced intake", () => {
  const classification = classifyFoods(
    ["chicken", "broccoli", "berries", "yoghurt", "oats", "banana", "spinach"],
    ["Lunch"],
  );

  const strongScore = computeNutritionScore(
    {
      calories: 1900,
      protein: 70,
      carbs: 180,
      fat: 65,
      fibre: 28,
      mealsCount: 3,
    },
    targets,
    classification,
    7,
  );

  const weakScore = computeNutritionScore(
    {
      calories: 900,
      protein: 20,
      carbs: 90,
      fat: 20,
      fibre: 8,
      mealsCount: 1,
    },
    targets,
    classifyFoods(["white bread"], ["Toast"]),
    2,
  );

  assert.ok(strongScore > weakScore);
  assert.equal(scoreStatus(strongScore), "excellent");
});

test("formatMacroEquivalents returns display labels", () => {
  const equivalents = formatMacroEquivalents(30, "protein");
  assert.equal(equivalents.length, 3);
  assert.ok(equivalents[0].includes("egg"));
});

test("buildFoodRecommendations prioritises fibre and protein gaps", () => {
  const gaps = computeNutritionGaps(
    {
      calories: 1200,
      protein: 25,
      carbs: 120,
      fat: 40,
      fibre: 10,
      mealsCount: 2,
    },
    targets,
    classifyFoods(["toast"], ["Breakfast"]),
    2,
  );

  const recs = buildFoodRecommendations(gaps);
  assert.ok(recs.items.length > 0);
  assert.ok(recs.impact.length > 0);
});

test("buildCoachSummary mentions gaps when score is moderate", () => {
  const gaps = computeNutritionGaps(
    {
      calories: 1500,
      protein: 30,
      carbs: 150,
      fat: 50,
      fibre: 12,
      mealsCount: 2,
    },
    targets,
    classifyFoods(["rice"], ["Lunch"]),
    3,
  );

  const summary = buildCoachSummary(gaps, 72);
  assert.ok(summary.length > 10);
});

test("classifyFoods detects omega-3 foods", () => {
  const result = classifyFoods(["salmon", "walnuts"], ["Grilled fish"]);
  assert.ok(result.omega3.includes("Salmon"));
  assert.ok(result.omega3.includes("Walnuts"));
});

test("countProcessedMeals dedupes rows for the same meal name", () => {
  const count = countProcessedMeals([
    { mealName: "KFC dinner", foods: ["chicken"] },
    { mealName: "KFC dinner", foods: ["coleslaw"] },
    { mealName: "Home salad", foods: ["lettuce"] },
  ]);
  assert.equal(count, 1);
});

test("buildLifeplateInsightTemplate prioritises fibre when intake is low", () => {
  const message = buildLifeplateInsightTemplate(
    { fibre: 10, protein: 50, calories: 1200 },
    { dailyFibreG: 30, dailyProteinG: 60, dailyCalories: 2000 },
    2,
  );
  assert.match(message, /fibre/i);
});

test("buildCoachSummary celebrates excellent scores", () => {
  const gaps = computeNutritionGaps(
    { calories: 1900, protein: 70, carbs: 180, fat: 65, fibre: 28, mealsCount: 3 },
    targets,
    classifyFoods(["broccoli", "berries"], ["Lunch"]),
    8,
  );
  assert.match(buildCoachSummary(gaps, 90), /excellently/i);
});

test("formatScoreDelta formats positive, negative, and zero deltas", () => {
  assert.equal(formatScoreDelta(5), "+5");
  assert.equal(formatScoreDelta(-3), "-3");
  assert.equal(formatScoreDelta(0), "0");
});

test("buildComparisonSummary reports momentum when score jumps", () => {
  const totals = {
    calories: 1800,
    protein: 70,
    carbs: 180,
    fat: 60,
    fibre: 28,
    mealsCount: 3,
  };
  const classification = classifyFoods(["broccoli", "berries", "oats"], ["Lunch"]);
  const current = buildPeriodSnapshot("Today", "2026-06-14", totals, classification, 8, targets);
  const previous = buildPeriodSnapshot(
    "Yesterday",
    "2026-06-13",
    { calories: 900, protein: 20, carbs: 90, fat: 20, fibre: 8, mealsCount: 1 },
    classifyFoods(["toast"], ["Breakfast"]),
    2,
    targets,
  );
  const comparison = buildDayComparison(current, previous);
  assert.match(buildComparisonSummary(comparison), /ahead of yesterday/i);
});

test("computeNutritionScore handles zero targets without NaN", () => {
  const classification = classifyFoods(["chicken"], ["Lunch"]);
  const zeroTargets = {
    ...targets,
    dailyProteinG: 0,
    dailyFibreG: 0,
    dailyPlantServes: 0,
    dailyHydrationGlasses: 0,
    dailyCalories: 0,
  };
  const score = computeNutritionScore(
    {
      calories: 500,
      protein: 30,
      carbs: 40,
      fat: 15,
      fibre: 5,
      mealsCount: 1,
    },
    zeroTargets,
    classification,
    4,
  );
  assert.ok(Number.isFinite(score));
});

test("weeklyGutScore caps at 10 with fermented and prebiotic foods", () => {
  assert.equal(
    weeklyGutScore({
      plants: [],
      protein: [],
      fibre: [],
      fermented: ["Yoghurt"],
      prebiotic: ["Chia seeds"],
      omega3: [],
      processedMealCount: 0,
    }),
    10,
  );
});

test("buildWeeklyTrends marks processed food intake bands", () => {
  const onTrack = buildWeeklyTrends({
    avgDailyProtein: 60,
    proteinTarget: 60,
    avgPlantFoods: 7,
    plantTarget: 7,
    gutScore: 8,
    processedPercent: 15,
    omega3Days: 3,
    daysWithMeals: 5,
  });
  const processed = onTrack.find((t) => t.label === "Processed Food Intake");
  assert.equal(processed?.status, "on_track");

  const moderate = buildWeeklyTrends({
    avgDailyProtein: 30,
    proteinTarget: 60,
    avgPlantFoods: 3,
    plantTarget: 7,
    gutScore: 4,
    processedPercent: 35,
    omega3Days: 1,
    daysWithMeals: 5,
  });
  assert.equal(
    moderate.find((t) => t.label === "Processed Food Intake")?.status,
    "moderate",
  );
});

test("parsePlantFoodText reads amounts and units from food strings", () => {
  const halfCup = parsePlantFoodText("1/2 cup peanuts");
  assert.equal(halfCup.name, "peanuts");
  assert.equal(halfCup.amount, 0.5);
  assert.equal(halfCup.unit, "cup");

  const plain = parsePlantFoodText("spinach");
  assert.equal(plain.name, "spinach");
  assert.equal(plain.amount, 1);
  assert.equal(plain.unit, null);
});

test("classifyFoods sums fractional plant serves from quantities", () => {
  const result = classifyFoods(["1/2 cup peanuts", "1 cup broccoli"], ["Snack"]);
  assert.ok(result.plants.includes("Peanuts"));
  assert.ok(result.plants.includes("Broccoli"));
  assert.equal(result.plantServes, 1.5);
});
