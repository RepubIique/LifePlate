import type { MealAnalysisResult } from "@lifeplate/shared";
import { pool } from "../db.js";
import { imageUrlToBuffer } from "./imageFetch.js";

const TTL_MS = 30 * 60 * 1000;

export interface Draft {
  userId: string;
  imageUrl: string;
  imageBuffer?: Buffer;
  mimeType?: string;
  analysis: MealAnalysisResult;
  rawAiResponse: unknown;
  expiresAt: number;
}

type DraftRow = {
  user_id: string;
  image_url: string;
  image_data: Buffer | null;
  mime_type: string;
  analysis: MealAnalysisResult;
  raw_ai_response: unknown;
  expires_at: Date;
};

function rowToDraft(row: DraftRow): Draft {
  return {
    userId: row.user_id,
    imageUrl: row.image_url,
    imageBuffer: row.image_data ?? undefined,
    mimeType: row.mime_type,
    analysis: row.analysis,
    rawAiResponse: row.raw_ai_response,
    expiresAt: row.expires_at.getTime(),
  };
}

async function pruneExpiredDrafts() {
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
  await pruneExpiredDrafts();

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

export async function getDraft(
  draftId: string,
  userId: string,
): Promise<Draft | null> {
  await pruneExpiredDrafts();

  const { rows } = await pool.query<DraftRow>(
    `SELECT user_id, image_url, image_data, mime_type, analysis, raw_ai_response, expires_at
     FROM meal_drafts
     WHERE id = $1 AND user_id = $2 AND expires_at > NOW()`,
    [draftId, userId],
  );

  const row = rows[0];
  return row ? rowToDraft(row) : null;
}

export async function deleteDraft(draftId: string | undefined) {
  if (!draftId) return;
  await pool.query(`DELETE FROM meal_drafts WHERE id = $1`, [draftId]);
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

export async function getDraftImage(
  draft: Draft,
): Promise<{ buffer: Buffer; mimeType: string }> {
  if (draft.imageBuffer) {
    return {
      buffer: draft.imageBuffer,
      mimeType: draft.mimeType ?? "image/jpeg",
    };
  }
  return imageUrlToBuffer(draft.imageUrl);
}
