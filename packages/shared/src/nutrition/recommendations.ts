import type {
  FoodRecommendation,
  NutritionGaps,
  RecommendationImpact,
} from "./types.js";
import {
  buildCoachSummaryWithContext,
  isWrapUpMode,
  type CoachDayContext,
  type CoachPillarProgress,
} from "./coachingContext.js";

export type { CoachDayContext, CoachPillarProgress } from "./coachingContext.js";
export { buildPlateMessage } from "./coachingContext.js";

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

export function buildFoodRecommendations(
  gaps: NutritionGaps,
  context?: CoachDayContext,
): {
  items: FoodRecommendation[];
  impact: RecommendationImpact[];
} {
  const items: FoodRecommendation[] = [];
  const impact: RecommendationImpact[] = [];

  if (isWrapUpMode(context)) {
    if (gaps.hydrationGlasses >= 1) {
      return {
        items: SUGGESTIONS.hydration,
        impact: [{ label: "Hydration", detail: "+1–2 glasses" }],
      };
    }
    return {
      items: [{ icon: "water", name: "Wind down — tomorrow is a fresh plate" }],
      impact: [{ label: "Rest", detail: "Fresh start tomorrow" }],
    };
  }

  if (gaps.fibreG >= 5) {
    items.push(...SUGGESTIONS.fibre);
    impact.push({ label: "Fibre", detail: "+8–12g" });
  }
  if (gaps.proteinG > 0 && gaps.proteinG >= 10) {
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
    return {
      items: [{ icon: "salad", name: "Colourful side salad" }],
      impact: [{ label: "Balance", detail: "Keep up the rhythm" }],
    };
  }

  const uniqueItems = [...new Map(items.map((item) => [item.name, item])).values()];

  return {
    items: uniqueItems.slice(0, 5),
    impact: impact.slice(0, 3),
  };
}

export function buildCoachSummary(
  gaps: NutritionGaps,
  score: number,
  progress?: CoachPillarProgress,
  context?: CoachDayContext,
): string {
  if (!context) {
    return buildLegacyCoachSummary(gaps, score, progress);
  }
  const resolvedProgress = progress ?? {
    protein: 0,
    fibre: 0,
    plants: 0,
    hydration: 0,
  };
  return buildCoachSummaryWithContext(gaps, score, resolvedProgress, context);
}

const ON_TRACK = 0.85;

function buildLegacyCoachSummary(
  gaps: NutritionGaps,
  score: number,
  progress?: CoachPillarProgress,
): string {
  if (score >= 85) {
    return "You're doing excellently. Keep this rhythm going into the evening.";
  }

  const needs: string[] = [];

  if (progress) {
    if (progress.protein < ON_TRACK) needs.push("more protein");
    if (progress.fibre < ON_TRACK) needs.push("a little more fibre");
    if (progress.plants < ON_TRACK) needs.push("more plant variety");
    if (progress.hydration < ON_TRACK && gaps.hydrationGlasses >= 1) {
      needs.push("more hydration");
    }
  } else {
    if (gaps.proteinG > 0 && gaps.proteinG >= 12) needs.push("more protein");
    if (gaps.fibreG >= 8) needs.push("a little more fibre");
    if (gaps.plantServes >= 2) needs.push("more plant variety");
  }

  if (needs.length === 0) {
    return "You're doing well. Small additions across the day would make today excellent.";
  }

  if (needs.length === 1) {
    const phrase = needs[0]!;
    return `You're doing well. ${phrase.charAt(0).toUpperCase()}${phrase.slice(1)} would make today excellent.`;
  }

  return `You're doing well. ${needs[0]} and ${needs[1]} would make today excellent.`;
}

export type PlanSuggestion = {
  pillar: "fibre" | "protein" | "plants" | "hydration";
  message: string;
  noteHint: string;
  foods: string[];
};

export function buildPlanSuggestions(gaps: NutritionGaps): PlanSuggestion[] {
  const suggestions: PlanSuggestion[] = [];

  if (gaps.fibreG >= 5) {
    suggestions.push({
      pillar: "fibre",
      message: "You're low on fibre this week — try adding beans or lentils to a planned meal.",
      noteHint: "Include beans or lentils for more fibre",
      foods: SUGGESTIONS.fibre.map((item) => item.name),
    });
  }
  if (gaps.proteinG > 0 && gaps.proteinG >= 10) {
    suggestions.push({
      pillar: "protein",
      message: "Protein is light this week — plan a meal with eggs, fish, or legumes.",
      noteHint: "Add a protein boost (eggs, fish, or legumes)",
      foods: SUGGESTIONS.protein.map((item) => item.name),
    });
  }
  if (gaps.plantServes >= 2) {
    suggestions.push({
      pillar: "plants",
      message: "Plant variety is low — pencil in a colourful side or extra veg.",
      noteHint: "Add extra vegetables or a colourful side",
      foods: SUGGESTIONS.plants.map((item) => item.name),
    });
  }
  if (gaps.hydrationGlasses >= 2) {
    suggestions.push({
      pillar: "hydration",
      message: "Hydration could use a lift — plan lighter meals with plenty of water.",
      noteHint: "Pair with extra water through the day",
      foods: SUGGESTIONS.hydration.map((item) => item.name),
    });
  }

  return suggestions.slice(0, 2);
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
    return `Only ${fibrePct}% of your fibre target so far — one fruit and one veg serving would help more than cutting calories.`;
  }

  if (totals.protein < targets.dailyProteinG * 0.7) {
    return "Protein is still light today. Eggs, fish, tofu, or legumes at your next meal would improve balance.";
  }

  if (plantCount < 4) {
    return "Macros look fine, but plant diversity is modest. More colour on your plate would lift gut health.";
  }

  return "Today's choices support long-term health. Keep pairing protein with plants and fibre across meals.";
}
