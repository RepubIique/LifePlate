import { computeTogetherStreakFromDayKeys } from "@lifeplate/shared";
import { pool } from "../db.js";
import { MEAL_LOG_DATE_KEY_SQL } from "./mealLogDate.js";

export async function queryMealLogDaysByUserIds(
  userIds: string[],
): Promise<Map<string, string[]>> {
  if (userIds.length === 0) return new Map();

  const { rows } = await pool.query<{ user_id: string; log_date: string }>(
    `SELECT user_id, log_date::text AS log_date
     FROM (
       SELECT DISTINCT user_id, ${MEAL_LOG_DATE_KEY_SQL} AS log_date
       FROM meals
       WHERE user_id = ANY($1::uuid[])
         AND (status IS NULL OR status = 'logged')
     ) days
     ORDER BY user_id, log_date`,
    [userIds],
  );

  const map = new Map<string, string[]>();
  for (const id of userIds) {
    map.set(id, []);
  }
  for (const row of rows) {
    const list = map.get(row.user_id);
    if (list) list.push(row.log_date);
  }
  return map;
}

export function togetherStreakForFriend(
  userDayKeys: string[],
  friendDayKeys: string[],
): number {
  return computeTogetherStreakFromDayKeys(userDayKeys, friendDayKeys);
}
