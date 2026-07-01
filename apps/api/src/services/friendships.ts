import type { FriendProfileSummary, FriendSummary, FriendsListResponse } from "@lifeplate/shared";
import { currentWeekStartKey, todayDateKey } from "@lifeplate/shared";
import type { PoolClient } from "pg";
import { pool } from "../db.js";
import { ensureUserFriendCode, normalizeFriendCode } from "./friendCodes.js";
import { listIncomingMealShares } from "./mealShare.js";
import {
  queryMealLogDaysByUserIds,
  togetherStreakForFriend,
} from "./togetherStreak.js";
import { resolveStorageObjectUrl } from "./storage.js";

export class FriendRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "FriendRequestError";
  }
}

export function friendshipPair(userId: string, otherId: string): [string, string] {
  return userId < otherId ? [userId, otherId] : [otherId, userId];
}

export async function areFriends(
  userId: string,
  otherId: string,
  client?: PoolClient,
): Promise<boolean> {
  if (userId === otherId) return false;
  const [userA, userB] = friendshipPair(userId, otherId);
  const db = client ?? pool;
  const { rows } = await db.query<{ user_a_id: string }>(
    `SELECT user_a_id FROM friendships WHERE user_a_id = $1 AND user_b_id = $2`,
    [userA, userB],
  );
  return rows.length > 0;
}

export async function listFriends(userId: string): Promise<FriendSummary[]> {
  const { rows } = await pool.query<{
    id: string;
    name: string | null;
    avatar_url: string | null;
  }>(
    `SELECT u.id, u.name, u.avatar_url
     FROM friendships f
     JOIN users u ON u.id = CASE
       WHEN f.user_a_id = $1 THEN f.user_b_id
       ELSE f.user_a_id
     END
     WHERE f.user_a_id = $1 OR f.user_b_id = $1
     ORDER BY COALESCE(u.name, u.id::text)`,
    [userId],
  );

  if (rows.length === 0) return [];

  const friendIds = rows.map((r) => r.id);
  const logDaysByUser = await queryMealLogDaysByUserIds([userId, ...friendIds]);
  const userDays = logDaysByUser.get(userId) ?? [];

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    hasAvatar: Boolean(r.avatar_url?.trim()),
    togetherStreak: togetherStreakForFriend(userDays, logDaysByUser.get(r.id) ?? []),
  }));
}

export async function addFriendByCode(userId: string, rawCode: string): Promise<FriendSummary> {
  const friendCode = normalizeFriendCode(rawCode);
  if (!friendCode) {
    throw new FriendRequestError("Friend code is required", 400, "INVALID_CODE");
  }

  const { rows: targetRows } = await pool.query<{
    id: string;
    name: string | null;
    avatar_url: string | null;
  }>(`SELECT id, name, avatar_url FROM users WHERE friend_code = $1`, [friendCode]);

  const target = targetRows[0];
  if (!target) {
    throw new FriendRequestError("Friend code not found", 404, "CODE_NOT_FOUND");
  }
  if (target.id === userId) {
    throw new FriendRequestError("You can't add yourself", 400, "SELF_ADD");
  }

  const [userA, userB] = friendshipPair(userId, target.id);
  const { rowCount } = await pool.query(
    `INSERT INTO friendships (user_a_id, user_b_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [userA, userB],
  );

  if (rowCount === 0) {
    throw new FriendRequestError("Already friends", 409, "ALREADY_FRIENDS");
  }

  return {
    id: target.id,
    name: target.name,
    hasAvatar: Boolean(target.avatar_url?.trim()),
  };
}

export async function getFriendAvatarUrl(
  userId: string,
  friendId: string,
): Promise<string | null> {
  if (!(await areFriends(userId, friendId))) {
    throw new FriendRequestError("Not friends", 404, "NOT_FRIENDS");
  }

  const { rows } = await pool.query<{ avatar_url: string | null }>(
    `SELECT avatar_url FROM users WHERE id = $1`,
    [friendId],
  );
  return resolveStorageObjectUrl(rows[0]?.avatar_url ?? null);
}

export async function removeFriend(userId: string, friendId: string): Promise<void> {
  if (userId === friendId) {
    throw new FriendRequestError("Invalid friend", 400);
  }
  const [userA, userB] = friendshipPair(userId, friendId);
  await pool.query(`DELETE FROM friendships WHERE user_a_id = $1 AND user_b_id = $2`, [
    userA,
    userB,
  ]);
}

export async function getFriendProfile(
  userId: string,
  friendId: string,
): Promise<FriendProfileSummary> {
  if (!(await areFriends(userId, friendId))) {
    throw new FriendRequestError("Not friends", 404, "NOT_FRIENDS");
  }

  const weekStart = currentWeekStartKey();
  const today = todayDateKey();

  const [
    { rows: friendRows },
    { rows: mealsWeekRows },
    { rows: loggedTodayRows },
    { rows: shareRows },
    logDaysByUser,
  ] = await Promise.all([
    pool.query<{
      name: string | null;
      avatar_url: string | null;
      current_streak: number;
      longest_streak: number;
    }>(
      `SELECT name, avatar_url, current_streak, longest_streak
       FROM users WHERE id = $1`,
      [friendId],
    ),
    pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM meals
       WHERE user_id = $1 AND log_date >= $2::date
         AND (status IS NULL OR status = 'logged')`,
      [friendId, weekStart],
    ),
    pool.query<{ logged: boolean }>(
      `SELECT EXISTS(
         SELECT 1 FROM meals
         WHERE user_id = $1 AND log_date = $2::date
           AND (status IS NULL OR status = 'logged')
       ) AS logged`,
      [friendId, today],
    ),
    pool.query<{ received: string; sent: string }>(
      `SELECT
         (SELECT COUNT(*)::text FROM meal_share_requests
          WHERE from_user_id = $2 AND to_user_id = $1 AND status = 'accepted') AS received,
         (SELECT COUNT(*)::text FROM meal_share_requests
          WHERE from_user_id = $1 AND to_user_id = $2 AND status = 'accepted') AS sent`,
      [userId, friendId],
    ),
    queryMealLogDaysByUserIds([userId, friendId]),
  ]);

  const friend = friendRows[0];
  if (!friend) {
    throw new FriendRequestError("Friend not found", 404, "NOT_FOUND");
  }

  const userDays = logDaysByUser.get(userId) ?? [];
  const friendDays = logDaysByUser.get(friendId) ?? [];

  return {
    id: friendId,
    name: friend.name,
    hasAvatar: Boolean(friend.avatar_url?.trim()),
    togetherStreak: togetherStreakForFriend(userDays, friendDays),
    currentStreak: friend.current_streak,
    longestStreak: friend.longest_streak,
    mealsThisWeek: Number(mealsWeekRows[0]?.count ?? 0),
    loggedToday: Boolean(loggedTodayRows[0]?.logged),
    sharesReceivedFromFriend: Number(shareRows[0]?.received ?? 0),
    sharesSentToFriend: Number(shareRows[0]?.sent ?? 0),
  };
}

export async function getFriendsSocialResponse(userId: string): Promise<FriendsListResponse> {
  const [friendCode, friends, pendingShares] = await Promise.all([
    ensureUserFriendCode(userId),
    listFriends(userId),
    listIncomingMealShares(userId),
  ]);
  return { friendCode, friends, pendingShares };
}
