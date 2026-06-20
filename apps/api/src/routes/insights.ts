import type { FastifyInstance } from "fastify";
import type { InsightsResponse } from "@lifeplate/shared";
import { offsetLogDateKey, todayDateKey } from "@lifeplate/shared";
import type { AuthedRequest } from "../auth.js";
import { requireAuth } from "../auth.js";
import { buildCoachingContext, generateCoachNudge } from "../services/coaching.js";
import {
  computeTakeawayPercent,
  countTakeawayMeals,
} from "../services/insightsMetrics.js";
import { pool } from "../db.js";

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
];

export async function insightRoutes(app: FastifyInstance) {
  app.get(
    "/api/insights",
    { preHandler: requireAuth },
    async (request) => {
      const { userId } = request as AuthedRequest;

      const today = todayDateKey();
      const weekStart = offsetLogDateKey(today, -6);

      const { rows: mealRows } = await pool.query<{
        meal_id: string;
        protein: number | null;
        foods: string[];
        meal_name: string | null;
      }>(
        `SELECT m.id AS meal_id, m.protein, m.foods, m.meal_name
         FROM meals m
         WHERE m.user_id = $1 AND m.log_date >= $2::date`,
        [userId, weekStart],
      );

      const foods: string[] = [];

      for (const row of mealRows) {
        for (const food of row.foods ?? []) {
          foods.push(food.toLowerCase());
        }
      }

      const { rows: countRows } = await pool.query<{ count: string }>(
        `SELECT COUNT(DISTINCT m.id)::text AS count
         FROM meals m
         WHERE m.user_id = $1 AND m.log_date >= $2::date`,
        [userId, weekStart],
      );
      const mealsLogged = Number(countRows[0]?.count ?? 0);

      const { rows: proteinRows } = await pool.query<{
        day: string;
        avg_protein: string;
      }>(
        `SELECT m.log_date::text AS day, AVG(m.protein)::text AS avg_protein
         FROM meals m
         WHERE m.user_id = $1 AND m.log_date >= $2::date
         GROUP BY m.log_date`,
        [userId, weekStart],
      );

      let proteinTotal = 0;
      for (const p of proteinRows) {
        proteinTotal += Number(p.avg_protein);
      }
      const proteinAverage =
        proteinRows.length > 0 ? Math.round(proteinTotal / proteinRows.length) : 0;

      const vegFoods = new Set(
        foods.filter((f) => VEG_KEYWORDS.some((k) => f.includes(k))),
      );

      const foodCounts = new Map<string, number>();
      for (const f of foods) {
        const key = f.split(" ")[0];
        foodCounts.set(key, (foodCounts.get(key) ?? 0) + 1);
      }
      let mostCommonFood: string | null = null;
      let max = 0;
      for (const [food, count] of foodCounts) {
        if (count > max) {
          max = count;
          mostCommonFood = food;
        }
      }

      const takeawayHits = mealRows.flatMap((row) =>
        (row.foods?.length ? row.foods : [""]).map((foodName) => ({
          mealId: row.meal_id,
          mealName: row.meal_name,
          foodName,
        })),
      );
      const takeawayMeals = countTakeawayMeals(takeawayHits);
      const { takeawayPercent, homeCookedPercent } = computeTakeawayPercent(
        takeawayMeals,
        mealsLogged,
      );

      const coachingContext = await buildCoachingContext(userId);
      const coachNudge = await generateCoachNudge(coachingContext, null);

      const response: InsightsResponse = {
        period: "This Week",
        mealsLogged,
        vegetablesConsumed: vegFoods.size,
        proteinAverage,
        mostCommonFood,
        homeCookedPercent,
        takeawayPercent,
        coachNudge,
      };

      return response;
    },
  );
}
