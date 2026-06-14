import type { MealPortionMeta } from "@lifeplate/shared";
import { parseMealPortionMeta } from "@lifeplate/shared";

export function mergeRawAiPortionMeta(
  rawAiResponse: unknown,
  portionMeta: MealPortionMeta | null | undefined,
): string {
  const base =
    rawAiResponse && typeof rawAiResponse === "object"
      ? { ...(rawAiResponse as Record<string, unknown>) }
      : rawAiResponse != null
        ? { legacy: rawAiResponse }
        : {};

  if (portionMeta) {
    return JSON.stringify({ ...base, portionMeta });
  }

  const { portionMeta: _removed, ...rest } = base as {
    portionMeta?: MealPortionMeta;
    [key: string]: unknown;
  };
  return JSON.stringify(rest);
}

export function extractMealPortionMeta(rawAiResponse: unknown) {
  return parseMealPortionMeta(rawAiResponse);
}
