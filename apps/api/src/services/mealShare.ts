import type {
  MealConfirmRequest,
  MealMacroTotals,
  MealPortionMeta,
  MealShareRequestSummary,
  MealType,
} from "@lifeplate/shared";
import {
  buildMealPortionMeta,
  scaleMealForPortions,
} from "@lifeplate/shared";
import type { PoolClient } from "pg";
import { pool } from "../db.js";
import { onMealDataChanged } from "./mealSideEffects.js";
import { mergeRawAiPortionMeta } from "./mealPortions.js";
import { areFriends } from "./friendships.js";

export class MealShareError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "MealShareError";
  }
}

function resolveBaseMacros(
  body: MealConfirmRequest,
  draftRawAi: unknown,
): MealMacroTotals {
  if (body.portionMeta?.baseMacros) {
    return body.portionMeta.baseMacros;
  }
  return {
    estimatedCalories: body.estimatedCalories,
    protein: body.protein,
    carbs: body.carbs,
    fat: body.fat,
    fibre: body.fibre,
    sugar: body.sugar,
    sodium: body.sodium,
  };
}

function friendSharePortionMeta(
  baseMacros: MealMacroTotals,
  totalPeople: number,
  estimatedServings?: number,
): { portionMeta: MealPortionMeta; macros: MealMacroTotals } {
  const totalPortions = totalPeople;
  const portionMeta =
    buildMealPortionMeta(baseMacros, totalPortions, 1, estimatedServings) ?? {
      totalPortions,
      portionsEaten: 1,
      baseMacros,
      estimatedServings,
    };
  const macros = scaleMealForPortions(baseMacros, totalPortions, 1);
  return { portionMeta, macros };
}

export async function validateShareFriendIds(
  userId: string,
  friendIds: string[] | undefined,
  client: PoolClient,
): Promise<string[]> {
  if (!friendIds?.length) return [];

  const unique = [...new Set(friendIds.filter((id) => id && id !== userId))];
  if (unique.length === 0) return [];

  for (const friendId of unique) {
    const friends = await areFriends(userId, friendId, client);
    if (!friends) {
      throw new MealShareError("Can only share with friends", 400, "NOT_FRIEND");
    }
  }

  return unique;
}

export async function createMealShareRequests(
  client: PoolClient,
  params: {
    fromUserId: string;
    sourceMealId: string;
    friendIds: string[];
    body: MealConfirmRequest;
    draftRawAi: unknown;
    mealType: MealType | string | null;
    imageUrl: string;
    logDate: string;
    loggedAt: Date;
  },
): Promise<number> {
  const { friendIds } = params;
  if (friendIds.length === 0) return 0;

  const baseMacros = resolveBaseMacros(params.body, params.draftRawAi);
  const totalPeople = 1 + friendIds.length;
  const estimatedServings = params.body.portionMeta?.estimatedServings;

  for (const friendId of friendIds) {
    const { portionMeta, macros } = friendSharePortionMeta(
      baseMacros,
      totalPeople,
      estimatedServings,
    );
    const rawAiResponse = mergeRawAiPortionMeta(params.draftRawAi, portionMeta);

    await client.query(
      `INSERT INTO meal_share_requests (
         from_user_id, to_user_id, source_meal_id, status,
         meal_type, meal_name, image_url, log_date, logged_at,
         calories, protein, carbs, fat, fibre, sugar, sodium, confidence,
         foods, raw_ai_response, portion_meta
       )
       VALUES ($1, $2, $3, 'pending', $4, $5, $6, $7::date, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
      [
        params.fromUserId,
        friendId,
        params.sourceMealId,
        params.mealType,
        params.body.mealName,
        params.imageUrl,
        params.logDate,
        params.loggedAt,
        macros.estimatedCalories,
        macros.protein,
        macros.carbs,
        macros.fat,
        macros.fibre,
        macros.sugar,
        macros.sodium,
        params.body.confidence,
        params.body.foods,
        rawAiResponse,
        JSON.stringify(portionMeta),
      ],
    );
  }

  return friendIds.length;
}

type ShareRow = {
  id: string;
  from_user_id: string;
  from_name: string | null;
  meal_type: string | null;
  meal_name: string;
  image_url: string;
  log_date: string;
  logged_at: Date;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fibre: number | null;
  sugar: number | null;
  sodium: number | null;
  confidence: string | null;
  foods: string[];
  raw_ai_response: unknown;
  portion_meta: MealPortionMeta | null;
};

function mapShareRow(r: ShareRow): MealShareRequestSummary {
  return {
    id: r.id,
    fromUserId: r.from_user_id,
    fromUserName: r.from_name?.trim() || "Friend",
    mealType: r.meal_type,
    mealName: r.meal_name,
    imageUrl: r.image_url,
    logDate: r.log_date,
    loggedAt: r.logged_at.toISOString(),
    calories: r.calories,
    protein: r.protein,
    carbs: r.carbs,
    fat: r.fat,
    fibre: r.fibre,
    sugar: r.sugar,
    sodium: r.sodium,
    confidence: r.confidence ? Number(r.confidence) : null,
    foods: r.foods ?? [],
    portionMeta: r.portion_meta ?? undefined,
  };
}

export async function listIncomingMealShares(userId: string): Promise<MealShareRequestSummary[]> {
  const { rows } = await pool.query<ShareRow>(
    `SELECT r.id, r.from_user_id, u.name AS from_name,
            r.meal_type, r.meal_name, r.image_url,
            r.log_date::text AS log_date, r.logged_at,
            r.calories, r.protein, r.carbs, r.fat, r.fibre, r.sugar, r.sodium,
            r.confidence, r.foods, r.raw_ai_response, r.portion_meta
     FROM meal_share_requests r
     JOIN users u ON u.id = r.from_user_id
     WHERE r.to_user_id = $1 AND r.status = 'pending'
     ORDER BY r.created_at DESC`,
    [userId],
  );
  return rows.map(mapShareRow);
}

export async function countIncomingMealShares(userId: string): Promise<number> {
  const { rows } = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM meal_share_requests
     WHERE to_user_id = $1 AND status = 'pending'`,
    [userId],
  );
  return Number(rows[0]?.count ?? 0);
}

export async function acceptMealShare(
  userId: string,
  shareId: string,
  portionMetaOverride?: MealPortionMeta,
): Promise<{ mealId: string }> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { rows } = await client.query<ShareRow & { source_meal_id: string | null; status: string }>(
      `SELECT r.id, r.from_user_id, u.name AS from_name,
              r.source_meal_id, r.status,
              r.meal_type, r.meal_name, r.image_url,
              r.log_date::text AS log_date, r.logged_at,
              r.calories, r.protein, r.carbs, r.fat, r.fibre, r.sugar, r.sodium,
              r.confidence, r.foods, r.raw_ai_response, r.portion_meta
       FROM meal_share_requests r
       JOIN users u ON u.id = r.from_user_id
       WHERE r.id = $1 AND r.to_user_id = $2
       FOR UPDATE`,
      [shareId, userId],
    );

    const share = rows[0];
    if (!share) {
      throw new MealShareError("Share request not found", 404);
    }
    if (share.status !== "pending") {
      throw new MealShareError("Share request already handled", 409, "ALREADY_HANDLED");
    }

    const portionMeta = portionMetaOverride ?? share.portion_meta;
    let calories = share.calories;
    let protein = share.protein;
    let carbs = share.carbs;
    let fat = share.fat;
    let fibre = share.fibre;
    let sugar = share.sugar;
    let sodium = share.sodium;

    if (portionMeta?.baseMacros) {
      const scaled = scaleMealForPortions(
        portionMeta.baseMacros,
        portionMeta.totalPortions,
        portionMeta.portionsEaten,
      );
      calories = scaled.estimatedCalories;
      protein = scaled.protein;
      carbs = scaled.carbs;
      fat = scaled.fat;
      fibre = scaled.fibre;
      sugar = scaled.sugar;
      sodium = scaled.sodium;
    }

    const rawAiResponse = mergeRawAiPortionMeta(share.raw_ai_response, portionMeta);

    await client.query(
      `UPDATE meals SET sort_index = sort_index + 1
       WHERE user_id = $1 AND log_date = $2::date`,
      [userId, share.log_date],
    );

    const mealResult = await client.query<{ id: string }>(
      `INSERT INTO meals (
         user_id, meal_type, meal_name, image_url, created_at, log_date, sort_index,
         calories, protein, carbs, fat, fibre, sugar, sodium, confidence, foods,
         raw_ai_response, shared_from_meal_id, shared_by_user_id
       )
       VALUES ($1, $2, $3, $4, $5, $6::date, 0, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
       RETURNING id`,
      [
        userId,
        share.meal_type,
        share.meal_name,
        share.image_url,
        share.logged_at,
        share.log_date,
        calories,
        protein,
        carbs,
        fat,
        fibre,
        sugar,
        sodium,
        share.confidence,
        share.foods,
        rawAiResponse,
        share.source_meal_id,
        share.from_user_id,
      ],
    );

    const mealId = mealResult.rows[0].id;

    await client.query(
      `UPDATE meal_share_requests
       SET status = 'accepted', responded_at = NOW()
       WHERE id = $1`,
      [shareId],
    );

    await client.query("COMMIT");

    await onMealDataChanged(userId, { mealLogDate: share.log_date });

    return { mealId };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function declineMealShare(userId: string, shareId: string): Promise<void> {
  const { rowCount } = await pool.query(
    `UPDATE meal_share_requests
     SET status = 'declined', responded_at = NOW()
     WHERE id = $1 AND to_user_id = $2 AND status = 'pending'`,
    [shareId, userId],
  );
  if (rowCount === 0) {
    throw new MealShareError("Share request not found", 404);
  }
}
