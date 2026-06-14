export type PillarKey = "protein" | "fibre" | "plants" | "hydration";

export const PILLAR_COLORS: Record<PillarKey, string> = {
  protein: "#1B4332",
  fibre: "#E9A319",
  plants: "#52B788",
  hydration: "#4895EF",
};

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
