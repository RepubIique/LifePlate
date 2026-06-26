import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const KEY = "lifeplate:themePreference";

export type ThemePreference = "system" | "light" | "dark";

async function read(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    return globalThis.localStorage?.getItem(key) ?? null;
  }
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function write(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    globalThis.localStorage?.setItem(key, value);
    return;
  }
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    // Non-critical preference — ignore storage failures.
  }
}

export async function getThemePreference(): Promise<ThemePreference | null> {
  const value = await read(KEY);
  return value === "system" || value === "light" || value === "dark" ? value : null;
}

export async function setThemePreference(preference: ThemePreference): Promise<void> {
  await write(KEY, preference);
}

export function themePreferenceLabel(preference: ThemePreference): string {
  switch (preference) {
    case "system":
      return "System";
    case "light":
      return "Light";
    case "dark":
      return "Dark";
  }
}
