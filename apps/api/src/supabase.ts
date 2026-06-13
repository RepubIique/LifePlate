import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import ws from "ws";
import { config } from "./config.js";

let client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw new Error("Supabase is not configured");
  }
  if (!client) {
    client = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      // Node 20 on Render has no native WebSocket; required for supabase-js auth client init.
      realtime: { transport: ws as never },
    });
  }
  return client;
}
