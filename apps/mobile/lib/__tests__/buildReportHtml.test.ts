import assert from "node:assert/strict";
import test from "node:test";
import type { HydrationDayRecord, MealListItem, UserProfile } from "@lifeplate/shared";
import {
  buildReportHtml,
  PDF_SECTION_MARKERS,
} from "../pdf/buildReportHtml";
import { assembleReportData } from "../pdf/assembleReportData";
import type { ReportSourceBundle } from "../pdf/reportSourceCache";
import { resolveReportWindow } from "../pdf/reportWindows";

const REPORT_NOW = new Date("2026-06-21T12:00:00.000Z");
const REPORT_DAY = "2026-06-21";

function mockProfile(): UserProfile {
  return {
    id: "user-1",
    email: "test@example.com",
    name: "Alex",
    goal: "Better health",
    hasAvatar: false,
    weightKg: 70,
    heightCm: 175,
    age: 30,
    gender: "female",
    nutritionTargets: {
      dailyFibreG: 30,
      dailyCalories: 2000,
      dailyProteinG: 90,
      dailyPlantServes: 5,
      dailyHydrationGlasses: 8,
    },
    mealsLogged: 42,
    currentStreak: 5,
    longestStreak: 12,
    isPaid: false,
    createdAt: "2026-06-01T00:00:00.000Z",
    loggingLocked: false,
    freeLoggingDaysRemaining: 3,
  };
}

function mockMeal(id: string, logDate: string, overrides: Partial<MealListItem> = {}): MealListItem {
  return {
    id,
    mealType: "lunch",
    mealName: "Salmon bowl",
    imageUrl: "",
    createdAt: `${logDate}T12:00:00.000Z`,
    logDate,
    sortIndex: 0,
    calories: 520,
    protein: 38,
    carbs: 45,
    fat: 18,
    fibre: 8,
    sugar: 6,
    sodium: 400,
    confidence: 0.9,
    foods: ["salmon", "rice"],
    mealSource: "home_cooked",
    notes: null,
    ...overrides,
  };
}

function mockSource(): ReportSourceBundle {
  const window = resolveReportWindow("this_week", undefined, REPORT_NOW);
  const meals = [mockMeal("meal-1", REPORT_DAY, { notes: "Felt great" })];
  const hydration: HydrationDayRecord[] = [{ date: REPORT_DAY, glasses: 6 }];
  return {
    userId: "user-1",
    allMeals: meals,
    hydrationDays: hydration,
    coachInsight: "Your plant diversity is improving.",
    fetchedAt: Date.now(),
  };
}

function baseReport(overrides: Parameters<typeof assembleReportData>[2] & { fullReport?: boolean } = {}) {
  const profile = mockProfile();
  const source = mockSource();
  const { fullReport, ...options } = overrides;
  return assembleReportData(profile, source, { ...options, fullReport: fullReport ?? false, now: REPORT_NOW });
}

test("buildReportHtml free snapshot includes sparkline and Plus CTA", () => {
  const html = buildReportHtml(baseReport({ fullReport: false }));

  assert.match(html, /Trend Snapshot/);
  assert.match(html, new RegExp(PDF_SECTION_MARKERS.sparkline));
  assert.match(html, new RegExp(PDF_SECTION_MARKERS.freeFooterCta));
  assert.doesNotMatch(html, new RegExp(PDF_SECTION_MARKERS.comparison));
  assert.doesNotMatch(html, new RegExp(PDF_SECTION_MARKERS.mealLog));
});

test("buildReportHtml full report includes expanded sections", () => {
  const html = buildReportHtml(baseReport({ fullReport: true }));

  assert.match(html, /Full Trend Report/);
  assert.match(html, new RegExp(PDF_SECTION_MARKERS.comparison));
  assert.match(html, new RegExp(PDF_SECTION_MARKERS.patterns));
  assert.match(html, new RegExp(PDF_SECTION_MARKERS.macroAverages));
  assert.match(html, new RegExp(PDF_SECTION_MARKERS.hydration));
  assert.match(html, new RegExp(PDF_SECTION_MARKERS.mealLog));
  assert.match(html, /Felt great/);
  assert.doesNotMatch(html, new RegExp(PDF_SECTION_MARKERS.freeFooterCta));
});

test("buildReportHtml clinical template includes cover disclaimer", () => {
  const html = buildReportHtml(
    baseReport({ fullReport: true, template: "clinical" }),
  );

  assert.match(html, new RegExp(PDF_SECTION_MARKERS.clinical));
  assert.match(html, /Not medical advice/);
});

test("buildReportHtml eat-out template highlights audit section", () => {
  const profile = mockProfile();
  const source: ReportSourceBundle = {
    ...mockSource(),
    allMeals: [
      mockMeal("t1", REPORT_DAY, { mealSource: "takeaway", mealName: "Burger" }),
    ],
  };
  const html = buildReportHtml(
    assembleReportData(profile, source, { fullReport: true, template: "eat_out", now: REPORT_NOW }),
  );

  assert.match(html, new RegExp(PDF_SECTION_MARKERS.eatOut));
  assert.match(html, /Burger/);
});

test("buildReportHtml escapes user-provided strings", () => {
  const profile = { ...mockProfile(), name: "<script>alert(1)</script>" };
  const source = { ...mockSource(), coachInsight: "Tom & Jerry's <best> week" };
  const html = buildReportHtml(assembleReportData(profile, source));

  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /Tom &amp; Jerry's &lt;best&gt; week/);
});

test("assembleReportData is pure given a cached source bundle", () => {
  const profile = mockProfile();
  const source = mockSource();
  const trend = assembleReportData(profile, source, { template: "trend", now: REPORT_NOW });
  const gut = assembleReportData(profile, source, { template: "gut_health", now: REPORT_NOW });

  assert.notEqual(trend.template, gut.template);
  assert.equal(trend.metrics.comparison.current.score, gut.metrics.comparison.current.score);
});
