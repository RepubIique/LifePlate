import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { getSupabaseConfig } from "./env";

const { url: supabaseUrl, anonKey: supabaseAnonKey } = getSupabaseConfig();

const storage =
  Platform.OS === "web"
    ? {
        getItem: (key: string) => Promise.resolve(globalThis.localStorage?.getItem(key) ?? null),
        setItem: (key: string, value: string) => {
          globalThis.localStorage?.setItem(key, value);
          return Promise.resolve();
        },
        removeItem: (key: string) => {
          globalThis.localStorage?.removeItem(key);
          return Promise.resolve();
        },
      }
    : {
        getItem: (key: string) => SecureStore.getItemAsync(key),
        setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
        removeItem: (key: string) => SecureStore.deleteItemAsync(key),
      };

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
