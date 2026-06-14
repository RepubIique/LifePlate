import { config } from "../config.js";
import { getSupabaseAdmin } from "../supabase.js";

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

  const { data } = supabase.storage.from(config.storageBucket).getPublicUrl(path);
  return data.publicUrl;
}
