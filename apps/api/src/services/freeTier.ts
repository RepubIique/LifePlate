import { computeLoggingAccess } from "@lifeplate/shared";
import { upsertUser } from "../db.js";
import { pool } from "../db.js";

export class FreeTierError extends Error {
  status: number;
  code: string;

  constructor(
    message = "Your free week has ended. Upgrade to LifePlate Plus to keep logging meals.",
    status = 403,
    code = "LOGGING_LOCKED",
  ) {
    super(message);
    this.name = "FreeTierError";
    this.status = status;
    this.code = code;
  }
}

export class UserProfileNotReadyError extends Error {
  status = 503;
  code = "USER_PROFILE_NOT_READY";

  constructor(
    message = "Your profile is still loading. Please try again in a moment.",
  ) {
    super(message);
    this.name = "UserProfileNotReadyError";
  }
}

async function loadLoggingRow(
  userId: string,
): Promise<{ is_paid: boolean; created_at: Date } | null> {
  const { rows } = await pool.query<{ is_paid: boolean; created_at: Date }>(
    `SELECT is_paid, created_at FROM users WHERE id = $1`,
    [userId],
  );
  return rows[0] ?? null;
}

export async function assertCanLogMeals(
  userId: string,
  userEmail?: string,
): Promise<void> {
  let row = await loadLoggingRow(userId);

  if (!row) {
    const email = userEmail?.trim();
    if (!email) {
      throw new UserProfileNotReadyError();
    }
    await upsertUser(userId, email);
    row = await loadLoggingRow(userId);
    if (!row) {
      throw new UserProfileNotReadyError();
    }
  }

  const access = computeLoggingAccess({
    isPaid: row.is_paid,
    createdAt: row.created_at.toISOString(),
    utcCalendar: true,
  });

  if (access.loggingLocked) {
    throw new FreeTierError();
  }
}
