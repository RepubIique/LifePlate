import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";
import { fetchMealImageUrl } from "@/lib/api";
import { ApiError } from "@/lib/apiErrors";

const MEALS_DIR = `${FileSystem.documentDirectory ?? ""}meals/`;
const WEB_INDEX_PREFIX = "lifeplate:meal-image:";

function mealFilePath(mealId: string): string {
  return `${MEALS_DIR}${mealId}.jpg`;
}

async function ensureMealsDir(): Promise<void> {
  if (Platform.OS === "web" || !FileSystem.documentDirectory) return;
  const info = await FileSystem.getInfoAsync(MEALS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(MEALS_DIR, { intermediates: true });
  }
}

function webIndexKey(mealId: string): string {
  return `${WEB_INDEX_PREFIX}${mealId}`;
}

async function readWebImage(mealId: string): Promise<string | null> {
  if (Platform.OS !== "web") return null;
  return globalThis.localStorage?.getItem(webIndexKey(mealId)) ?? null;
}

async function writeWebImage(mealId: string, sourceUri: string): Promise<string> {
  const response = await fetch(sourceUri);
  const blob = await response.blob();
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read image"));
    reader.readAsDataURL(blob);
  });
  globalThis.localStorage?.setItem(webIndexKey(mealId), dataUrl);
  return dataUrl;
}

export async function saveMealImage(
  mealId: string,
  sourceUri: string,
): Promise<string | null> {
  if (!mealId.trim() || !sourceUri.trim()) return null;

  try {
    if (Platform.OS === "web" || !FileSystem.documentDirectory) {
      return await writeWebImage(mealId, sourceUri);
    }

    await ensureMealsDir();
    const dest = mealFilePath(mealId);
    await FileSystem.copyAsync({ from: sourceUri, to: dest });
    return dest;
  } catch {
    return null;
  }
}

export async function getLocalMealImageUri(mealId: string): Promise<string | null> {
  if (!mealId.trim()) return null;

  try {
    if (Platform.OS === "web" || !FileSystem.documentDirectory) {
      return await readWebImage(mealId);
    }

    const path = mealFilePath(mealId);
    const info = await FileSystem.getInfoAsync(path);
    return info.exists ? path : null;
  } catch {
    return null;
  }
}

function isRemoteImageUrl(url: string | null | undefined): url is string {
  const trimmed = url?.trim() ?? "";
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return false;
  }
  if (trimmed.includes("data:image") || trimmed.includes("data%3Aimage")) {
    return false;
  }
  return true;
}

async function cacheRemoteMealImage(
  mealId: string,
  remoteUrl: string,
): Promise<string | null> {
  if (!mealId.trim() || !remoteUrl.trim()) return null;

  try {
    if (Platform.OS === "web" || !FileSystem.documentDirectory) {
      return await writeWebImage(mealId, remoteUrl);
    }

    await ensureMealsDir();
    const dest = mealFilePath(mealId);
    await FileSystem.downloadAsync(remoteUrl, dest);
    return dest;
  } catch {
    return null;
  }
}

type ResolveMealImageOptions = {
  /** When true (Plus), fetch image_url from the API if missing locally. */
  cloudFallback?: boolean;
};

/** Prefer on-device copy; Plus users fall back to cloud URL from the meal or API. */
export async function resolveMealImageUri(
  mealId: string | undefined,
  cloudUrl?: string | null,
  options?: ResolveMealImageOptions,
): Promise<string | null> {
  if (mealId) {
    const local = await getLocalMealImageUri(mealId);
    if (local) return local;
  }

  if (isRemoteImageUrl(cloudUrl)) {
    const url = cloudUrl.trim();
    if (mealId) {
      void cacheRemoteMealImage(mealId, url);
    }
    return url;
  }

  if (options?.cloudFallback && mealId) {
    try {
      const { imageUrl } = await fetchMealImageUrl(mealId);
      if (isRemoteImageUrl(imageUrl)) {
        const url = imageUrl.trim();
        void cacheRemoteMealImage(mealId, url);
        return url;
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        return null;
      }
    }
  }

  return null;
}

export async function deleteMealImage(mealId: string): Promise<void> {
  if (!mealId.trim()) return;

  try {
    if (Platform.OS === "web" || !FileSystem.documentDirectory) {
      globalThis.localStorage?.removeItem(webIndexKey(mealId));
      return;
    }

    const path = mealFilePath(mealId);
    const info = await FileSystem.getInfoAsync(path);
    if (info.exists) {
      await FileSystem.deleteAsync(path, { idempotent: true });
    }
  } catch {
    // Best-effort cleanup.
  }
}
