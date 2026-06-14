export type MacroBreakdown = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  proteinCal: number;
  carbsCal: number;
  fatCal: number;
  macroCalories: number;
  proteinPct: number;
  carbsPct: number;
  fatPct: number;
};

export const KCAL_TO_KJ = 4.184;

export type EnergyUnit = "kcal" | "kj";

export function formatEnergyValue(calories: number, unit: EnergyUnit): number {
  return unit === "kj" ? Math.round(calories * KCAL_TO_KJ) : Math.round(calories);
}

export function energyUnitLabel(unit: EnergyUnit): string {
  return unit === "kj" ? "kJ" : "kcal";
}

export function computeMacroBreakdown(
  calories: number,
  protein: number,
  carbs: number,
  fat: number,
): MacroBreakdown {
  const proteinCal = protein * 4;
  const carbsCal = carbs * 4;
  const fatCal = fat * 9;
  const macroCalories = proteinCal + carbsCal + fatCal;
  const total = macroCalories > 0 ? macroCalories : 1;

  return {
    calories: Math.max(0, calories),
    protein: Math.max(0, protein),
    carbs: Math.max(0, carbs),
    fat: Math.max(0, fat),
    proteinCal,
    carbsCal,
    fatCal,
    macroCalories,
    proteinPct: proteinCal / total,
    carbsPct: carbsCal / total,
    fatPct: fatCal / total,
  };
}
