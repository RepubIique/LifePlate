import type { NutritionIconKey } from "@lifeplate/shared";

/** Maps legacy emoji payloads to icon keys (for cached / stale API responses). */
const LEGACY_EMOJI_TO_ICON: Record<string, NutritionIconKey> = {
  "🍎": "apple",
  "🥝": "kiwi",
  "🥗": "salad",
  "🥚": "egg",
  "🫘": "legumes",
  "🐟": "fish",
  "🥦": "broccoli",
  "🫑": "pepper",
  "🥕": "carrot",
  "💧": "water",
  "⚡": "carbs",
  "🥑": "fat",
  "🦠": "fermented",
  "🌱": "prebiotic",
};

export function resolveNutritionIconKey(
  icon: NutritionIconKey | undefined,
  emoji?: string,
): NutritionIconKey {
  if (icon) return icon;
  if (emoji && LEGACY_EMOJI_TO_ICON[emoji]) return LEGACY_EMOJI_TO_ICON[emoji];
  return "salad";
}

export function hexWithAlpha(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return hex;
  const clamped = Math.max(0, Math.min(1, alpha));
  const alphaHex = Math.round(clamped * 255)
    .toString(16)
    .padStart(2, "0");
  return `#${normalized}${alphaHex}`;
}
