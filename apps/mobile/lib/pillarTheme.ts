import { palette } from "@/src/theme/palette";

export type PillarKey = "protein" | "fibre" | "plants" | "carbs" | "fat" | "hydration";

export const PILLAR_COLORS: Record<PillarKey, string> = {
  protein: palette.coral,
  fibre: palette.softOrange,
  plants: palette.sage,
  carbs: palette.terracotta,
  fat: palette.slateBlue,
  hydration: palette.teal,
};

/** Macro ring/bar colors aligned with the DigitalPlate pillar palette. */
export const MACRO_NUTRITION_COLORS = {
  protein: PILLAR_COLORS.protein,
  fibre: PILLAR_COLORS.fibre,
  carbs: PILLAR_COLORS.carbs,
  fat: palette.cream,
} as const;

const LABEL_TO_KEY: Record<string, PillarKey> = {
  Protein: "protein",
  Fibre: "fibre",
  Plants: "plants",
  Carbs: "carbs",
  Fats: "fat",
  "Healthy Fats": "fat",
  Hydration: "hydration",
};

export function pillarKeyFromLabel(label: string): PillarKey {
  return LABEL_TO_KEY[label] ?? "protein";
}

export function pillarColorForLabel(label: string): string {
  return PILLAR_COLORS[pillarKeyFromLabel(label)];
}
