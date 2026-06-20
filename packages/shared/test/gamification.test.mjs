import assert from "node:assert/strict";
import test from "node:test";
import {
  areCorePlatesComplete,
  computeTogetherStreakFromDayKeys,
  computeUnlockedBadges,
} from "../dist/gamification.js";
import { todayDateKey, offsetLogDateKey } from "../dist/logDate.js";

function dayOffset(days) {
  return offsetLogDateKey(todayDateKey(), days);
}

test("computeTogetherStreakFromDayKeys requires both friends to log same day", () => {
  const userDays = [dayOffset(-2), dayOffset(-1), dayOffset(0)];
  const friendDays = [dayOffset(-1), dayOffset(0)];
  assert.equal(computeTogetherStreakFromDayKeys(userDays, friendDays), 2);
});

test("areCorePlatesComplete needs breakfast lunch dinner", () => {
  assert.equal(areCorePlatesComplete(new Set(["breakfast", "lunch"])), false);
  assert.equal(areCorePlatesComplete(new Set(["breakfast", "lunch", "dinner"])), true);
});

test("computeUnlockedBadges unlocks week strong at 7-day streak", () => {
  const badges = computeUnlockedBadges({
    currentStreak: 7,
    longestStreak: 7,
    mealsLogged: 10,
    sharesSentCount: 0,
    breakfastLogDays: 0,
    mealsWithNotesCount: 0,
    hydrationGoalDaysLast7: 0,
  });
  assert.ok(badges.includes("consistent_7"));
  assert.ok(badges.includes("meals_10"));
});
