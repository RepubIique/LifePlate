import { pool } from "../db.js";
import { invalidateUserImageStorageFlags } from "./userFeatures.js";

/** Placeholder email when a webhook creates the row before the user hits the API. */
function subscriptionPlaceholderEmail(userId: string): string {
  return `${userId}@subscription.lifeplate.local`;
}

export async function setUserPaidStatus(
  userId: string,
  isPaid: boolean,
  email?: string | null,
): Promise<void> {
  await pool.query(
    `INSERT INTO users (id, email, is_paid)
     VALUES ($1, $2, $3)
     ON CONFLICT (id) DO UPDATE SET is_paid = EXCLUDED.is_paid`,
    [userId, email?.trim() || subscriptionPlaceholderEmail(userId), isPaid],
  );
  invalidateUserImageStorageFlags(userId);
}
