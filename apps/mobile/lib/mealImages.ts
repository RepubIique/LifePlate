import { Directory, File, Paths } from "expo-file-system";
import { Platform } from "react-native";
import { fetchMealImageUrl } from "@/lib/api";
import { ApiError } from "@/lib/apiErrors";
import { copyUriToFile, downloadUrlToFile } from "@/lib/localFileOps";

const WEB_INDEX_PREFIX = "lifeplate:meal-image:";

function mealsDir(): Directory {
  return new Directory(Paths.document, "meals");
}

function mealFile(mealId: string): File {
  return new File(mealsDir(), `${mealId}.jpg`);
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
    if (Platform.OS === "web") {
      return await writeWebImage(mealId, sourceUri);
    }

    const dest = mealFile(mealId);
    await copyUriToFile(sourceUri, dest);
    return dest.uri;
  } catch {
    return null;
  }
}

export async function getLocalMealImageUri(mealId: string): Promise<string | null> {
  if (!mealId.trim()) return null;

  try {
    if (Platform.OS === "web") {
      return await readWebImage(mealId);
    }

    const file = mealFile(mealId);
    return file.exists ? file.uri : null;
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
    if (Platform.OS === "web") {
      return await writeWebImage(mealId, remoteUrl);
    }

    const dest = mealFile(mealId);
    const file = await downloadUrlToFile(remoteUrl, dest);
    return file.uri;
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
    if (Platform.OS === "web") {
      globalThis.localStorage?.removeItem(webIndexKey(mealId));
      return;
    }

    const file = mealFile(mealId);
    if (file.exists) {
      file.delete();
    }
  } catch {
    // Best-effort cleanup.
  }
}
