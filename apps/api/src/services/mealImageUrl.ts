import { resolveStorageObjectUrl } from "./storage.js";

/** Legacy rows stored inline base64 when cloud upload failed — not a storage path. */
export function isCorruptMealImageUrl(stored: string | null | undefined): boolean {
  const trimmed = stored?.trim() ?? "";
  if (!trimmed) return false;
  if (trimmed.startsWith("data:")) return true;
  // Mangled public URL: .../public/meals/data:image/jpeg;base64,...
  if (
    trimmed.includes("/storage/v1/object/") &&
    (trimmed.includes("data:image") || trimmed.includes("data%3Aimage"))
  ) {
    return true;
  }
  return false;
}

/** Turn a stored meals.image_url value into a fetchable URL (signed when needed). */
export async function resolveMealImageUrl(
  stored: string | null | undefined,
): Promise<string | null> {
  const trimmed = stored?.trim() ?? "";
  if (!trimmed || isCorruptMealImageUrl(trimmed)) return null;

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
  const trimmed = stored?.trim() ?? "";
  if (!trimmed || isCorruptMealImageUrl(trimmed)) return "";
  if (!isPaid) return trimmed;

  const resolved = await resolveMealImageUrl(trimmed);
  if (resolved) return resolved;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return "";
}
