export const PLANT_UNIT_OPTIONS = ["cup", "tbsp", "handful", "serve"] as const;

export type PlantUnit = (typeof PLANT_UNIT_OPTIONS)[number];

export const PLANT_AMOUNT_PRESETS = [0.25, 0.5, 1, 1.5, 2] as const;

export type ParsedPlantFood = {
  name: string;
  amount: number;
  unit: PlantUnit | null;
  raw: string;
};

const UNIT_PATTERN =
  "cup|cups|tbsp|tbsps|tablespoon|tablespoons|handful|handfuls|serve|serves";

function parseAmountToken(token: string): number | null {
  if (/^\d+\/\d+$/.test(token)) {
    const [numerator, denominator] = token.split("/").map(Number);
    if (!denominator) return null;
    return numerator / denominator;
  }
  const value = Number(token);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function normalizeUnit(unit: string): PlantUnit | null {
  const lower = unit.toLowerCase();
  if (lower === "cup" || lower === "cups") return "cup";
  if (lower === "tbsp" || lower === "tbsps" || lower === "tablespoon" || lower === "tablespoons") {
    return "tbsp";
  }
  if (lower === "handful" || lower === "handfuls") return "handful";
  if (lower === "serve" || lower === "serves") return "serve";
  return null;
}

export function formatPlantAmount(amount: number): string {
  if (Math.abs(amount - 0.25) < 0.001) return "1/4";
  if (Math.abs(amount - 0.5) < 0.001) return "1/2";
  if (Math.abs(amount - 0.75) < 0.001) return "3/4";
  if (Number.isInteger(amount)) return String(amount);
  return String(Math.round(amount * 100) / 100);
}

export function parsePlantFoodText(food: string): ParsedPlantFood {
  const raw = food.trim();
  if (!raw) {
    return { name: "", amount: 1, unit: null, raw };
  }

  const quantityMatch = raw.match(/^(\d+\/\d+|\d+(?:\.\d+)?)\s+(.+)$/i);
  if (!quantityMatch) {
    return { name: raw, amount: 1, unit: null, raw };
  }

  const amount = parseAmountToken(quantityMatch[1]) ?? 1;
  const rest = quantityMatch[2].trim();
  const unitMatch = rest.match(new RegExp(`^(${UNIT_PATTERN})\\s+(.+)$`, "i"));
  if (unitMatch) {
    return {
      name: unitMatch[2].trim(),
      amount,
      unit: normalizeUnit(unitMatch[1]),
      raw,
    };
  }

  return { name: rest, amount, unit: null, raw };
}

export function formatPlantFoodText(
  name: string,
  amount = 1,
  unit: PlantUnit | null = null,
): string {
  const baseName = name.trim();
  if (!baseName) return "";
  if (amount === 1 && !unit) return baseName;

  const parts = [formatPlantAmount(amount)];
  if (unit) parts.push(unit);
  parts.push(baseName);
  return parts.join(" ");
}

export function sumPlantServes(foods: string[], isPlantFood: (food: string) => boolean): number {
  let total = 0;
  for (const food of foods) {
    if (!isPlantFood(food)) continue;
    total += parsePlantFoodText(food).amount;
  }
  return Math.round(total * 10) / 10;
}
