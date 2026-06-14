export type PillarKey = "protein" | "fibre" | "plants" | "hydration";

export const PILLAR_COLORS: Record<PillarKey, string> = {
  protein: "#1B4332",
  fibre: "#E9A319",
  plants: "#52B788",
  hydration: "#4895EF",
};

/** Macro ring/bar colors mapped to the DigitalPlate quadrant palette. */
export const MACRO_NUTRITION_COLORS = {
  protein: PILLAR_COLORS.protein,
  fibre: PILLAR_COLORS.fibre,
  carbs: PILLAR_COLORS.plants,
  fat: "#8B5E3C",
} as const;

const LABEL_TO_KEY: Record<string, PillarKey> = {
  Protein: "protein",
  Fibre: "fibre",
  Plants: "plants",
  Hydration: "hydration",
};

export function pillarKeyFromLabel(label: string): PillarKey {
  return LABEL_TO_KEY[label] ?? "protein";
}

export function pillarColorForLabel(label: string): string {
  return PILLAR_COLORS[pillarKeyFromLabel(label)];
}
