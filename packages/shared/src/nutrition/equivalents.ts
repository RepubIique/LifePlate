export type MacroEquivalentType = "protein" | "fibre" | "carbs" | "fat";

type EquivalentRef = {
  label: string;
  grams: number;
};

const EQUIVALENTS: Record<MacroEquivalentType, EquivalentRef[]> = {
  protein: [
    { label: "5 eggs", grams: 30 },
    { label: "120g chicken breast", grams: 24 },
    { label: "1.5 cans tuna", grams: 25 },
  ],
  fibre: [
    { label: "1 apple", grams: 4 },
    { label: "1 cup broccoli", grams: 5 },
    { label: "1 tbsp chia seeds", grams: 5 },
  ],
  carbs: [
    { label: "2 cups cooked rice", grams: 45 },
    { label: "4 slices wholemeal bread", grams: 60 },
    { label: "1 banana", grams: 27 },
  ],
  fat: [
    { label: "1 avocado", grams: 15 },
    { label: "1.5 tbsp olive oil", grams: 21 },
    { label: "30 almonds", grams: 15 },
  ],
};

const STILL_NEEDED_FIBRE = ["1 apple", "1 cup broccoli", "1 tbsp chia seeds"];
const STILL_NEEDED_PROTEIN = ["2 eggs", "100g chicken", "1 cup Greek yoghurt"];

export function formatMacroEquivalents(
  grams: number,
  macro: MacroEquivalentType,
): string[] {
  return EQUIVALENTS[macro].map((ref) => ref.label);
}

export function stillNeededForMacro(
  macro: "protein" | "fibre",
  progress: number,
): string[] | undefined {
  if (progress >= 1) return undefined;
  return macro === "protein" ? STILL_NEEDED_PROTEIN : STILL_NEEDED_FIBRE;
}
