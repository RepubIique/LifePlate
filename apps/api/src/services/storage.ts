import { config } from "../config.js";
import { getSupabaseAdmin } from "../supabase.js";

/** Signed URLs for private buckets; refreshed on each profile fetch. */
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7;

/** One avatar per user — uploads overwrite this object. */
export function profileAvatarPath(userId: string): string {
  return `${userId}/avatar/avatar.jpg`;
}

export function normalizeStoragePath(stored: string): string {
  const trimmed = stored.trim();
  const publicMatch = trimmed.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
  if (publicMatch?.[1]) return decodeURIComponent(publicMatch[1]);
  const signMatch = trimmed.match(/\/storage\/v1\/object\/sign\/[^/]+\/(.+?)(?:\?|$)/);
  if (signMatch?.[1]) return decodeURIComponent(signMatch[1]);
  return trimmed;
}

export async function resolveStorageObjectUrl(
  stored: string | null | undefined,
): Promise<string | null> {
  if (!stored?.trim()) return null;

  const path = normalizeStoragePath(stored);
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.storage
    .from(config.storageBucket)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  if (!error && data.signedUrl) {
    return data.signedUrl;
  }

  const { data: publicData } = supabase.storage.from(config.storageBucket).getPublicUrl(path);
  return publicData.publicUrl;
}

async function deleteStorageObjects(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage.from(config.storageBucket).remove(paths);
  if (error) {
    throw new Error(`Storage delete failed: ${error.message}`);
  }
}

/** Remove any other objects under {userId}/avatar/ (legacy uuid filenames). */
async function removeLegacyAvatarObjects(userId: string, keepPath: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const folder = `${userId}/avatar`;
  const { data, error } = await supabase.storage.from(config.storageBucket).list(folder);
  if (error || !data?.length) return;

  const stale = data
    .map((file) => (file.name ? `${folder}/${file.name}` : null))
    .filter((path): path is string => path != null && path !== keepPath);

  if (stale.length > 0) {
    await deleteStorageObjects(stale);
  }
}

export async function uploadMealImage(
  userId: string,
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  const ext = mimeType.includes("png") ? "png" : "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage
    .from(config.storageBucket)
    .upload(path, buffer, { contentType: mimeType, upsert: false });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(config.storageBucket).getPublicUrl(path);
  return data.publicUrl;
}

/** Upload (or replace) the user's single avatar. Returns the storage path for DB. */
export async function uploadProfileAvatar(
  userId: string,
  buffer: Buffer,
  mimeType: string,
  previousStoredPath?: string | null,
): Promise<string> {
  const path = profileAvatarPath(userId);
  const supabase = getSupabaseAdmin();

  const previousPath = previousStoredPath?.trim()
    ? normalizeStoragePath(previousStoredPath)
    : null;

  if (previousPath && previousPath !== path) {
    try {
      await deleteStorageObjects([previousPath]);
    } catch {
      // Best-effort — may already be gone or live outside avatar folder.
    }
  }

  await removeLegacyAvatarObjects(userId, path);

  const contentType = mimeType.includes("png") ? "image/png" : "image/jpeg";
  const { error } = await supabase.storage
    .from(config.storageBucket)
    .upload(path, buffer, { contentType, upsert: true });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  return path;
}
