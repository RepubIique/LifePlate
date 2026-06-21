import type { MealListItem, PeriodComparison, ScoreStatus, TrendStatus } from "@lifeplate/shared";
import {
  buildComparisonSummary,
  formatLogDateLabel,
  formatScoreDelta,
  mealLogDateKey,
  pillarDelta,
  scoreDelta,
  scoreStatus,
} from "@lifeplate/shared";
import { PILLAR_COLORS, type PillarKey } from "@/lib/pillarTheme";
import type { ReportTemplateId } from "./reportTemplates";
import { enumerateWindowDays } from "./reportWindows";
import { REPORT_CSS } from "./reportTheme";
import type { PdfReportData } from "./types";

const COMPARISON_PILLARS = [
  { key: "protein" as const, label: "Protein" },
  { key: "fibre" as const, label: "Fibre" },
  { key: "plants" as const, label: "Plants" },
  { key: "carbs" as const, label: "Carbs" },
  { key: "fat" as const, label: "Fats" },
  { key: "hydration" as const, label: "Hydration" },
];

const PILLAR_BAR_KEYS: Array<{ key: PillarKey; label: string }> = [
  { key: "protein", label: "Protein" },
  { key: "fibre", label: "Fibre" },
  { key: "plants", label: "Plants" },
  { key: "carbs", label: "Carbs" },
  { key: "hydration", label: "Hydration" },
];

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function capitalize(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function scoreStatusLabel(status: ScoreStatus): string {
  if (status === "excellent") return "Excellent";
  if (status === "good") return "Good";
  return "Needs work";
}

function trendStatusLabel(status: TrendStatus): string {
  if (status === "on_track") return "On track";
  if (status === "moderate") return "Moderate";
  return "Needs improvement";
}

function deltaClass(delta: number): string {
  if (delta > 0) return "delta-positive";
  if (delta < 0) return "delta-negative";
  return "delta-neutral";
}

function statValueClass(delta: number): string {
  if (delta > 0) return "positive";
  if (delta < 0) return "negative";
  return "neutral";
}

function templateTitle(template: ReportTemplateId, fullReport: boolean): string {
  if (template === "clinical") return fullReport ? "Clinical Handoff Report" : "Clinical Snapshot";
  if (template === "gut_health") return fullReport ? "Gut Health Report" : "Gut Health Snapshot";
  if (template === "protein") return fullReport ? "Protein & Muscle Report" : "Protein Snapshot";
  if (template === "eat_out") return fullReport ? "Eat-Out Audit Report" : "Eat-Out Snapshot";
  return fullReport ? "Full Trend Report" : "Trend Snapshot";
}

function renderHeader(data: PdfReportData): string {
  const name = data.profile.name?.trim() || "LifePlate member";
  const exported = new Date(data.exportedAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return `
    <div class="header">
      <div>
        <div class="brand">LifePlate</div>
        <div class="brand-sub">${escapeHtml(templateTitle(data.template, data.fullReport))}</div>
      </div>
      <div class="meta">
        <strong>${escapeHtml(name)}</strong>
        ${escapeHtml(data.window.label)}<br />
        Exported ${escapeHtml(exported)}
      </div>
    </div>
  `;
}

function renderClinicalCover(data: PdfReportData): string {
  const age = data.profile.age != null ? `${data.profile.age}` : "—";
  const goal = data.profile.goal?.trim() || "—";
  const summary = buildComparisonSummary(data.metrics.comparison);

  return `
    <div class="page clinical-cover">
      <div class="clinical-badge">Nutrition summary · Not medical advice</div>
      <h1 class="clinical-title">LifePlate Nutrition Report</h1>
      <div class="clinical-grid">
        <div><span class="clinical-label">Name</span><br />${escapeHtml(data.profile.name?.trim() || "—")}</div>
        <div><span class="clinical-label">Age</span><br />${escapeHtml(age)}</div>
        <div><span class="clinical-label">Goal</span><br />${escapeHtml(goal)}</div>
        <div><span class="clinical-label">Period</span><br />${escapeHtml(data.window.label)}</div>
      </div>
      <div class="clinical-summary">
        <div class="section-label">Summary</div>
        <p>${escapeHtml(summary)}</p>
      </div>
      <p class="clinical-disclaimer">
        Meal macros and portions are AI-estimated from photos and descriptions. This report supports
        awareness and conversation — it is not a diagnosis, prescription, or substitute for professional care.
      </p>
      <p class="clinical-future-note">
        Weight, symptom, and blood test tracking will appear here when available in LifePlate.
      </p>
    </div>
  `;
}

function renderSparkline(data: PdfReportData): string {
  const points = data.metrics.dailyScores;
  if (points.length === 0) return "";

  const maxScore = Math.max(...points.map((p) => p.score), 1);
  const bars = points
    .map((point) => {
      const height = point.hasData ? Math.max(8, Math.round((point.score / maxScore) * 100)) : 4;
      const label = point.dateKey.slice(5);
      return `
        <div class="spark-bar-wrap" title="${escapeHtml(point.dateKey)}: ${point.score}">
          <div class="spark-bar ${point.hasData ? "" : "spark-bar-empty"}" style="height:${height}%"></div>
          <div class="spark-label">${escapeHtml(label)}</div>
        </div>
      `;
    })
    .join("");

  return `
    <div class="section-label">Daily nutrition score</div>
    <div class="sparkline">${bars}</div>
  `;
}

function renderHero(data: PdfReportData): string {
  const comparison = data.metrics.comparison;
  const score = comparison.current.score;
  const status = scoreStatus(score);
  const delta = scoreDelta(comparison);
  const insights = data.metrics.windowInsights;

  return `
    <div class="section-label">Period average</div>
    <div class="hero">
      <div class="hero-score">${score}</div>
      <div class="hero-label">${escapeHtml(data.window.currentLabel)}</div>
      <span class="badge badge-${status}">${escapeHtml(scoreStatusLabel(status))}</span>
      <div class="score-compare">
        <div class="score-col">
          <div class="score-col-label">${escapeHtml(comparison.currentLabel)}</div>
          <div class="score-col-value">${comparison.current.score}</div>
        </div>
        <div class="score-col">
          <div class="score-col-label">${escapeHtml(comparison.previousLabel)}</div>
          <div class="score-col-value muted">${comparison.previous.score}</div>
        </div>
      </div>
    </div>
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-card-label">Score change</div>
        <div class="stat-card-value ${statValueClass(delta)}">${formatScoreDelta(delta)} pts</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-label">Meals logged</div>
        <div class="stat-card-value">${insights.mealsLogged}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-label">Protein average</div>
        <div class="stat-card-value">${insights.proteinAverage}g/day</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-label">Home cooked / Eat out</div>
        <div class="stat-card-value">${insights.homeCookedPercent}% / ${insights.takeawayPercent}%</div>
      </div>
    </div>
  `;
}

function renderMacroAverages(data: PdfReportData): string {
  const m = data.metrics.macroAverages;
  if (m.daysWithMeals === 0) return "";

  return `
    <div class="section-label">Daily macro averages</div>
    <div class="stat-grid">
      <div class="stat-card"><div class="stat-card-label">Calories</div><div class="stat-card-value">${m.calories}</div></div>
      <div class="stat-card"><div class="stat-card-label">Protein</div><div class="stat-card-value">${m.protein}g</div></div>
      <div class="stat-card"><div class="stat-card-label">Carbs</div><div class="stat-card-value">${m.carbs}g</div></div>
      <div class="stat-card"><div class="stat-card-label">Fat</div><div class="stat-card-value">${m.fat}g</div></div>
      <div class="stat-card"><div class="stat-card-label">Fibre</div><div class="stat-card-value">${m.fibre}g</div></div>
      <div class="stat-card"><div class="stat-card-label">Days with meals</div><div class="stat-card-value">${m.daysWithMeals}</div></div>
    </div>
  `;
}

function renderInsight(data: PdfReportData): string {
  return `
    <div class="section-label">Coach insight</div>
    <div class="insight-box">
      <p class="insight-text">${escapeHtml(data.coachInsight)}</p>
    </div>
  `;
}

function renderFooter(data: PdfReportData): string {
  if (data.fullReport) {
    return `<div class="footer">Generated by LifePlate · ${escapeHtml(data.window.label)}</div>`;
  }
  return `
    <div class="footer">
      Generated by LifePlate · ${escapeHtml(data.window.label)}
      <div class="footer-cta">Unlock full breakdown with LifePlate Plus</div>
    </div>
  `;
}

function renderComparisonTable(comparison: PeriodComparison): string {
  const rows = COMPARISON_PILLARS.map(({ key, label }) => {
    const current = comparison.current.pillars[key];
    const previous = comparison.previous.pillars[key];
    const delta = pillarDelta(comparison.current.pillars, comparison.previous.pillars, key);
    return `
      <tr>
        <td>${escapeHtml(label)}</td>
        <td class="num">${current}%</td>
        <td class="num">${previous}%</td>
        <td class="num ${deltaClass(delta)}">${formatScoreDelta(delta)}</td>
      </tr>
    `;
  }).join("");

  return `
    <div class="section-label">Period comparison</div>
    <table class="comparison-table">
      <thead>
        <tr>
          <th>Pillar</th>
          <th class="num">${escapeHtml(comparison.currentLabel)}</th>
          <th class="num">${escapeHtml(comparison.previousLabel)}</th>
          <th class="num">Change</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderTrends(data: PdfReportData): string {
  const trends = data.metrics.trends;
  if (trends.length === 0) return "";

  const rows = trends
    .map(
      (trend) => `
      <div class="trend-row">
        <span>${escapeHtml(trend.label)}</span>
        <span class="trend-badge trend-${trend.status}">${escapeHtml(trendStatusLabel(trend.status))}</span>
      </div>
    `,
    )
    .join("");

  return `<div class="section-label">Trends</div><div class="trend-list">${rows}</div>`;
}

function renderPatterns(data: PdfReportData): string {
  const p = data.metrics.patterns;
  return `
    <div class="section-label">Patterns to watch</div>
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-card-label">Processed meals</div>
        <div class="stat-card-value">${p.processedPercent}%</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-label">Omega-3 days</div>
        <div class="stat-card-value">${p.omega3Days} / ${p.daysWithMeals || "—"}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-label">Muscle support</div>
        <div class="stat-card-value">${escapeHtml(trendStatusLabel(p.muscleSupport))}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-label">Omega-3 intake</div>
        <div class="stat-card-value">${escapeHtml(trendStatusLabel(p.omega3Intake))}</div>
      </div>
    </div>
  `;
}

function pillarProgress(data: PdfReportData, key: PillarKey): number {
  const pillars = data.metrics.comparison.current.pillars;
  if (key === "protein") return pillars.protein;
  if (key === "fibre") return pillars.fibre;
  if (key === "plants") return pillars.plants;
  if (key === "carbs") return pillars.carbs;
  return pillars.hydration;
}

function renderPillarBreakdown(data: PdfReportData): string {
  const rows = PILLAR_BAR_KEYS.map(({ key, label }) => {
    const pct = Math.min(100, Math.max(0, pillarProgress(data, key)));
    const color = PILLAR_COLORS[key];
    return `
      <div class="pillar-row">
        <div class="pillar-header">
          <span class="pillar-label">${escapeHtml(label)}</span>
          <span>${pct}%</span>
        </div>
        <div class="pillar-bar-track">
          <div class="pillar-bar-fill" style="width:${pct}%;background:${color}"></div>
        </div>
      </div>
    `;
  }).join("");

  return `<div class="section-label">Pillar breakdown</div>${rows}`;
}

function renderGutHealth(data: PdfReportData): string {
  const gut = data.metrics.gutHealth;
  const fermented = gut.fermentedFoods.slice(0, 8).map(escapeHtml).join(", ") || "—";
  const prebiotic = gut.prebioticFoods.slice(0, 8).map(escapeHtml).join(", ") || "—";

  return `
    <div class="section-label">Gut health</div>
    <div class="stat-grid">
      <div class="stat-card"><div class="stat-card-label">Gut score</div><div class="stat-card-value">${gut.score}/10</div></div>
      <div class="stat-card"><div class="stat-card-label">Fermented foods</div><div class="stat-card-value">${gut.fermentedFoods.length}</div></div>
      <div class="stat-card"><div class="stat-card-label">Prebiotic foods</div><div class="stat-card-value">${gut.prebioticFoods.length}</div></div>
      <div class="stat-card"><div class="stat-card-label">Status</div><div class="stat-card-value">${escapeHtml(trendStatusLabel(gut.status === "good" ? "on_track" : gut.status === "moderate" ? "moderate" : "needs_improvement"))}</div></div>
    </div>
    <div class="food-list"><strong>Fermented:</strong> ${fermented}</div>
    <div class="food-list"><strong>Prebiotic:</strong> ${prebiotic}</div>
  `;
}

function renderEnergyBalance(data: PdfReportData): string {
  const { carbs, fats } = data.metrics.energyBalance;
  return `
    <div class="section-label">Energy balance</div>
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-card-label">${escapeHtml(carbs.label)}</div>
        <div class="stat-card-value">${carbs.grams}g</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-label">${escapeHtml(fats.label)}</div>
        <div class="stat-card-value">${fats.grams}g</div>
      </div>
    </div>
  `;
}

function renderRecommendations(data: PdfReportData): string {
  const items = data.metrics.recommendations.items.slice(0, 3);
  if (items.length === 0) return "";
  const rows = items.map((item) => `<div class="recommendation-item">${escapeHtml(item.name)}</div>`).join("");
  return `<div class="section-label">Recommendations</div><div class="recommendations">${rows}</div>`;
}

function renderHydrationAppendix(data: PdfReportData): string {
  if (data.hydrationDays.length === 0) {
    return `
      <div class="section-label">Hydration</div>
      <div class="insight-box"><p class="insight-text">No hydration logged in this period.</p></div>
    `;
  }

  const target = data.profile.nutritionTargets?.dailyHydrationGlasses ?? 8;
  const rows = data.hydrationDays
    .map(
      (day) => `
      <tr>
        <td>${escapeHtml(formatLogDateLabel(day.date))}</td>
        <td class="num">${day.glasses}</td>
        <td class="num">${target}</td>
      </tr>
    `,
    )
    .join("");

  return `
    <div class="section-label">Hydration log</div>
    <table class="comparison-table">
      <thead><tr><th>Day</th><th class="num">Glasses</th><th class="num">Target</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function mealSourceLabel(meal: MealListItem): string {
  if (meal.mealSource === "home_cooked") return "Home";
  if (meal.mealSource === "takeaway") return "Eat out";
  return "—";
}

function mealPhotoCell(meal: MealListItem): string {
  const url = meal.imageUrl?.trim();
  if (!url || !url.startsWith("https://")) return "";
  return `<img class="meal-thumb" src="${escapeHtml(url)}" alt="" />`;
}

function renderMealRows(meals: MealListItem[], showPhotos: boolean): string {
  return meals
    .map((meal) => {
      const notes = meal.notes?.trim();
      const noteHtml = notes ? `<div class="meal-note">${escapeHtml(notes)}</div>` : "";
      const photo = showPhotos ? mealPhotoCell(meal) : "";
      return `
        <tr>
          <td>${photo}${escapeHtml(capitalize(meal.mealType ?? "meal"))}</td>
          <td>${escapeHtml(meal.mealName)}${noteHtml}</td>
          <td>${meal.calories ?? "—"}</td>
          <td>${meal.protein ?? "—"}g</td>
          <td>${escapeHtml(mealSourceLabel(meal))}</td>
        </tr>
      `;
    })
    .join("");
}

function renderMealLog(data: PdfReportData, filter?: (meal: MealListItem) => boolean): string {
  const meals = filter ? data.meals.filter(filter) : data.meals;
  if (meals.length === 0) {
    return `
      <div class="section-label">Meal log</div>
      <div class="insight-box"><p class="insight-text">No meals logged in this period.</p></div>
    `;
  }

  const mealsByDay = new Map<string, MealListItem[]>();
  for (const meal of meals) {
    const key = mealLogDateKey(meal);
    const list = mealsByDay.get(key) ?? [];
    list.push(meal);
    mealsByDay.set(key, list);
  }

  const daySections = enumerateWindowDays(data.window)
    .filter((day) => mealsByDay.has(day))
    .map((day) => {
      const dayMeals = mealsByDay.get(day) ?? [];
      return `
        <div class="meal-day">
          <div class="meal-day-label">${escapeHtml(formatLogDateLabel(day))}</div>
          <table class="meal-table">
            <thead><tr><th>Type</th><th>Meal</th><th>Cal</th><th>Protein</th><th>Source</th></tr></thead>
            <tbody>${renderMealRows(dayMeals, data.fullReport)}</tbody>
          </table>
        </div>
      `;
    })
    .join("");

  return `<div class="section-label">Meal log</div>${daySections}`;
}

function renderEatOutSection(data: PdfReportData): string {
  const eatOut = data.meals.filter((m) => m.mealSource === "takeaway");
  const insights = data.metrics.windowInsights;
  return `
    <div class="section-label">Eat-out audit</div>
    <div class="stat-grid">
      <div class="stat-card"><div class="stat-card-label">Eat out</div><div class="stat-card-value">${insights.takeawayPercent}%</div></div>
      <div class="stat-card"><div class="stat-card-label">Home cooked</div><div class="stat-card-value">${insights.homeCookedPercent}%</div></div>
      <div class="stat-card"><div class="stat-card-label">Takeaway meals</div><div class="stat-card-value">${eatOut.length}</div></div>
    </div>
    ${renderMealLog(data, (m) => m.mealSource === "takeaway")}
  `;
}

function renderHighProteinMeals(data: PdfReportData): string {
  const threshold = data.profile.nutritionTargets?.dailyProteinG
    ? Math.round(data.profile.nutritionTargets.dailyProteinG / 3)
    : 25;
  return renderMealLog(data, (m) => (m.protein ?? 0) >= threshold);
}

function renderProfileContext(data: PdfReportData): string {
  const targets = data.profile.nutritionTargets;
  const goal = data.profile.goal?.trim() || "—";
  return `
    <div class="section-label">Your profile</div>
    <div class="profile-grid">
      <div class="profile-item"><div class="profile-item-label">Goal</div><div class="profile-item-value">${escapeHtml(goal)}</div></div>
      <div class="profile-item"><div class="profile-item-label">Current streak</div><div class="profile-item-value">${data.profile.currentStreak} days</div></div>
      <div class="profile-item"><div class="profile-item-label">Best streak</div><div class="profile-item-value">${data.profile.longestStreak} days</div></div>
      <div class="profile-item"><div class="profile-item-label">Daily protein target</div><div class="profile-item-value">${targets?.dailyProteinG ?? "—"}g</div></div>
    </div>
  `;
}

function renderFreePage(data: PdfReportData): string {
  const clinical = data.template === "clinical" ? renderClinicalCover(data) : "";
  return `
    ${clinical}
    <div class="page">
      ${renderHeader(data)}
      ${renderHero(data)}
      ${renderSparkline(data)}
      ${renderInsight(data)}
      ${renderFooter(data)}
    </div>
  `;
}

function renderPlusBody(data: PdfReportData): string {
  const t = data.template;
  const clinical = t === "clinical" ? renderClinicalCover(data) : "";

  if (t === "gut_health") {
    return `
      ${clinical}
      <div class="page">${renderHeader(data)}${renderGutHealth(data)}${renderSparkline(data)}${renderPillarBreakdown(data)}${renderTrends(data)}</div>
      <div class="page">${renderHeader(data)}${renderMacroAverages(data)}${renderRecommendations(data)}${renderMealLog(data)}${renderFooter(data)}</div>
    `;
  }

  if (t === "protein") {
    return `
      ${clinical}
      <div class="page">${renderHeader(data)}${renderHero(data)}${renderPillarBreakdown(data)}${renderTrends(data)}${renderMacroAverages(data)}</div>
      <div class="page">${renderHeader(data)}${renderHighProteinMeals(data)}${renderRecommendations(data)}${renderProfileContext(data)}${renderFooter(data)}</div>
    `;
  }

  if (t === "eat_out") {
    return `
      ${clinical}
      <div class="page">${renderHeader(data)}${renderEatOutSection(data)}${renderSparkline(data)}${renderInsight(data)}</div>
      <div class="page">${renderHeader(data)}${renderComparisonTable(data.metrics.comparison)}${renderMealLog(data)}${renderFooter(data)}</div>
    `;
  }

  return `
    ${clinical}
    <div class="page">
      ${renderHeader(data)}
      ${renderHero(data)}
      ${renderSparkline(data)}
      ${renderInsight(data)}
      ${renderComparisonTable(data.metrics.comparison)}
      ${renderTrends(data)}
    </div>
    <div class="page">
      ${renderHeader(data)}
      ${renderPillarBreakdown(data)}
      ${renderGutHealth(data)}
      ${renderPatterns(data)}
      ${renderMacroAverages(data)}
      ${renderEnergyBalance(data)}
      ${renderRecommendations(data)}
      ${renderProfileContext(data)}
    </div>
    <div class="page">
      ${renderHeader(data)}
      ${renderHydrationAppendix(data)}
      ${renderMealLog(data)}
      ${renderFooter(data)}
    </div>
  `;
}

export function buildReportHtml(data: PdfReportData): string {
  const body = data.fullReport ? renderPlusBody(data) : renderFreePage(data);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>LifePlate Trend Report</title>
  <style>${REPORT_CSS}</style>
</head>
<body>${body}</body>
</html>`;
}

export const PDF_SECTION_MARKERS = {
  freeFooterCta: "Unlock full breakdown with LifePlate Plus",
  comparison: "Period comparison",
  trends: "Trends",
  pillars: "Pillar breakdown",
  gutHealth: "Gut health",
  patterns: "Patterns to watch",
  macroAverages: "Daily macro averages",
  energyBalance: "Energy balance",
  hydration: "Hydration log",
  recommendations: "Recommendations",
  mealLog: "Meal log",
  profile: "Your profile",
  sparkline: "Daily nutrition score",
  clinical: "Not medical advice",
  eatOut: "Eat-out audit",
} as const;
