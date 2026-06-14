import OpenAI from "openai";
import type { MealAnalysisResult } from "@lifeplate/shared";
import {
  buildLifeplateInsightTemplate,
  type ExtendedNutritionTargets,
} from "@lifeplate/shared";
import { pool } from "../db.js";
import { config } from "../config.js";

const VEG_KEYWORDS = [
  "broccoli",
  "spinach",
  "salad",
  "lettuce",
  "carrot",
  "pepper",
  "tomato",
  "cucumber",
  "kale",
  "vegetable",
  "beans",
  "peas",
  "zucchini",
  "asparagus",
  "cabbage",
  "greens",
];

export type CoachingContext = {
  goal: string | null;
  todayMealsCount: number;
  todayProteinTotal: number;
  weekMealsLogged: number;
  weekProteinAverage: number;
  weekVegMeals: number;
  recentFoods: string[];
};

export async function buildCoachingContext(userId: string): Promise<CoachingContext> {
  const { rows: userRows } = await pool.query<{ goal: string | null }>(
    `SELECT goal FROM users WHERE id = $1`,
    [userId],
  );

  const { rows: todayCountRows } = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM meals m
     WHERE m.user_id = $1 AND m.created_at::date = CURRENT_DATE`,
    [userId],
  );

  const { rows: weekRows } = await pool.query<{
    protein: number | null;
    food_name: string | null;
    meal_id: string;
  }>(
    `SELECT m.id AS meal_id, a.protein, f.food_name
     FROM meals m
     LEFT JOIN meal_analysis a ON a.meal_id = m.id
     LEFT JOIN foods f ON f.meal_id = m.id
     WHERE m.user_id = $1 AND m.created_at >= NOW() - INTERVAL '7 days'`,
    [userId],
  );

  const { rows: todayProteinRows } = await pool.query<{ total: string }>(
    `SELECT COALESCE(SUM(a.protein), 0)::text AS total
     FROM meals m
     JOIN meal_analysis a ON a.meal_id = m.id
     WHERE m.user_id = $1 AND m.created_at::date = CURRENT_DATE`,
    [userId],
  );
  const todayProteinTotal = Number(todayProteinRows[0]?.total ?? 0);

  const { rows: weekCountRows } = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM meals m
     WHERE m.user_id = $1 AND m.created_at >= NOW() - INTERVAL '7 days'`,
    [userId],
  );

  const { rows: weekProteinRows } = await pool.query<{ avg: string }>(
    `SELECT COALESCE(AVG(a.protein), 0)::text AS avg
     FROM meals m
     JOIN meal_analysis a ON a.meal_id = m.id
     WHERE m.user_id = $1 AND m.created_at >= NOW() - INTERVAL '7 days'`,
    [userId],
  );

  const weekFoods = weekRows
    .map((r) => r.food_name?.toLowerCase())
    .filter((f): f is string => !!f);
  const weekMealIdsWithVeg = new Set<string>();
  for (const row of weekRows) {
    const food = row.food_name?.toLowerCase() ?? "";
    if (VEG_KEYWORDS.some((k) => food.includes(k))) {
      weekMealIdsWithVeg.add(row.meal_id);
    }
  }

  const recentFoods = [...new Set(weekFoods)].slice(0, 12);

  return {
    goal: userRows[0]?.goal ?? null,
    todayMealsCount: Number(todayCountRows[0]?.count ?? 0),
    todayProteinTotal: Math.round(todayProteinTotal),
    weekMealsLogged: Number(weekCountRows[0]?.count ?? 0),
    weekProteinAverage: Math.round(Number(weekProteinRows[0]?.avg ?? 0)),
    weekVegMeals: weekMealIdsWithVeg.size,
    recentFoods,
  };
}

function ruleBasedNudge(ctx: CoachingContext, meal: MealAnalysisResult | null): string {
  const goal = (ctx.goal ?? "").toLowerCase();
  const proteinGoal =
    goal.includes("protein") || goal.includes("weight") || goal.includes("health");

  if (meal && proteinGoal && meal.protein < 25) {
    return "Add a palm-sized protein on the side to move closer to your goal today.";
  }

  if (meal && ctx.weekVegMeals === 0 && ctx.weekMealsLogged >= 2) {
    return "A handful of greens on this plate is the easiest win this week.";
  }

  if (!meal && ctx.weekMealsLogged < 3) {
    return "Log a few more meals this week and your coach tips will get sharper.";
  }

  if (!meal && proteinGoal && ctx.weekProteinAverage < 30) {
    return "This week, anchor one meal with a clear protein (eggs, tofu, fish, or chicken).";
  }

  if (meal && meal.confidence < 0.6) {
    return "Use Quick fix below if something looks off—one detail can change the macros a lot.";
  }

  return meal
    ? "Solid plate. Confirm when it looks right—you can always edit foods and macros."
    : "Keep logging—small consistent meals beat perfect tracking.";
}

function isPlaceholderKey(key: string): boolean {
  const k = key.trim();
  if (!k || k.includes("your-openai-key") || k.startsWith("sk-your-")) return true;
  return false;
}

export async function generateCoachNudge(
  ctx: CoachingContext,
  meal: MealAnalysisResult | null,
): Promise<string> {
  if (!config.openaiApiKey || isPlaceholderKey(config.openaiApiKey)) {
    return ruleBasedNudge(ctx, meal);
  }

  const client = new OpenAI({ apiKey: config.openaiApiKey });
  const mealBlock = meal
    ? `Current plate: "${meal.mealName}" (${meal.foods.join(", ")}), ${meal.estimatedCalories} cal, P${meal.protein}g C${meal.carbs}g F${meal.fat}g, confidence ${meal.confidence}.`
    : "No current plate—give one weekly focus.";

  const prompt = `You are a calm nutrition coach for LifePlate.
Write exactly ONE actionable sentence (max 20 words). No markdown, lists, guilt, or emojis.
User goal: ${ctx.goal ?? "General wellbeing"}
Today: ${ctx.todayMealsCount} meals logged, ${ctx.todayProteinTotal}g protein total
This week: ${ctx.weekMealsLogged} meals, ~${ctx.weekProteinAverage}g protein per meal, ${ctx.weekVegMeals} meals with vegetables
Recent foods: ${ctx.recentFoods.join(", ") || "none yet"}
${mealBlock}
Be specific to this user and plate.`;

  try {
    const response = await client.chat.completions.create({
      model: config.openaiModel,
      messages: [
        {
          role: "system",
          content:
            "Reply with a single short coaching sentence only. No quotes around the whole sentence.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 60,
      temperature: 0.6,
    });
    const text = response.choices[0]?.message?.content?.trim();
    if (!text) return ruleBasedNudge(ctx, meal);
    return text.replace(/^["']|["']$/g, "").slice(0, 160);
  } catch {
    return ruleBasedNudge(ctx, meal);
  }
}

export type DailyInsightContext = {
  goal: string | null;
  totals: {
    calories: number;
    protein: number;
    fibre: number;
    carbs: number;
    fat: number;
    mealsCount: number;
  };
  targets: ExtendedNutritionTargets;
  plantCount: number;
  recentFoods: string[];
  score: number;
};

const MAX_INSIGHT_SENTENCES = 3;

export function normalizeLifeplateInsight(text: string): string {
  return text.replace(/^["']|["']$/g, "").replace(/\s+/g, " ").trim();
}

export async function generateLifeplateInsight(
  ctx: DailyInsightContext,
): Promise<string> {
  const fallback = buildLifeplateInsightTemplate(
    {
      fibre: ctx.totals.fibre,
      protein: ctx.totals.protein,
      calories: ctx.totals.calories,
    },
    {
      dailyFibreG: ctx.targets.dailyFibreG,
      dailyProteinG: ctx.targets.dailyProteinG,
      dailyCalories: ctx.targets.dailyCalories,
    },
    ctx.plantCount,
  );

  if (!config.openaiApiKey || isPlaceholderKey(config.openaiApiKey)) {
    return normalizeLifeplateInsight(fallback);
  }

  const fibrePct = ctx.targets.dailyFibreG
    ? Math.round((ctx.totals.fibre / ctx.targets.dailyFibreG) * 100)
    : 0;

  const prompt = `You are a calm, evidence-informed nutrition coach for LifePlate.
Summarize today's nutrition in at most ${MAX_INSIGHT_SENTENCES} complete sentences.
Keep each sentence concise. End on a finished thought — no trailing clauses or lists.
No markdown, bullet lists, guilt, emojis, or quotation marks.

User goal: ${ctx.goal ?? "General wellbeing"}
Today's score: ${ctx.score}/100
Today totals: ${ctx.totals.calories} kcal, ${ctx.totals.protein}g protein, ${ctx.totals.fibre}g fibre (${fibrePct}% of target), ${ctx.plantCount} plant foods
Targets: ${ctx.targets.dailyCalories} kcal, ${ctx.targets.dailyProteinG}g protein, ${ctx.targets.dailyFibreG}g fibre
Recent foods: ${ctx.recentFoods.join(", ") || "none yet"}

Give the most useful insight for this user's day.`;

  try {
    const client = new OpenAI({ apiKey: config.openaiApiKey });
    const response = await client.chat.completions.create({
      model: config.openaiModel,
      messages: [
        {
          role: "system",
          content:
            `Reply with a brief coaching summary only. Maximum ${MAX_INSIGHT_SENTENCES} complete sentences.`,
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 150,
      temperature: 0.5,
    });
    const text = response.choices[0]?.message?.content?.trim();
    if (!text) return normalizeLifeplateInsight(fallback);
    return normalizeLifeplateInsight(text);
  } catch {
    return normalizeLifeplateInsight(fallback);
  }
}
