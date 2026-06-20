import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const KEY = "lifeplate:alphaWelcomeSeen";

async function read(): Promise<string | null> {
  if (Platform.OS === "web") {
    return globalThis.localStorage?.getItem(KEY) ?? null;
  }
  try {
    return await SecureStore.getItemAsync(KEY);
  } catch {
    return null;
  }
}

async function write(value: string): Promise<void> {
  if (Platform.OS === "web") {
    globalThis.localStorage?.setItem(KEY, value);
    return;
  }
  try {
    await SecureStore.setItemAsync(KEY, value);
  } catch {
    // Non-critical preference — ignore storage failures.
  }
}

export async function getHasSeenAlphaWelcome(): Promise<boolean> {
  return (await read()) === "1";
}

export async function setHasSeenAlphaWelcome(): Promise<void> {
  await write("1");
}
