import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { config } from "./config.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, "../migrations");
const BASELINE_VERSION = "baseline";
const BASELINE_FILE = "schema.sql";

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

async function ensureMigrationTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function isMigrationApplied(version: string): Promise<boolean> {
  const { rows } = await pool.query<{ version: string }>(
    `SELECT version FROM _schema_migrations WHERE version = $1`,
    [version],
  );
  return rows.length > 0;
}

async function markMigrationApplied(version: string) {
  await pool.query(
    `INSERT INTO _schema_migrations (version) VALUES ($1)
     ON CONFLICT (version) DO NOTHING`,
    [version],
  );
}

async function hasExistingPublicSchema(): Promise<boolean> {
  const { rows } = await pool.query<{ reg: string }>(
    `SELECT to_regclass('public.users') AS reg`,
  );
  return rows[0]?.reg != null;
}

function incrementalMigrationFiles(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((name) => /^\d{3}_.+\.sql$/.test(name))
    .sort();
}

function migrationVersionFromFile(file: string): string {
  return file.replace(/\.sql$/, "");
}

async function applyMigrationFile(file: string) {
  const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf-8");
  await pool.query(sql);
}

export async function runMigrations() {
  await ensureMigrationTable();

  if (!(await isMigrationApplied(BASELINE_VERSION))) {
    if (await hasExistingPublicSchema()) {
      await markMigrationApplied(BASELINE_VERSION);
    } else {
      await applyMigrationFile(BASELINE_FILE);
      await markMigrationApplied(BASELINE_VERSION);
    }
  }

  for (const file of incrementalMigrationFiles()) {
    const version = migrationVersionFromFile(file);
    if (await isMigrationApplied(version)) continue;
    await applyMigrationFile(file);
    await markMigrationApplied(version);
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
