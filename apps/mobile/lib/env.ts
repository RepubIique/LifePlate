const REQUIRED_VARS = [
  "EXPO_PUBLIC_API_URL",
  "EXPO_PUBLIC_SUPABASE_URL",
  "EXPO_PUBLIC_SUPABASE_ANON_KEY",
] as const;

export function assertMobileEnv() {
  if (__DEV__) return;

  const missing = REQUIRED_VARS.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}

export function getApiUrl(): string {
  if (__DEV__) {
    return process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001";
  }
  return process.env.EXPO_PUBLIC_API_URL!;
}

export function getSupabaseConfig() {
  if (__DEV__) {
    return {
      url: process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
      anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "",
    };
  }
  return {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  };
}
