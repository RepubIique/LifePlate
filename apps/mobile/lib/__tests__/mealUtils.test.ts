import assert from "node:assert/strict";
import test from "node:test";
import type { MealListSummary } from "@lifeplate/shared";
import { dateKeyFromIso } from "@lifeplate/shared";
import {
  buildTimelineDayGroups,
  capitalize,
  countMealsThisWeek,
  mealMatchesTimelineSearch,
  mealTypeIcon,
  timelineDayMatchesSearch,
} from "../mealUtils";

function meal(
  id: string,
  createdAt: string,
  mealType = "lunch",
  sortIndex = 0,
): MealListSummary {
  return {
    id,
    mealName: `Meal ${id}`,
    mealType,
    imageUrl: "",
    createdAt,
    logDate: dateKeyFromIso(createdAt),
    sortIndex,
  };
}

function mealOnLocalDay(
  id: string,
  dateKey: string,
  hour = 12,
  sortIndex = 0,
  mealType = "lunch",
): MealListSummary {
  const [year, month, day] = dateKey.split("-").map(Number);
  return {
    ...meal(id, new Date(year, month - 1, day, hour, 0, 0, 0).toISOString(), mealType, sortIndex),
    logDate: dateKey,
  };
}

test("buildTimelineDayGroups groups meals by day and sorts newest first", () => {
  const groups = buildTimelineDayGroups(
    [
      mealOnLocalDay("1", "2026-06-10"),
      mealOnLocalDay("2", "2026-06-12", 12, 1),
      mealOnLocalDay("3", "2026-06-12", 18, 0),
    ],
    { "2026-06-11": 3 },
  );

  assert.equal(groups.length, 3);
  assert.equal(groups[0]?.dateKey, "2026-06-12");
  assert.equal(groups[0]?.meals.length, 2);
  assert.equal(groups[1]?.dateKey, "2026-06-11");
  assert.equal(groups[1]?.hydrationGlasses, 3);
  assert.equal(groups[1]?.meals.length, 0);
});

test("buildTimelineDayGroups sorts meals within a day with most recent first", () => {
  const groups = buildTimelineDayGroups(
    [
      mealOnLocalDay("breakfast", "2026-06-10", 8, 0, "breakfast"),
      mealOnLocalDay("dinner", "2026-06-10", 20, 0, "dinner"),
      mealOnLocalDay("snack", "2026-06-10", 15, 0, "snack"),
    ],
    {},
  );

  const day = groups.find((group) => group.dateKey === "2026-06-10");
  assert.ok(day);
  assert.deepEqual(
    day.meals.map((entry) => entry.id),
    ["dinner", "snack", "breakfast"],
  );
});

test("countMealsThisWeek includes recent meals only", () => {
  const now = new Date();
  const sixDaysAgo = new Date(now);
  sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);
  const eightDaysAgo = new Date(now);
  eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

  const count = countMealsThisWeek([
    meal("recent", sixDaysAgo.toISOString()),
    meal("old", eightDaysAgo.toISOString()),
  ]);
  assert.equal(count, 1);
});

test("mealTypeIcon maps known meal types", () => {
  assert.equal(mealTypeIcon("breakfast"), "weather-sunset-up");
  assert.equal(mealTypeIcon("lunch"), "white-balance-sunny");
  assert.equal(mealTypeIcon("dinner"), "weather-night");
  assert.equal(mealTypeIcon("snack"), "cookie-outline");
  assert.equal(mealTypeIcon("beverage"), "cup-outline");
  assert.equal(mealTypeIcon("unknown"), "silverware-fork-knife");
});

test("capitalize uppercases the first character", () => {
  assert.equal(capitalize("hello"), "Hello");
});

test("mealMatchesTimelineSearch matches meal name, type, notes, and shared by", () => {
  const entry: MealListSummary = {
    ...meal("1", new Date().toISOString(), "breakfast"),
    mealName: "Avocado Toast",
    notes: "With @[Sam](00000000-0000-4000-8000-000000000001)",
    sharedByName: "Jordan",
  };

  assert.equal(mealMatchesTimelineSearch(entry, "avocado"), true);
  assert.equal(mealMatchesTimelineSearch(entry, "breakfast"), true);
  assert.equal(mealMatchesTimelineSearch(entry, "sam"), true);
  assert.equal(mealMatchesTimelineSearch(entry, "jordan"), true);
  assert.equal(mealMatchesTimelineSearch(entry, "pizza"), false);
  assert.equal(mealMatchesTimelineSearch(entry, ""), true);
  assert.equal(mealMatchesTimelineSearch(entry, "   "), true);
});

test("mealMatchesTimelineSearch matches homecook and eat out meal sources", () => {
  const home: MealListSummary = {
    ...meal("1", new Date().toISOString(), "lunch"),
    mealName: "Salad",
    mealSource: "home_cooked",
  };
  const out: MealListSummary = {
    ...meal("2", new Date().toISOString(), "dinner"),
    mealName: "Burger",
    mealSource: "takeaway",
  };

  assert.equal(mealMatchesTimelineSearch(home, "homecook"), true);
  assert.equal(mealMatchesTimelineSearch(home, "home cook"), true);
  assert.equal(mealMatchesTimelineSearch(out, "eat out"), true);
  assert.equal(mealMatchesTimelineSearch(out, "eating out"), true);
  assert.equal(mealMatchesTimelineSearch(out, "takeaway"), true);
  assert.equal(mealMatchesTimelineSearch(home, "eating out"), false);
});

test("timelineDayMatchesSearch matches day labels, subtitles, and date keys", () => {
  assert.equal(
    timelineDayMatchesSearch(
      { dateKey: "2026-06-10", day: "Tuesday, Jun 10", subtitle: "Tuesday, June 10" },
      "tuesday",
    ),
    true,
  );
  assert.equal(
    timelineDayMatchesSearch(
      { dateKey: "2026-06-10", day: "Tuesday, Jun 10", subtitle: "Tuesday, June 10" },
      "june",
    ),
    true,
  );
  assert.equal(
    timelineDayMatchesSearch(
      { dateKey: "2026-06-10", day: "Tuesday, Jun 10", subtitle: "Tuesday, June 10" },
      "2026-06-10",
    ),
    true,
  );
  assert.equal(
    timelineDayMatchesSearch(
      { dateKey: "2026-06-20", day: "Today", subtitle: "Saturday, June 20" },
      "today",
    ),
    true,
  );
  assert.equal(
    timelineDayMatchesSearch(
      { dateKey: "2026-06-19", day: "Yesterday", subtitle: "Friday, June 19" },
      "yesterday",
    ),
    true,
  );
  assert.equal(
    timelineDayMatchesSearch(
      { dateKey: "2026-06-10", day: "Tuesday, Jun 10", subtitle: "Tuesday, June 10" },
      "wednesday",
    ),
    false,
  );
});
