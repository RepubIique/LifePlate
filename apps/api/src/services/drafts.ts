import type { MealAnalysisResult } from "@lifeplate/shared";

interface Draft {
  userId: string;
  imageUrl: string;
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

export function saveDraft(
  userId: string,
  imageUrl: string,
  analysis: MealAnalysisResult,
  rawAiResponse: unknown,
): string {
  prune();
  const draftId = crypto.randomUUID();
  drafts.set(draftId, {
    userId,
    imageUrl,
    analysis,
    rawAiResponse,
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

export function deleteDraft(draftId: string) {
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
