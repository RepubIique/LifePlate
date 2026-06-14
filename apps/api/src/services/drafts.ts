import type { MealAnalysisResult } from "@lifeplate/shared";
import { imageUrlToBuffer } from "./imageFetch.js";

interface Draft {
  userId: string;
  imageUrl: string;
  imageBuffer?: Buffer;
  mimeType?: string;
  analysis: MealAnalysisResult;
  rawAiResponse: unknown;
  expiresAt: number;
}

const drafts = new Map<string, Draft>();
const TTL_MS = 30 * 60 * 1000;

function prune() {
  const now = Date.now();
  for (const [id, draft] of drafts) {
    if (draft.expiresAt < now) drafts.delete(id);
  }
}

export function saveDraft(input: {
  userId: string;
  imageUrl: string;
  imageBuffer?: Buffer;
  mimeType?: string;
  analysis: MealAnalysisResult;
  rawAiResponse: unknown;
}): string {
  prune();
  const draftId = crypto.randomUUID();
  drafts.set(draftId, {
    userId: input.userId,
    imageUrl: input.imageUrl,
    imageBuffer: input.imageBuffer,
    mimeType: input.mimeType,
    analysis: input.analysis,
    rawAiResponse: input.rawAiResponse,
    expiresAt: Date.now() + TTL_MS,
  });
  return draftId;
}

export function getDraft(draftId: string, userId: string): Draft | null {
  prune();
  const draft = drafts.get(draftId);
  if (!draft || draft.userId !== userId) return null;
  return draft;
}

export function deleteDraft(draftId: string | undefined) {
  if (!draftId) return;
  drafts.delete(draftId);
}

export function updateDraftAnalysis(
  draftId: string,
  userId: string,
  analysis: MealAnalysisResult,
  rawAiResponse: unknown,
): boolean {
  const draft = getDraft(draftId, userId);
  if (!draft) return false;
  drafts.set(draftId, {
    ...draft,
    analysis,
    rawAiResponse,
    expiresAt: Date.now() + TTL_MS,
  });
  return true;
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
