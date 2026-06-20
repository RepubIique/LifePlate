import type { GamificationStatsInput, MealListSummary, UserProfile } from "@lifeplate/shared";
import type { GamificationServerStatsResponse } from "@lifeplate/shared";
import { mealLogDateKey, offsetLogDateKey, todayDateKey } from "@lifeplate/shared";

export function computeLocalGamificationExtras(
  meals: MealListSummary[],
  hydrationByDate: Record<string, number>,
  hydrationTarget: number,
): Pick<
  GamificationStatsInput,
  "breakfastLogDays" | "mealsWithNotesCount" | "hydrationGoalDaysLast7"
> {
  const breakfastDays = new Set(
    meals.filter((m) => m.mealType === "breakfast").map((m) => mealLogDateKey(m)),
  ).size;
  const mealsWithNotesCount = meals.filter((m) => m.notes?.trim()).length;

  let hydrationGoalDaysLast7 = 0;
  for (let i = 0; i < 7; i++) {
    const key = offsetLogDateKey(todayDateKey(), -i);
    if ((hydrationByDate[key] ?? 0) >= hydrationTarget) {
      hydrationGoalDaysLast7++;
    }
  }

  return { breakfastLogDays: breakfastDays, mealsWithNotesCount, hydrationGoalDaysLast7 };
}

export function buildGamificationStatsInput(
  profile: UserProfile,
  meals: MealListSummary[],
  hydrationByDate: Record<string, number>,
  hydrationTarget: number,
  serverStats: GamificationServerStatsResponse | null,
): GamificationStatsInput {
  const local = computeLocalGamificationExtras(meals, hydrationByDate, hydrationTarget);
  return {
    currentStreak: profile.currentStreak,
    longestStreak: profile.longestStreak,
    mealsLogged: profile.mealsLogged,
    sharesSentCount: serverStats?.sharesSentCount ?? 0,
    ...local,
  };
}

export const SERVER_MILESTONE_IDS = new Set(["first_share"]);

export function milestoneNeedsServerStats(id: string): boolean {
  return SERVER_MILESTONE_IDS.has(id);
}

export function mightNeedHydrationMilestone(hydrationGoalDaysLast7: number): boolean {
  return hydrationGoalDaysLast7 >= 5;
}
