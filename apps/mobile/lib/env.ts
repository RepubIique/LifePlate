function missingProductionEnvVars(): string[] {
  // Metro only inlines static `process.env.EXPO_PUBLIC_*` reads at build time.
  // Dynamic lookups like `process.env[key]` stay undefined in Release bundles.
  const missing: string[] = [];
  if (!process.env.EXPO_PUBLIC_API_URL?.trim()) {
    missing.push("EXPO_PUBLIC_API_URL");
  }
  if (!process.env.EXPO_PUBLIC_SUPABASE_URL?.trim()) {
    missing.push("EXPO_PUBLIC_SUPABASE_URL");
  }
  if (!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim()) {
    missing.push("EXPO_PUBLIC_SUPABASE_ANON_KEY");
  }
  return missing;
}

export function assertMobileEnv() {
  if (__DEV__) return;

  const missing = missingProductionEnvVars();
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
