import type {
  CoopChallengeInviteRequest,
  CoopChallengeSummary,
  CoopChallengeType,
} from "@lifeplate/shared";
import {
  currentWeekStartKey,
  offsetLogDateKey,
  todayDateKey,
} from "@lifeplate/shared";
import { pool } from "../db.js";
import { areFriends, friendshipPair } from "./friendships.js";
import { streakFreezeUsedThisMonth } from "./gamificationStats.js";
import { MEAL_LOG_DATE_KEY_SQL } from "./mealLogDate.js";
import { fetchHydrationHistory } from "./nutritionDashboard.js";
import { syncUserMealStats } from "./userMealStats.js";

export class CoopChallengeError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "CoopChallengeError";
  }
}

const HYDRATION_DAYS_REQUIRED = 5;
const HYDRATION_WINDOW_DAYS = 7;

type ChallengeRow = {
  id: string;
  user_a_id: string;
  user_b_id: string;
  challenge_type: CoopChallengeType;
  week_start: string;
  status: string;
  invited_by_user_id: string;
};

function weekDateKeys(weekStart: string): string[] {
  const keys: string[] = [];
  for (let i = 0; i < HYDRATION_WINDOW_DAYS; i++) {
    keys.push(offsetLogDateKey(weekStart, i));
  }
  return keys;
}

async function hydrationDaysCompleted(
  userId: string,
  weekStart: string,
  targetGlasses: number,
): Promise<number> {
  const history = await fetchHydrationHistory(userId, HYDRATION_WINDOW_DAYS);
  const weekKeys = new Set(weekDateKeys(weekStart));
  return history.filter(
    (row) => weekKeys.has(row.date) && row.glasses >= targetGlasses,
  ).length;
}

async function loadUserNames(userIds: string[]): Promise<Map<string, string | null>> {
  if (userIds.length === 0) return new Map();
  const { rows } = await pool.query<{ id: string; name: string | null }>(
    `SELECT id, name FROM users WHERE id = ANY($1::uuid[])`,
    [userIds],
  );
  return new Map(rows.map((r) => [r.id, r.name]));
}

async function rowToSummary(
  row: ChallengeRow,
  viewerId: string,
  hydrationTarget: number,
): Promise<CoopChallengeSummary> {
  const friendId = row.user_a_id === viewerId ? row.user_b_id : row.user_a_id;
  const names = await loadUserNames([viewerId, friendId]);
  const weekStart = row.week_start;

  const [viewerDays, friendDays] = await Promise.all([
    hydrationDaysCompleted(viewerId, weekStart, hydrationTarget),
    hydrationDaysCompleted(friendId, weekStart, hydrationTarget),
  ]);

  return {
    id: row.id,
    friendId,
    friendName: names.get(friendId) ?? null,
    challengeType: row.challenge_type,
    status: row.status as CoopChallengeSummary["status"],
    weekStart,
    invitedByUserId: row.invited_by_user_id,
    isInviter: row.invited_by_user_id === viewerId,
    participants: [
      {
        userId: viewerId,
        name: names.get(viewerId) ?? null,
        daysCompleted: viewerDays,
        daysRequired: HYDRATION_DAYS_REQUIRED,
      },
      {
        userId: friendId,
        name: names.get(friendId) ?? null,
        daysCompleted: friendDays,
        daysRequired: HYDRATION_DAYS_REQUIRED,
      },
    ],
  };
}

async function maybeCompleteChallenge(row: ChallengeRow): Promise<ChallengeRow> {
  if (row.status !== "active" && row.status !== "pending") return row;
  if (row.challenge_type !== "hydration_5_of_7") return row;

  const weekEnd = offsetLogDateKey(row.week_start, HYDRATION_WINDOW_DAYS - 1);
  const today = todayDateKey();
  const names = await loadUserNames([row.user_a_id, row.user_b_id]);

  const defaultTarget = 8;
  const [daysA, daysB] = await Promise.all([
    hydrationDaysCompleted(row.user_a_id, row.week_start, defaultTarget),
    hydrationDaysCompleted(row.user_b_id, row.week_start, defaultTarget),
  ]);

  const bothMet = daysA >= HYDRATION_DAYS_REQUIRED && daysB >= HYDRATION_DAYS_REQUIRED;
  if (bothMet && row.status === "active") {
    await pool.query(
      `UPDATE coop_challenges SET status = 'completed', completed_at = NOW() WHERE id = $1`,
      [row.id],
    );
    return { ...row, status: "completed" };
  }

  if (today > weekEnd && row.status === "active") {
    await pool.query(`UPDATE coop_challenges SET status = 'expired' WHERE id = $1`, [row.id]);
    return { ...row, status: "expired" };
  }

  void names;
  return row;
}

export async function listCoopChallenges(
  userId: string,
  hydrationTarget = 8,
): Promise<CoopChallengeSummary[]> {
  const weekStart = currentWeekStartKey();
  const { rows } = await pool.query<ChallengeRow>(
    `SELECT id, user_a_id, user_b_id, challenge_type, week_start::text AS week_start,
            status, invited_by_user_id
     FROM coop_challenges
     WHERE (user_a_id = $1 OR user_b_id = $1)
       AND week_start = $2::date
       AND status IN ('pending', 'active', 'completed', 'expired')
     ORDER BY created_at DESC`,
    [userId, weekStart],
  );

  const summaries: CoopChallengeSummary[] = [];
  for (const row of rows) {
    const updated = await maybeCompleteChallenge(row);
    summaries.push(await rowToSummary(updated, userId, hydrationTarget));
  }
  return summaries;
}

export async function inviteCoopChallenge(
  userId: string,
  body: CoopChallengeInviteRequest,
): Promise<CoopChallengeSummary> {
  const friendId = body.friendId?.trim();
  if (!friendId) {
    throw new CoopChallengeError("Friend is required", 400, "INVALID_FRIEND");
  }
  if (body.challengeType !== "hydration_5_of_7") {
    throw new CoopChallengeError("Unsupported challenge type", 400, "INVALID_TYPE");
  }
  if (!(await areFriends(userId, friendId))) {
    throw new CoopChallengeError("Not friends with this user", 403, "NOT_FRIEND");
  }

  const weekStart = currentWeekStartKey();
  const [userA, userB] = friendshipPair(userId, friendId);

  const { rows: existing } = await pool.query<{ id: string; status: string }>(
    `SELECT id, status FROM coop_challenges
     WHERE user_a_id = $1 AND user_b_id = $2 AND challenge_type = $3 AND week_start = $4::date`,
    [userA, userB, body.challengeType, weekStart],
  );
  if (existing[0] && existing[0].status !== "declined") {
    throw new CoopChallengeError("Challenge already exists this week", 409, "ALREADY_EXISTS");
  }

  if (existing[0]?.status === "declined") {
    await pool.query(`DELETE FROM coop_challenges WHERE id = $1`, [existing[0].id]);
  }

  const { rows } = await pool.query<ChallengeRow>(
    `INSERT INTO coop_challenges (
       user_a_id, user_b_id, challenge_type, week_start, status, invited_by_user_id
     ) VALUES ($1, $2, $3, $4::date, 'pending', $5)
     RETURNING id, user_a_id, user_b_id, challenge_type, week_start::text AS week_start,
               status, invited_by_user_id`,
    [userA, userB, body.challengeType, weekStart, userId],
  );

  const row = rows[0];
  if (!row) throw new CoopChallengeError("Could not create challenge", 500);
  return rowToSummary(row, userId, 8);
}

export async function acceptCoopChallenge(
  userId: string,
  challengeId: string,
): Promise<CoopChallengeSummary> {
  const { rows } = await pool.query<ChallengeRow>(
    `SELECT id, user_a_id, user_b_id, challenge_type, week_start::text AS week_start,
            status, invited_by_user_id
     FROM coop_challenges WHERE id = $1`,
    [challengeId],
  );
  const row = rows[0];
  if (!row) throw new CoopChallengeError("Challenge not found", 404, "NOT_FOUND");
  if (row.user_a_id !== userId && row.user_b_id !== userId) {
    throw new CoopChallengeError("Not your challenge", 403, "FORBIDDEN");
  }
  if (row.status !== "pending") {
    throw new CoopChallengeError("Challenge is not pending", 409, "INVALID_STATE");
  }
  if (row.invited_by_user_id === userId) {
    throw new CoopChallengeError("Inviter cannot accept their own invite", 400, "SELF_ACCEPT");
  }

  await pool.query(
    `UPDATE coop_challenges SET status = 'active', accepted_at = NOW() WHERE id = $1`,
    [challengeId],
  );

  return rowToSummary({ ...row, status: "active" }, userId, 8);
}

export async function declineCoopChallenge(userId: string, challengeId: string): Promise<void> {
  const { rows } = await pool.query<{ user_a_id: string; user_b_id: string; status: string }>(
    `SELECT user_a_id, user_b_id, status FROM coop_challenges WHERE id = $1`,
    [challengeId],
  );
  const row = rows[0];
  if (!row) throw new CoopChallengeError("Challenge not found", 404, "NOT_FOUND");
  if (row.user_a_id !== userId && row.user_b_id !== userId) {
    throw new CoopChallengeError("Not your challenge", 403, "FORBIDDEN");
  }
  if (row.status !== "pending") {
    throw new CoopChallengeError("Challenge is not pending", 409, "INVALID_STATE");
  }

  await pool.query(`UPDATE coop_challenges SET status = 'declined' WHERE id = $1`, [challengeId]);
}

export async function applyStreakFreeze(userId: string, isPaid: boolean): Promise<{ logDate: string }> {
  if (!isPaid) {
    throw new CoopChallengeError("Streak freeze requires LifePlate Plus", 403, "PLUS_REQUIRED");
  }
  if (await streakFreezeUsedThisMonth(userId)) {
    throw new CoopChallengeError("Streak freeze already used this month", 409, "ALREADY_USED");
  }

  const yesterday = offsetLogDateKey(todayDateKey(), -1);
  const { rows } = await pool.query<{ found: number }>(
    `SELECT 1 AS found FROM meals
     WHERE user_id = $1 AND ${MEAL_LOG_DATE_KEY_SQL} = $2::date
     LIMIT 1`,
    [userId, yesterday],
  );
  if (rows.length > 0) {
    throw new CoopChallengeError("You already logged yesterday — no freeze needed", 400, "NOT_NEEDED");
  }

  await pool.query(
    `INSERT INTO user_streak_freezes (user_id, log_date) VALUES ($1, $2::date)
     ON CONFLICT DO NOTHING`,
    [userId, yesterday],
  );

  await syncUserMealStats(userId);

  return { logDate: yesterday };
}
