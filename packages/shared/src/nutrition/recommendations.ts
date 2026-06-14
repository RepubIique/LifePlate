import type {
  FoodRecommendation,
  NutritionGaps,
  RecommendationImpact,
} from "./types.js";

const SUGGESTIONS: Record<
  "fibre" | "protein" | "plants" | "hydration",
  FoodRecommendation[]
> = {
  fibre: [
    { icon: "apple", name: "Apple" },
    { icon: "kiwi", name: "Kiwi fruit" },
    { icon: "salad", name: "Large salad" },
  ],
  protein: [
    { icon: "egg", name: "2 eggs" },
    { icon: "legumes", name: "Lentils or beans" },
    { icon: "fish", name: "Tinned fish" },
  ],
  plants: [
    { icon: "broccoli", name: "Broccoli side" },
    { icon: "pepper", name: "Capsicum strips" },
    { icon: "carrot", name: "Carrot sticks" },
  ],
  hydration: [{ icon: "water", name: "Large glass of water" }],
};

const DEFAULT_SUGGESTIONS: FoodRecommendation[] = [
  { icon: "apple", name: "Apple" },
  { icon: "kiwi", name: "Kiwi fruit" },
  { icon: "salad", name: "Large salad" },
  { icon: "legumes", name: "Lentils or beans" },
  { icon: "egg", name: "2 eggs" },
];

export function buildFoodRecommendations(gaps: NutritionGaps): {
  items: FoodRecommendation[];
  impact: RecommendationImpact[];
} {
  const items: FoodRecommendation[] = [];
  const impact: RecommendationImpact[] = [];

  if (gaps.fibreG >= 5) {
    items.push(...SUGGESTIONS.fibre);
    impact.push({ label: "Fibre", detail: "+8–12g" });
  }
  if (gaps.proteinG >= 10) {
    items.push(...SUGGESTIONS.protein);
    impact.push({ label: "Protein", detail: "+15–20g" });
  }
  if (gaps.plantServes >= 2) {
    items.push(...SUGGESTIONS.plants);
    impact.push({ label: "Plant diversity", detail: "+3 foods" });
  }
  if (gaps.hydrationGlasses >= 2) {
    items.push(...SUGGESTIONS.hydration);
    impact.push({ label: "Hydration", detail: "+2 glasses" });
  }

  if (items.length === 0) {
    items.push(...DEFAULT_SUGGESTIONS);
    impact.push(
      { label: "Fibre", detail: "+8–12g" },
      { label: "Protein", detail: "+15–20g" },
      { label: "Plant diversity", detail: "+3 foods" },
    );
  }

  const uniqueItems = [...new Map(items.map((item) => [item.name, item])).values()];

  return {
    items: uniqueItems.slice(0, 5),
    impact: impact.slice(0, 3),
  };
}

export function buildCoachSummary(gaps: NutritionGaps, score: number): string {
  if (score >= 85) {
    return "You're doing excellently. Keep this rhythm going into the evening.";
  }

  const messages: string[] = [];
  if (gaps.fibreG >= 8) messages.push("a little more fibre");
  if (gaps.proteinG >= 12) messages.push("more protein");
  if (gaps.plantServes >= 2) messages.push("more plant variety");

  if (messages.length === 0) {
    return "You're doing well. Small additions across the day would make today excellent.";
  }

  if (messages.length === 1) {
    return `You're doing well. ${messages[0].charAt(0).toUpperCase()}${messages[0].slice(1)} would make today excellent.`;
  }

  return `You're doing well. ${messages[0]} and ${messages[1]} would make today excellent.`;
}

export function buildLifeplateInsightTemplate(
  totals: { fibre: number; protein: number; calories: number },
  targets: { dailyFibreG: number; dailyProteinG: number; dailyCalories: number },
  plantCount: number,
): string {
  const fibrePct = targets.dailyFibreG > 0
    ? Math.round((totals.fibre / targets.dailyFibreG) * 100)
    : 0;

  if (fibrePct < 60) {
    return `You hit enough energy today, but only ${fibrePct}% of your fibre target. Adding one fruit and one vegetable serving would have a bigger long-term health impact than reducing calories further.`;
  }

  if (totals.protein < targets.dailyProteinG * 0.7) {
    return "Your energy is covered, but protein is still light for muscle support and fullness. Anchoring your next meal with eggs, fish, tofu, or legumes would improve today's balance.";
  }

  if (plantCount < 4) {
    return "Macros look reasonable, but plant diversity is still modest. More colourful plants would lift gut health and micronutrient variety without needing to track harder.";
  }

  return "Today's choices support long-term health, not just calories. Keep pairing protein with plants and fibre across meals to maintain this momentum.";
}
