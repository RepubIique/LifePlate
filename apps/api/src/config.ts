import "dotenv/config";

const isProduction = process.env.NODE_ENV === "production";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function optional(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

function positiveInt(name: string, fallback: string): number {
  const raw = optional(name, fallback);
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Invalid ${name}: must be a positive number`);
  }
  return Math.floor(value);
}

function resolveDatabaseUrl(): string {
  if (isProduction) {
    return required("DATABASE_URL");
  }
  return optional(
    "DATABASE_URL",
    "postgresql://lifeplate:lifeplate@localhost:5432/lifeplate",
  );
}

const port = Number(optional("PORT", "3001"));
if (!Number.isFinite(port) || port <= 0) {
  throw new Error("Invalid PORT: must be a positive number");
}

export const config = {
  port,
  databaseUrl: resolveDatabaseUrl(),
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  supabaseJwtSecret: process.env.SUPABASE_JWT_SECRET ?? "",
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  openaiModel: optional("OPENAI_MODEL", "gpt-4o-mini"),
  uploadRateLimitPerHour: positiveInt("UPLOAD_RATE_LIMIT_PER_HOUR", "10"),
  refineRateLimitPerHour: positiveInt("REFINE_RATE_LIMIT_PER_HOUR", "100"),
  storageBucket: optional("SUPABASE_STORAGE_BUCKET", "meals"),
  corsOrigin: optional("CORS_ORIGIN", "*"),
  runMigrations: optional("RUN_MIGRATIONS", isProduction ? "false" : "true") === "true",
};

export function assertRuntimeConfig() {
  if (isProduction) {
    required("SUPABASE_URL");
    required("SUPABASE_SERVICE_ROLE_KEY");
    if (!config.supabaseJwtSecret.trim()) {
      throw new Error("Missing required env var: SUPABASE_JWT_SECRET");
    }
    if (!config.openaiApiKey.trim() || config.openaiApiKey.includes("your-openai-key")) {
      throw new Error("Missing or placeholder OPENAI_API_KEY");
    }
    return;
  }

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    console.warn(
      "Warning: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set. Auth/storage may fail.",
    );
  }
  if (config.supabaseUrl && !config.supabaseJwtSecret.trim()) {
    console.warn(
      "Warning: SUPABASE_JWT_SECRET not set. Auth will call Supabase on every request.",
    );
  }
  if (!config.openaiApiKey) {
    console.warn("Warning: OPENAI_API_KEY not set. Meal analysis will use mock data.");
  }
}
