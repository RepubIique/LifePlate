import { todayDateKey } from "../logDate.js";
import type { PillarProgress } from "./types.js";

export type CoachPillarProgress = {
  protein: number;
  fibre: number;
  plants: number;
  hydration: number;
};

export type DayPhase = "morning" | "midday" | "afternoon" | "evening" | "late";

export type CoachDayContext = {
  /** Local hour (0–23) when coaching is generated. */
  hour?: number;
  /** Log date for the dashboard (YYYY-MM-DD). */
  logDate?: string;
  /** Meal types logged that day (breakfast, lunch, dinner, snack, …). */
  mealTypes?: readonly string[];
  mealsCount?: number;
};

const CORE_MEAL_TYPES = ["breakfast", "lunch", "dinner"] as const;

export function dayPhaseFromHour(hour: number): DayPhase {
  if (hour < 11) return "morning";
  if (hour < 15) return "midday";
  if (hour < 17) return "afternoon";
  if (hour < 21) return "evening";
  return "late";
}

/** How much of the day's targets we'd expect to have hit by this hour (0–1). */
export function expectedDailyProgress(hour: number): number {
  if (hour < 7) return 0.12;
  if (hour < 11) return 0.12 + ((hour - 7) / 4) * 0.23;
  if (hour < 15) return 0.35 + ((hour - 11) / 4) * 0.25;
  if (hour < 17) return 0.6 + ((hour - 15) / 2) * 0.1;
  if (hour < 21) return 0.7 + ((hour - 17) / 4) * 0.25;
  return 1;
}

export function resolveCoachHour(context?: CoachDayContext): number {
  if (context?.hour != null && context.hour >= 0 && context.hour <= 23) {
    return context.hour;
  }
  return new Date().getHours();
}

export function isViewingToday(context?: CoachDayContext): boolean {
  if (!context?.logDate) return true;
  return context.logDate === todayDateKey();
}

export function hasLoggedMealType(
  mealTypes: readonly string[] | undefined,
  type: string,
): boolean {
  if (!mealTypes?.length) return false;
  const target = type.toLowerCase();
  return mealTypes.some((m) => m.toLowerCase() === target);
}

export function hasLoggedDinner(mealTypes: readonly string[] | undefined): boolean {
  return hasLoggedMealType(mealTypes, "dinner");
}

export function coreMealsLogged(mealTypes: readonly string[] | undefined): number {
  if (!mealTypes?.length) return 0;
  const set = new Set(mealTypes.map((m) => m.toLowerCase()));
  return CORE_MEAL_TYPES.filter((t) => set.has(t)).length;
}

/** After dinner or late evening — stop nudging the user to eat more today. */
export function isWrapUpMode(context?: CoachDayContext): boolean {
  const hour = resolveCoachHour(context);
  const mealTypes = context?.mealTypes;
  const phase = dayPhaseFromHour(hour);

  if (hasLoggedDinner(mealTypes) && hour >= 19) return true;
  if (phase === "late") return true;
  if (hour >= 21 && (context?.mealsCount ?? 0) >= 1) return true;
  return false;
}

export function isEarlyInDay(context?: CoachDayContext): boolean {
  const hour = resolveCoachHour(context);
  const phase = dayPhaseFromHour(hour);
  return phase === "morning" || (phase === "midday" && hour < 12);
}

function nextMealLabel(context?: CoachDayContext): string | null {
  const hour = resolveCoachHour(context);
  const mealTypes = context?.mealTypes;

  if (hasLoggedDinner(mealTypes)) return null;
  if (hour < 11 && !hasLoggedMealType(mealTypes, "breakfast")) return "breakfast";
  if (hour < 15 && !hasLoggedMealType(mealTypes, "lunch")) return "lunch";
  if (hour < 21 && !hasLoggedMealType(mealTypes, "dinner")) return "dinner";
  return null;
}

function effectiveOnTrackThreshold(context?: CoachDayContext): number {
  const expected = expectedDailyProgress(resolveCoachHour(context));
  return Math.min(0.85, Math.max(0.3, expected * 0.82));
}

function pillarBehindForNow(
  progress: number,
  context?: CoachDayContext,
): boolean {
  return progress < effectiveOnTrackThreshold(context);
}

type PillarNeed = "protein" | "fibre" | "plants" | "hydration";

function collectFoodNeeds(
  progress: CoachPillarProgress,
  gaps: { hydrationGlasses: number },
  context?: CoachDayContext,
): PillarNeed[] {
  const needs: PillarNeed[] = [];
  if (pillarBehindForNow(progress.protein, context)) needs.push("protein");
  if (pillarBehindForNow(progress.fibre, context)) needs.push("fibre");
  if (pillarBehindForNow(progress.plants, context)) needs.push("plants");
  if (
    pillarBehindForNow(progress.hydration, context) &&
    gaps.hydrationGlasses >= 1
  ) {
    needs.push("hydration");
  }
  return needs;
}

const NEED_PHRASES: Record<PillarNeed, string> = {
  protein: "protein",
  fibre: "fibre",
  plants: "plant variety",
  hydration: "hydration",
};

const TOMORROW_NEED_PHRASES: Record<Exclude<PillarNeed, "hydration">, string> = {
  protein: "protein",
  fibre: "fibre",
  plants: "plants and colour",
};

function formatNeedList(needs: PillarNeed[], forTomorrow = false): string {
  const phrases = needs.map((n) =>
    forTomorrow && n !== "hydration"
      ? TOMORROW_NEED_PHRASES[n]
      : NEED_PHRASES[n],
  );
  if (phrases.length === 1) return phrases[0]!;
  if (phrases.length === 2) return `${phrases[0]} and ${phrases[1]}`;
  return `${phrases.slice(0, -1).join(", ")}, and ${phrases[phrases.length - 1]}`;
}

function onPaceMessage(context?: CoachDayContext): string | null {
  const hour = resolveCoachHour(context);
  const phase = dayPhaseFromHour(hour);
  if (phase === "morning") return "Good start — plenty of day left to build your plate.";
  if (phase === "midday") return "You're on pace for this time of day. Keep going.";
  if (phase === "afternoon") return "Solid progress so far — dinner can round things out.";
  return "You're on pace for this time of day.";
}

export function buildPlateMessage(
  pillars: Pick<PillarProgress, "label" | "status" | "progress">[],
  hasMeals: boolean,
  context?: CoachDayContext,
): string | null {
  if (!hasMeals) {
    if (!isViewingToday(context)) return null;
    const hour = resolveCoachHour(context);
    if (hour < 11) return "Log breakfast when you're ready — your plate fills through the day.";
    if (hour < 15) return "Log a meal when you can — no need to hit targets all at once.";
    return "Log a meal to start filling your plate.";
  }

  if (!isViewingToday(context)) {
    const low = pillars.filter((p) => p.status === "low");
    if (low.length === 0) return "Balanced day across your pillars.";
    return `${low.map((p) => p.label).join(" and ")} were light this day.`;
  }

  if (isWrapUpMode(context)) {
    if (hasLoggedDinner(context?.mealTypes)) {
      return "Dinner's logged — today's plate is winding down.";
    }
    return "Day's wrapping up — focus on hydration if you can.";
  }

  const needs = collectFoodNeeds(
    {
      protein: pillars.find((p) => p.label === "Protein")?.progress ?? 0,
      fibre: pillars.find((p) => p.label === "Fibre")?.progress ?? 0,
      plants: pillars.find((p) => p.label === "Plants")?.progress ?? 0,
      hydration: 1,
    },
    { hydrationGlasses: 0 },
    context,
  ).filter((n) => n !== "hydration");

  if (needs.length === 0) {
    return onPaceMessage(context);
  }

  const nextMeal = nextMealLabel(context);
  if (nextMeal && isEarlyInDay(context)) {
    return `On pace so far — ${formatNeedList(needs)} can come with ${nextMeal}.`;
  }

  const low = pillars.filter((p) => p.status === "low");
  if (low.length === 1) {
    return `${low[0]!.label} is the main gap for now.`;
  }
  if (low.length > 1) {
    return `${low.map((p) => p.label.toLowerCase()).join(" and ")} could use attention later today.`;
  }
  return onPaceMessage(context);
}

export function buildCoachSummaryWithContext(
  gaps: { hydrationGlasses: number },
  score: number,
  progress: CoachPillarProgress,
  context?: CoachDayContext,
): string {
  const hour = resolveCoachHour(context);
  const phase = dayPhaseFromHour(hour);
  const mealsCount = context?.mealsCount ?? 0;
  const viewingToday = isViewingToday(context);

  if (!viewingToday) {
    if (score >= 85) return "A strong day when you look back at it.";
    if (score >= 70) return "Solid choices overall — patterns matter more than one score.";
    return "Every log helps your story — notice what you'd repeat or adjust.";
  }

  if (mealsCount === 0) {
    if (phase === "morning") {
      return "Good morning — log breakfast when you're ready. Targets build across the day, not all at once.";
    }
    if (phase === "midday") {
      return "Nothing logged yet — lunch is a natural place to start. No pressure to be perfect early on.";
    }
    if (phase === "afternoon" || phase === "evening") {
      return "Still time to log something today. Even one meal adds to your picture.";
    }
    return "Tomorrow is a fresh plate — rest up tonight.";
  }

  if (isWrapUpMode(context)) {
    const foodNeeds = collectFoodNeeds(progress, gaps, context).filter(
      (n) => n !== "hydration",
    );
    const hydrationLow = collectFoodNeeds(progress, gaps, context).includes("hydration");

    if (score >= 85 && foodNeeds.length === 0) {
      return hasLoggedDinner(context?.mealTypes)
        ? "Strong day — dinner's in and your plate looks great. Hydrate if you can, then call it a win."
        : "Strong day. Wind down when you're ready — tomorrow's plate is a fresh start.";
    }

    if (foodNeeds.length === 0) {
      return hydrationLow
        ? "You've wrapped up eating for today. A glass of water now would still help."
        : "Nice work logging today. Rest up — tomorrow is a fresh start.";
    }

    return `You've done well showing up today. Aim for more ${formatNeedList(foodNeeds, true)} tomorrow${
      hydrationLow ? ", and sip water if you can tonight" : ""
    }.`;
  }

  if (score >= 85) {
    if (phase === "morning" || phase === "midday") {
      return "Excellent start — you're ahead of pace for this time of day.";
    }
    return "You're doing excellently. Keep this rhythm going.";
  }

  const needs = collectFoodNeeds(progress, gaps, context);
  const foodNeeds = needs.filter((n) => n !== "hydration");
  const hydrationOnly =
    needs.length === 1 && needs[0] === "hydration";

  if (needs.length === 0 || (foodNeeds.length === 0 && !hydrationOnly)) {
    return onPaceMessage(context) ?? "You're doing well for this time of day.";
  }

  if (hydrationOnly) {
    return "Macros look on pace — a bit more water today would round things off.";
  }

  const nextMeal = nextMealLabel(context);
  const needText = formatNeedList(foodNeeds);

  if (nextMeal) {
    return `On pace for ${phase === "morning" ? "the morning" : "now"}. More ${needText} at ${nextMeal} would lift your score.`;
  }

  if (foodNeeds.length === 1) {
    return `You're doing well. More ${needText} would make today stronger.`;
  }

  return `You're doing well. More ${needText} would make today stronger.`;
}
