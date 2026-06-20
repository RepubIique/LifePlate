import assert from "node:assert/strict";
import test from "node:test";
import { computeLocalGamificationExtras } from "../computeLocalGamificationStats";

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
