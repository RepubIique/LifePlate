import { pool } from "../db.js";

export type UserImageStorageFlags = {
  isPaid: boolean;
  cloudImageBackup: boolean;
};

const FLAGS_CACHE_TTL_MS = 60_000;
const flagsCache = new Map<
  string,
  { flags: UserImageStorageFlags; expiresAt: number }
>();

export function invalidateUserImageStorageFlags(userId: string): void {
  flagsCache.delete(userId);
}

export async function loadUserImageStorageFlags(
  userId: string,
): Promise<UserImageStorageFlags> {
  const cached = flagsCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.flags;
  }

  const { rows } = await pool.query<{
    is_paid: boolean;
    cloud_image_backup: boolean;
  }>(
    `SELECT is_paid, cloud_image_backup FROM users WHERE id = $1`,
    [userId],
  );
  const row = rows[0];
  const flags: UserImageStorageFlags = {
    isPaid: row?.is_paid ?? false,
    cloudImageBackup: row?.cloud_image_backup ?? false,
  };
  flagsCache.set(userId, {
    flags,
    expiresAt: Date.now() + FLAGS_CACHE_TTL_MS,
  });
  return flags;
}

export function shouldUploadMealToCloud(flags: UserImageStorageFlags): boolean {
  return flags.isPaid && flags.cloudImageBackup;
}

/** Persisted cloud URL for meals — empty when photos are device-only or legacy inline base64. */
export function normalizeMealCloudImageUrl(url: string | null | undefined): string {
  const trimmed = url?.trim() ?? "";
  if (!trimmed || trimmed.startsWith("data:")) return "";
  if (trimmed.includes("/storage/v1/object/") && trimmed.includes("data:image")) {
    return "";
  }
  return trimmed;
}
