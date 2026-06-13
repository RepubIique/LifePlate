import type { FastifyInstance } from "fastify";
import type { InsightsResponse } from "@lifeplate/shared";
import type { AuthedRequest } from "../auth.js";
import { requireAuth } from "../auth.js";
import { buildCoachingContext, generateCoachNudge } from "../services/coaching.js";
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

const TAKEAWAY_KEYWORDS = [
  "mcdonald",
  "kfc",
  "uber eats",
  "deliveroo",
  "takeaway",
  "pizza hut",
  "subway",
  "grab",
  "foodpanda",
];

export async function insightRoutes(app: FastifyInstance) {
  app.get(
    "/api/insights",
    { preHandler: requireAuth },
    async (request) => {
      const { userId } = request as AuthedRequest;

      const { rows: mealRows } = await pool.query<{
        protein: number | null;
        food_name: string | null;
        meal_name: string | null;
      }>(
        `SELECT a.protein, f.food_name, m.meal_name
         FROM meals m
         LEFT JOIN meal_analysis a ON a.meal_id = m.id
         LEFT JOIN foods f ON f.meal_id = m.id
         WHERE m.user_id = $1
           AND m.created_at >= NOW() - INTERVAL '7 days'`,
        [userId],
      );

      const foods: string[] = [];

      for (const row of mealRows) {
        if (row.food_name) foods.push(row.food_name.toLowerCase());
      }

      const { rows: countRows } = await pool.query<{ count: string }>(
        `SELECT COUNT(DISTINCT m.id)::text AS count
         FROM meals m
         WHERE m.user_id = $1 AND m.created_at >= NOW() - INTERVAL '7 days'`,
        [userId],
      );
      const mealsLogged = Number(countRows[0]?.count ?? 0);

      const { rows: proteinRows } = await pool.query<{
        day: string;
        avg_protein: string;
      }>(
        `SELECT DATE(m.created_at)::text AS day, AVG(a.protein)::text AS avg_protein
         FROM meals m
         JOIN meal_analysis a ON a.meal_id = m.id
         WHERE m.user_id = $1 AND m.created_at >= NOW() - INTERVAL '7 days'
         GROUP BY DATE(m.created_at)`,
        [userId],
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

      const takeawayHits = mealRows.filter((r) => {
        const text = `${r.meal_name ?? ""} ${r.food_name ?? ""}`.toLowerCase();
        return TAKEAWAY_KEYWORDS.some((k) => text.includes(k));
      }).length;

      const takeawayPercent =
        mealsLogged > 0
          ? Math.round((takeawayHits / mealsLogged) * 100)
          : 18;
      const homeCookedPercent = 100 - takeawayPercent;

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
