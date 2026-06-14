import { config } from "../config.js";
import { getSupabaseAdmin } from "../supabase.js";

/** Signed URLs for private buckets; refreshed on each profile fetch. */
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7;

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

/** Returns the storage path (stored in DB). Resolve with resolveStorageObjectUrl for clients. */
export async function uploadProfileAvatar(
  userId: string,
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  const ext = mimeType.includes("png") ? "png" : "jpg";
  const path = `${userId}/avatar/${crypto.randomUUID()}.${ext}`;

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage
    .from(config.storageBucket)
    .upload(path, buffer, { contentType: mimeType, upsert: false });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  return path;
}
