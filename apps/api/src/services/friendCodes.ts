import { randomInt } from "node:crypto";
import type { PoolClient } from "pg";
import { pool } from "../db.js";

/** Safe alphabet — no 0/O, 1/I/L. */
const FRIEND_CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export const FRIEND_CODE_LENGTH = 6;

export function generateFriendCode(): string {
  let code = "";
  for (let i = 0; i < FRIEND_CODE_LENGTH; i++) {
    code += FRIEND_CODE_ALPHABET[randomInt(FRIEND_CODE_ALPHABET.length)]!;
  }
  return code;
}

export function normalizeFriendCode(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

async function friendCodeTaken(code: string, client: PoolClient): Promise<boolean> {
  const { rows } = await client.query<{ id: string }>(
    `SELECT id FROM users WHERE friend_code = $1 LIMIT 1`,
    [code],
  );
  return rows.length > 0;
}

export async function ensureUserFriendCode(userId: string): Promise<string> {
  const existing = await pool.query<{ friend_code: string | null }>(
    `SELECT friend_code FROM users WHERE id = $1`,
    [userId],
  );
  const current = existing.rows[0]?.friend_code;
  if (current) return current;

  for (let attempt = 0; attempt < 20; attempt++) {
    const code = generateFriendCode();
    const client = await pool.connect();
    try {
      if (await friendCodeTaken(code, client)) continue;

      const { rows } = await client.query<{ friend_code: string }>(
        `UPDATE users SET friend_code = $2
         WHERE id = $1 AND friend_code IS NULL
         RETURNING friend_code`,
        [userId, code],
      );
      if (rows[0]?.friend_code) return rows[0].friend_code;

      const retry = await client.query<{ friend_code: string | null }>(
        `SELECT friend_code FROM users WHERE id = $1`,
        [userId],
      );
      if (retry.rows[0]?.friend_code) return retry.rows[0].friend_code;
    } finally {
      client.release();
    }
  }

  throw new Error("Failed to assign friend code");
}
