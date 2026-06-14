import { useEffect, useState } from "react";
import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";

const AVATAR_DIR = `${FileSystem.cacheDirectory}lifeplate/avatars/`;

function avatarFilePath(userId: string): string {
  return `${AVATAR_DIR}${userId}.jpg`;
}

async function ensureDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(AVATAR_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(AVATAR_DIR, { intermediates: true });
  }
}

export async function getCachedAvatarUri(userId: string): Promise<string | null> {
  if (Platform.OS === "web") return null;
  const path = avatarFilePath(userId);
  const info = await FileSystem.getInfoAsync(path);
  return info.exists ? path : null;
}

export async function downloadAndCacheAvatar(
  userId: string,
  url: string,
): Promise<string> {
  await ensureDir();
  const path = avatarFilePath(userId);
  const result = await FileSystem.downloadAsync(url, path);
  return result.uri;
}

export async function saveAvatarFromLocalUri(
  userId: string,
  sourceUri: string,
): Promise<string> {
  await ensureDir();
  const path = avatarFilePath(userId);
  if (sourceUri !== path) {
    await FileSystem.copyAsync({ from: sourceUri, to: path });
  }
  return path;
}

export async function clearCachedAvatar(userId: string): Promise<void> {
  if (Platform.OS === "web") return;
  const path = avatarFilePath(userId);
  const info = await FileSystem.getInfoAsync(path);
  if (info.exists) {
    await FileSystem.deleteAsync(path, { idempotent: true });
  }
}

/**
 * Resolves a device-local avatar URI. Profile metadata only exposes hasAvatar;
 * the signed URL comes from GET /api/users/me/avatar when no local file exists.
 */
export function useCachedAvatarUri(
  userId: string | null | undefined,
  hasAvatar: boolean,
  remoteAvatarUrl: string | null | undefined,
  cacheRevision = 0,
): { uri: string | null; ready: boolean } {
  const [displayUri, setDisplayUri] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!userId) {
      setDisplayUri(null);
      setReady(true);
      return;
    }

    if (!hasAvatar) {
      setDisplayUri(null);
      setReady(true);
      void clearCachedAvatar(userId);
      return;
    }

    let cancelled = false;
    setReady(false);
    void (async () => {
      const cached = await getCachedAvatarUri(userId);
      if (cancelled) return;
      if (cached) {
        setDisplayUri(cached);
        setReady(true);
        return;
      }

      if (!remoteAvatarUrl) {
        setDisplayUri(null);
        setReady(false);
        return;
      }

      try {
        const local = await downloadAndCacheAvatar(userId, remoteAvatarUrl);
        if (!cancelled) {
          setDisplayUri(local);
          setReady(true);
        }
      } catch {
        if (!cancelled) {
          setDisplayUri(remoteAvatarUrl);
          setReady(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // remoteAvatarUrl intentionally omitted — signed URLs rotate without the image changing.
  }, [userId, hasAvatar, cacheRevision, remoteAvatarUrl]);

  return { uri: displayUri, ready };
}
