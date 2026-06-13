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
