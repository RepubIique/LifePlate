import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const KEY = "lifeplate:lastPhotoSource";

export type PhotoSource = "camera" | "library";

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

export async function getLastPhotoSource(): Promise<PhotoSource | null> {
  const v = await read(KEY);
  return v === "camera" || v === "library" ? v : null;
}

export async function setLastPhotoSource(source: PhotoSource) {
  await write(KEY, source);
}
