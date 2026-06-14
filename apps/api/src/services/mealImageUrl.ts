import { resolveStorageObjectUrl } from "./storage.js";

/** Turn a stored meals.image_url value into a fetchable URL (signed when needed). */
export async function resolveMealImageUrl(
  stored: string | null | undefined,
): Promise<string | null> {
  const trimmed = stored?.trim() ?? "";
  if (!trimmed) return null;

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    if (trimmed.includes("/storage/v1/object/")) {
      return (await resolveStorageObjectUrl(trimmed)) ?? trimmed;
    }
    return trimmed;
  }

  return resolveStorageObjectUrl(trimmed);
}

/** For meal list responses — Plus users get fresh signed/public URLs from DB. */
export async function mealListImageUrl(
  stored: string | null | undefined,
  isPaid: boolean,
): Promise<string> {
  if (!isPaid || !stored?.trim()) return stored?.trim() ?? "";
  return (await resolveMealImageUrl(stored)) ?? "";
}
