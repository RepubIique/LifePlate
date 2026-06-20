import type { MealUploadResponse } from "@lifeplate/shared";

export type MealUploadSession = MealUploadResponse & {
  /** Compressed photo kept on device for confirm + timeline display. */
  localImageUri?: string;
  /** Logged from a text description instead of a photo. */
  isTextLog?: boolean;
};

const sessions = new Map<string, MealUploadSession>();

export function saveMealUploadSession(draftId: string, payload: MealUploadSession): void {
  sessions.set(draftId, payload);
}

export function getMealUploadSession(draftId: string | undefined): MealUploadSession | null {
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
