import { computeStreaksFromDayKeys } from "./streaks.js";

/** Core meal slots — breakfast, lunch, dinner (snack optional). */
export const CORE_MEAL_SLOT_KEYS = ["breakfast", "lunch", "dinner"] as const;
export type CoreMealSlotKey = (typeof CORE_MEAL_SLOT_KEYS)[number];

export const STREAK_MILESTONE_DAYS = [3, 7, 14, 30] as const;
export const MEALS_MILESTONE_COUNTS = [10, 50, 100] as const;

export type StreakMilestoneDay = (typeof STREAK_MILESTONE_DAYS)[number];
export type MealsMilestoneCount = (typeof MEALS_MILESTONE_COUNTS)[number];

export type MilestoneId =
  | `streak_${StreakMilestoneDay}`
  | `meals_${MealsMilestoneCount}`
  | "first_share"
  | "hydration_week";

export type BadgeId =
  | "consistent_7"
  | "consistent_30"
  | "meals_10"
  | "early_bird"
  | "hydrated"
  | "storyteller"
  | "sharing_caring";

export type CoopChallengeType = "hydration_5_of_7";

export type CoopChallengeStatus = "pending" | "active" | "completed" | "expired" | "declined";

export interface CoopChallengeParticipantProgress {
  userId: string;
  name: string | null;
  daysCompleted: number;
  daysRequired: number;
}

export interface CoopChallengeSummary {
  id: string;
  friendId: string;
  friendName: string | null;
  challengeType: CoopChallengeType;
  status: CoopChallengeStatus;
  weekStart: string;
  invitedByUserId: string;
  isInviter: boolean;
  participants: CoopChallengeParticipantProgress[];
}

export interface CoopChallengeInviteRequest {
  friendId: string;
  challengeType: CoopChallengeType;
}

export interface GamificationServerStatsResponse {
  sharesSentCount: number;
}

export interface GamificationBundleResponse {
  stats: GamificationServerStatsResponse;
  challenges: CoopChallengeSummary[];
}

export interface BadgeDefinition {
  id: BadgeId;
  title: string;
  description: string;
  icon: string;
}

export interface MilestoneDefinition {
  id: MilestoneId;
  message: string;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: "consistent_7",
    title: "Week Strong",
    description: "Log meals 7 days in a row",
    icon: "fire",
  },
  {
    id: "consistent_30",
    title: "Steady Habit",
    description: "Reach a 30-day best streak",
    icon: "trophy-outline",
  },
  {
    id: "meals_10",
    title: "Getting Started",
    description: "Log 10 meals",
    icon: "silverware-fork-knife",
  },
  {
    id: "early_bird",
    title: "Early Bird",
    description: "Log breakfast on 5 different days",
    icon: "weather-sunset-up",
  },
  {
    id: "hydrated",
    title: "Hydrated",
    description: "Hit your water goal 7 days in a row",
    icon: "cup-water",
  },
  {
    id: "storyteller",
    title: "Storyteller",
    description: "Add notes to 10 meals",
    icon: "notebook-outline",
  },
  {
    id: "sharing_caring",
    title: "Table for Two",
    description: "Share a meal with a friend",
    icon: "account-heart-outline",
  },
];

export const MILESTONE_DEFINITIONS: MilestoneDefinition[] = [
  { id: "streak_3", message: "3 days in a row. Nice consistency." },
  { id: "streak_7", message: "A full week of logging. Well done." },
  { id: "streak_14", message: "Two weeks strong. You're building a habit." },
  { id: "streak_30", message: "30 days. That's real consistency." },
  { id: "meals_10", message: "10 meals logged. Your story is taking shape." },
  { id: "meals_50", message: "50 meals logged. Keep going." },
  { id: "meals_100", message: "100 meals logged. What a journey." },
  { id: "first_share", message: "First meal shared with a friend." },
  { id: "hydration_week", message: "Hydration on track 5 of 7 days this week." },
];

/** Both friends must log on the same day for it to count (strict co-op rule). */
export function computeTogetherStreakFromDayKeys(
  userDayKeys: string[],
  friendDayKeys: string[],
): number {
  const friendSet = new Set(friendDayKeys);
  const togetherDays = userDayKeys.filter((day) => friendSet.has(day));
  return computeStreaksFromDayKeys(togetherDays).current;
}

export function areCorePlatesComplete(filledSlotKeys: Iterable<string>): boolean {
  const filled = new Set(filledSlotKeys);
  return CORE_MEAL_SLOT_KEYS.every((key) => filled.has(key));
}

export function milestoneMessage(id: MilestoneId): string {
  return MILESTONE_DEFINITIONS.find((m) => m.id === id)?.message ?? "Nice work.";
}

export type GamificationStatsInput = {
  currentStreak: number;
  longestStreak: number;
  mealsLogged: number;
  sharesSentCount: number;
  breakfastLogDays: number;
  mealsWithNotesCount: number;
  hydrationGoalDaysLast7: number;
};

export function computeUnlockedBadges(stats: GamificationStatsInput): BadgeId[] {
  const unlocked: BadgeId[] = [];
  if (stats.currentStreak >= 7 || stats.longestStreak >= 7) unlocked.push("consistent_7");
  if (stats.longestStreak >= 30) unlocked.push("consistent_30");
  if (stats.mealsLogged >= 10) unlocked.push("meals_10");
  if (stats.breakfastLogDays >= 5) unlocked.push("early_bird");
  if (stats.hydrationGoalDaysLast7 >= 7) unlocked.push("hydrated");
  if (stats.mealsWithNotesCount >= 10) unlocked.push("storyteller");
  if (stats.sharesSentCount >= 1) unlocked.push("sharing_caring");
  return unlocked;
}

export function computeEligibleMilestones(stats: GamificationStatsInput): MilestoneId[] {
  const eligible: MilestoneId[] = [];
  for (const days of STREAK_MILESTONE_DAYS) {
    if (stats.currentStreak >= days) eligible.push(`streak_${days}`);
  }
  for (const count of MEALS_MILESTONE_COUNTS) {
    if (stats.mealsLogged >= count) eligible.push(`meals_${count}`);
  }
  if (stats.sharesSentCount >= 1) eligible.push("first_share");
  if (stats.hydrationGoalDaysLast7 >= 5) eligible.push("hydration_week");
  return eligible;
}
