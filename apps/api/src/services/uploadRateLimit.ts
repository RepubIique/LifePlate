import type { MealGuardrailCode } from "@lifeplate/shared";
import { pool } from "../db.js";
import { config } from "../config.js";

export class RateLimitError extends Error {
  code: MealGuardrailCode;
  status: number;

  constructor(message: string) {
    super(message);
    this.name = "RateLimitError";
    this.code = "RATE_LIMITED";
    this.status = 429;
  }
}

async function reserveAttempt(
  userId: string,
  table: "upload_attempts" | "refine_attempts",
  limit: number,
  label: string,
): Promise<void> {
  const { rows } = await pool.query<{ id: string }>(
    `WITH recent AS (
       SELECT COUNT(*)::int AS attempt_count
       FROM ${table}
       WHERE user_id = $1 AND created_at > NOW() - INTERVAL '1 hour'
     )
     INSERT INTO ${table} (user_id)
     SELECT $1
     WHERE (SELECT attempt_count FROM recent) < $2
     RETURNING id`,
    [userId, limit],
  );

  if (!rows[0]) {
    throw new RateLimitError(
      `${label} limit reached (${limit} per hour). Try again later.`,
    );
  }

  void pool.query(
    `DELETE FROM ${table} WHERE created_at < NOW() - INTERVAL '2 hours'`,
  );
}

export async function reserveUploadAttempt(userId: string): Promise<void> {
  await reserveAttempt(
    userId,
    "upload_attempts",
    config.uploadRateLimitPerHour,
    "Upload",
  );
}

export async function reserveRefineAttempt(userId: string): Promise<void> {
  await reserveAttempt(
    userId,
    "refine_attempts",
    config.refineRateLimitPerHour,
    "Refine",
  );
}
