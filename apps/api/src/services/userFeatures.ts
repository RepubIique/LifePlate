import { pool } from "../db.js";

export type UserImageStorageFlags = {
  isPaid: boolean;
  cloudImageBackup: boolean;
};

export async function loadUserImageStorageFlags(
  userId: string,
): Promise<UserImageStorageFlags> {
  const { rows } = await pool.query<{
    is_paid: boolean;
    cloud_image_backup: boolean;
  }>(
    `SELECT is_paid, cloud_image_backup FROM users WHERE id = $1`,
    [userId],
  );
  const row = rows[0];
  return {
    isPaid: row?.is_paid ?? false,
    cloudImageBackup: row?.cloud_image_backup ?? false,
  };
}

export function shouldUploadMealToCloud(flags: UserImageStorageFlags): boolean {
  return flags.isPaid && flags.cloudImageBackup;
}

/** Persisted cloud URL for meals — empty when photos are device-only. */
export function normalizeMealCloudImageUrl(url: string | null | undefined): string {
  const trimmed = url?.trim() ?? "";
  if (!trimmed || trimmed.startsWith("data:")) return "";
  return trimmed;
}
