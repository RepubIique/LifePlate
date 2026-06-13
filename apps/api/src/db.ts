import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { config } from "./config.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const useSsl =
  config.databaseUrl.includes("supabase") ||
  config.databaseUrl.includes("sslmode=require");

export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
});

export async function runMigrations() {
  const files = [
    "001_init.sql",
    "002_nutrition_details.sql",
    "003_user_body_metrics.sql",
  ];
  for (const file of files) {
    const sql = readFileSync(join(__dirname, "../migrations", file), "utf-8");
    await pool.query(sql);
  }
}

export async function upsertUser(id: string, email: string, name?: string | null) {
  await pool.query(
    `INSERT INTO users (id, email, name)
     VALUES ($1, $2, $3)
     ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email`,
    [id, email, name ?? null],
  );
}
