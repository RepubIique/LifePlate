import type { MealAnalysisResult } from "@lifeplate/shared";
import { pool } from "../db.js";
import { imageUrlToBuffer } from "./imageFetch.js";

const TTL_MS = 30 * 60 * 1000;
const DRAFT_PRUNE_INTERVAL_MS = 5 * 60 * 1000;

let lastDraftPruneAt = 0;

export interface Draft {
  id: string;
  userId: string;
  imageUrl: string;
  imageBuffer?: Buffer;
  hasImageData?: boolean;
  mimeType?: string;
  analysis: MealAnalysisResult;
  rawAiResponse: unknown;
  expiresAt: number;
}

export type GetDraftOptions = {
  /** When false, skips loading BYTEA image_data (lazy-loaded by getDraftImage). Default true. */
  includeImageData?: boolean;
};

type DraftRow = {
  user_id: string;
  image_url: string;
  image_data: Buffer | null;
  has_image_data: boolean;
  mime_type: string;
  analysis: MealAnalysisResult;
  raw_ai_response: unknown;
  expires_at: Date;
};

function rowToDraft(draftId: string, row: DraftRow): Draft {
  return {
    id: draftId,
    userId: row.user_id,
    imageUrl: row.image_url,
    imageBuffer: row.image_data ?? undefined,
    hasImageData: row.has_image_data,
    mimeType: row.mime_type,
    analysis: row.analysis,
    rawAiResponse: row.raw_ai_response,
    expiresAt: row.expires_at.getTime(),
  };
}

async function pruneExpiredDraftsIfDue() {
  const now = Date.now();
  if (now - lastDraftPruneAt < DRAFT_PRUNE_INTERVAL_MS) return;
  lastDraftPruneAt = now;
  await pool.query(`DELETE FROM meal_drafts WHERE expires_at <= NOW()`);
}

export async function saveDraft(input: {
  userId: string;
  imageUrl: string;
  imageBuffer?: Buffer;
  mimeType?: string;
  analysis: MealAnalysisResult;
  rawAiResponse: unknown;
}): Promise<string> {
  await pruneExpiredDraftsIfDue();

  const expiresAt = new Date(Date.now() + TTL_MS);
  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO meal_drafts (
       user_id, image_url, image_data, mime_type, analysis, raw_ai_response, expires_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [
      input.userId,
      input.imageUrl,
      input.imageBuffer ?? null,
      input.mimeType ?? "image/jpeg",
      input.analysis,
      input.rawAiResponse,
      expiresAt,
    ],
  );

  const draftId = rows[0]?.id;
  if (!draftId) {
    throw new Error("Failed to save meal draft");
  }
  return draftId;
}

export async function draftBelongsToUser(
  draftId: string,
  userId: string,
): Promise<boolean> {
  const { rows } = await pool.query<{ ok: number }>(
    `SELECT 1 AS ok FROM meal_drafts
     WHERE id = $1 AND user_id = $2 AND expires_at > NOW()`,
    [draftId, userId],
  );
  return rows.length > 0;
}

export async function getDraft(
  draftId: string,
  userId: string,
  options?: GetDraftOptions,
): Promise<Draft | null> {
  await pruneExpiredDraftsIfDue();

  const includeImageData = options?.includeImageData !== false;
  const imageDataColumn = includeImageData
    ? "image_data"
    : "NULL::bytea AS image_data";

  const { rows } = await pool.query<DraftRow>(
    `SELECT user_id, image_url, ${imageDataColumn},
            (image_data IS NOT NULL) AS has_image_data,
            mime_type, analysis, raw_ai_response, expires_at
     FROM meal_drafts
     WHERE id = $1 AND user_id = $2 AND expires_at > NOW()`,
    [draftId, userId],
  );

  const row = rows[0];
  return row ? rowToDraft(draftId, row) : null;
}

async function loadDraftImageData(
  draftId: string,
  userId: string,
): Promise<{ buffer: Buffer; mimeType: string } | null> {
  const { rows } = await pool.query<{ image_data: Buffer | null; mime_type: string }>(
    `SELECT image_data, mime_type FROM meal_drafts
     WHERE id = $1 AND user_id = $2 AND expires_at > NOW()`,
    [draftId, userId],
  );
  const row = rows[0];
  if (!row?.image_data) return null;
  return {
    buffer: row.image_data,
    mimeType: row.mime_type ?? "image/jpeg",
  };
}

export async function deleteDraft(draftId: string | undefined) {
  if (!draftId) return;
  await pool.query(`DELETE FROM meal_drafts WHERE id = $1`, [draftId]);
}

export function draftHasImage(draft: Draft): boolean {
  return Boolean(
    draft.imageBuffer || draft.hasImageData || draft.imageUrl?.trim(),
  );
}

export async function updateDraftAnalysis(
  draftId: string,
  userId: string,
  analysis: MealAnalysisResult,
  rawAiResponse: unknown,
): Promise<boolean> {
  const expiresAt = new Date(Date.now() + TTL_MS);
  const { rowCount } = await pool.query(
    `UPDATE meal_drafts
     SET analysis = $3,
         raw_ai_response = $4,
         expires_at = $5
     WHERE id = $1 AND user_id = $2 AND expires_at > NOW()`,
    [
      draftId,
      userId,
      analysis,
      rawAiResponse,
      expiresAt,
    ],
  );
  return (rowCount ?? 0) > 0;
}

export async function updateDraftImage(
  draftId: string,
  userId: string,
  input: { imageUrl: string; imageBuffer: Buffer; mimeType: string },
): Promise<boolean> {
  const expiresAt = new Date(Date.now() + TTL_MS);
  const { rowCount } = await pool.query(
    `UPDATE meal_drafts
     SET image_url = $3,
         image_data = $4,
         mime_type = $5,
         expires_at = $6
     WHERE id = $1 AND user_id = $2 AND expires_at > NOW()`,
    [
      draftId,
      userId,
      input.imageUrl,
      input.imageBuffer,
      input.mimeType,
      expiresAt,
    ],
  );
  return (rowCount ?? 0) > 0;
}

export async function getDraftImage(
  draft: Draft,
): Promise<{ buffer: Buffer; mimeType: string }> {
  if (draft.imageBuffer) {
    return {
      buffer: draft.imageBuffer,
      mimeType: draft.mimeType ?? "image/jpeg",
    };
  }
  if (draft.hasImageData) {
    const loaded = await loadDraftImageData(draft.id, draft.userId);
    if (loaded) return loaded;
  }
  if (!draft.imageUrl?.trim()) {
    throw new Error("Draft has no image");
  }
  return imageUrlToBuffer(draft.imageUrl);
}
