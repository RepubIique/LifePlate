import "dotenv/config";

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

export const config = {
  port: Number(optional("PORT", "3001")),
  databaseUrl: optional(
    "DATABASE_URL",
    "postgresql://lifeplate:lifeplate@localhost:5432/lifeplate",
  ),
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  supabaseJwtSecret: process.env.SUPABASE_JWT_SECRET ?? "",
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  openaiModel: optional("OPENAI_MODEL", "gpt-4o-mini"),
  uploadRateLimitPerHour: Number(optional("UPLOAD_RATE_LIMIT_PER_HOUR", "10")),
  refineRateLimitPerHour: Number(optional("REFINE_RATE_LIMIT_PER_HOUR", "100")),
  storageBucket: optional("SUPABASE_STORAGE_BUCKET", "meals"),
  corsOrigin: optional("CORS_ORIGIN", "*"),
};

export function assertRuntimeConfig() {
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    console.warn(
      "Warning: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set. Auth/storage may fail.",
    );
  }
  if (!config.openaiApiKey) {
    console.warn("Warning: OPENAI_API_KEY not set. Meal analysis will use mock data.");
  }
}
