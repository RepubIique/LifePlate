import { useEffect, useState } from "react";
import { Directory, File, Paths } from "expo-file-system";
import { Platform } from "react-native";
import { copyUriToFile, downloadUrlToFile } from "@/lib/localFileOps";

function avatarDir(): Directory {
  return new Directory(Paths.cache, "lifeplate", "avatars");
}

function avatarFile(userId: string): File {
  return new File(avatarDir(), `${userId}.jpg`);
}

export async function getCachedAvatarUri(userId: string): Promise<string | null> {
  if (Platform.OS === "web") return null;
  const file = avatarFile(userId);
  return file.exists ? file.uri : null;
}

export async function downloadAndCacheAvatar(
  userId: string,
  url: string,
): Promise<string> {
  const file = avatarFile(userId);
  const downloaded = await downloadUrlToFile(url, file);
  return downloaded.uri;
}

export async function saveAvatarFromLocalUri(
  userId: string,
  sourceUri: string,
): Promise<string> {
  const dest = avatarFile(userId);
  if (sourceUri !== dest.uri) {
    await copyUriToFile(sourceUri, dest);
  }
  return dest.uri;
}

export async function clearCachedAvatar(userId: string): Promise<void> {
  if (Platform.OS === "web") return;
  const file = avatarFile(userId);
  if (file.exists) {
    file.delete();
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
