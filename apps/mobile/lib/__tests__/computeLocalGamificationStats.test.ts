import assert from "node:assert/strict";
import test from "node:test";
import type { GamificationStatsInput } from "@lifeplate/shared";
import {
  computeLocalGamificationExtras,
  milestoneEligibilityKey,
} from "../computeLocalGamificationStats";

const baseStats: GamificationStatsInput = {
  currentStreak: 3,
  longestStreak: 5,
  mealsLogged: 12,
  sharesSentCount: 0,
  breakfastLogDays: 2,
  mealsWithNotesCount: 4,
  hydrationGoalDaysLast7: 4,
};

test("computeLocalGamificationExtras counts breakfast days and notes from meals", () => {
  const result = computeLocalGamificationExtras(
    [
      {
        id: "1",
        mealType: "breakfast",
        mealName: "Oats",
        imageUrl: "",
        createdAt: "2026-06-20T08:00:00.000Z",
        logDate: "2026-06-20",
        sortIndex: 0,
        notes: "With berries",
      },
      {
        id: "2",
        mealType: "lunch",
        mealName: "Salad",
        imageUrl: "",
        createdAt: "2026-06-20T12:00:00.000Z",
        logDate: "2026-06-20",
        sortIndex: 1,
      },
    ],
    {},
    8,
  );

  assert.equal(result.breakfastLogDays, 1);
  assert.equal(result.mealsWithNotesCount, 1);
});

test("milestoneEligibilityKey ignores non-milestone stats", () => {
  const key = milestoneEligibilityKey(baseStats);
  assert.equal(
    milestoneEligibilityKey({
      ...baseStats,
      breakfastLogDays: 99,
      mealsWithNotesCount: 99,
    }),
    key,
  );
});

test("milestoneEligibilityKey changes when hydration goal days cross a threshold", () => {
  const before = milestoneEligibilityKey(baseStats);
  const after = milestoneEligibilityKey({
    ...baseStats,
    hydrationGoalDaysLast7: 5,
  });
  assert.notEqual(before, after);
});
