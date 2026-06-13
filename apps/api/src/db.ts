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

const REQUIRED_USER_COLUMNS = ["weight_kg", "height_cm", "age", "gender"] as const;

async function verifyUserSchema() {
  const { rows } = await pool.query<{ column_name: string }>(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'users'`,
  );
  const present = new Set(rows.map((r) => r.column_name));
  const missing = REQUIRED_USER_COLUMNS.filter((c) => !present.has(c));
  if (missing.length > 0) {
    throw new Error(
      `users table is missing columns: ${missing.join(", ")}. Migrations did not apply.`,
    );
  }
}

export async function runMigrations() {
  const files = [
    "001_init.sql",
    "002_nutrition_details.sql",
    "003_user_body_metrics.sql",
    "004_user_gender.sql",
    "006_upload_rate_limits.sql",
    "007_refine_rate_limits.sql",
  ];
  for (const file of files) {
    const sql = readFileSync(join(__dirname, "../migrations", file), "utf-8");
    await pool.query(sql);
  }
  await verifyUserSchema();
}

export async function upsertUser(id: string, email: string, name?: string | null) {
  await pool.query(
    `INSERT INTO users (id, email, name)
     VALUES ($1, $2, $3)
     ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email`,
    [id, email, name ?? null],
  );
}
