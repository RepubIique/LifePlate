import type { MealUploadResponse } from "@lifeplate/shared";

const sessions = new Map<string, MealUploadResponse>();

export function saveMealUploadSession(draftId: string, payload: MealUploadResponse): void {
  sessions.set(draftId, payload);
}

export function getMealUploadSession(draftId: string | undefined): MealUploadResponse | null {
  if (!draftId?.trim()) return null;
  return sessions.get(draftId) ?? null;
}

export function clearMealUploadSession(draftId: string | undefined): void {
  if (!draftId?.trim()) return;
  sessions.delete(draftId);
}

/** Expo Router params can be string | string[] — normalize to a single string. */
export function routeParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}
