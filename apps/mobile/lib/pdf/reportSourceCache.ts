import type { HydrationDayRecord, MealListItem, UserProfile } from "@lifeplate/shared";
import {
  fetchHydrationHistory,
  fetchInsights,
  fetchMealsFull,
  fetchNutritionDashboard,
} from "@/lib/api";
import { loadCachedDashboard } from "@/lib/dashboardCache";
import { TAB_FOCUS_STALE_MS } from "@/lib/focusStale";
import { loadCachedHydration } from "@/lib/hydrationCache";
import { loadCachedWeekInsights } from "@/lib/weekInsightsCache";
import { expandDashboard } from "@/lib/nutritionDashboardView";

export const REPORT_HYDRATION_HISTORY_DAYS = 90;

export type ReportSourceSeeds = {
  hydrationByDate?: Record<string, number>;
  coachInsight?: string | null;
};

export type ReportSourceBundle = {
  userId: string;
  allMeals: MealListItem[];
  hydrationDays: HydrationDayRecord[];
  coachInsight: string;
  fetchedAt: number;
};

type CacheEntry = {
  bundle: ReportSourceBundle | null;
  inflight: Promise<ReportSourceBundle> | null;
};

const cacheByUser = new Map<string, CacheEntry>();

function cacheEntry(userId: string): CacheEntry {
  let entry = cacheByUser.get(userId);
  if (!entry) {
    entry = { bundle: null, inflight: null };
    cacheByUser.set(userId, entry);
  }
  return entry;
}

function isFresh(fetchedAt: number, staleMs = TAB_FOCUS_STALE_MS): boolean {
  return fetchedAt > 0 && Date.now() - fetchedAt < staleMs;
}

function hydrationRecordsFromMap(byDate: Record<string, number>): HydrationDayRecord[] {
  return Object.entries(byDate).map(([date, glasses]) => ({ date, glasses }));
}

function mergeCoachInsight(...candidates: Array<string | null | undefined>): string {
  for (const value of candidates) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return "Keep logging meals to unlock personalised insights.";
}

async function resolveCoachInsight(
  userId: string,
  seeds?: ReportSourceSeeds,
): Promise<string> {
  const seeded = seeds?.coachInsight?.trim();
  if (seeded) return seeded;

  const cachedDashboard = await loadCachedDashboard(userId);
  if (cachedDashboard?.dashboard) {
    const fromCache =
      cachedDashboard.dashboard.lifeplateInsight?.trim() ||
      expandDashboard(cachedDashboard.dashboard, null).coachSummary?.trim();
    if (fromCache) return fromCache;
  }

  const cachedWeek = await loadCachedWeekInsights(userId);
  const weekNudge = cachedWeek?.insights.coachNudge?.trim();
  if (weekNudge) return weekNudge;

  try {
    const [dashboardApi, insights] = await Promise.all([
      fetchNutritionDashboard(),
      fetchInsights(),
    ]);
    const expanded = expandDashboard(dashboardApi, null);
    return mergeCoachInsight(
      expanded.lifeplateInsight,
      expanded.coachSummary,
      insights.coachNudge,
    );
  } catch {
    return mergeCoachInsight();
  }
}

async function resolveHydrationDays(
  userId: string,
  minDays: number,
  seeds?: ReportSourceSeeds,
): Promise<HydrationDayRecord[]> {
  const seeded = seeds?.hydrationByDate;
  if (seeded && Object.keys(seeded).length >= Math.min(minDays, 7)) {
    return hydrationRecordsFromMap(seeded);
  }

  const cached = await loadCachedHydration(userId);
  if (cached && Object.keys(cached.byDate).length >= Math.min(minDays, 7)) {
    return hydrationRecordsFromMap(cached.byDate);
  }

  const response = await fetchHydrationHistory(minDays);
  return response.days;
}

async function resolveMeals(entry: CacheEntry): Promise<MealListItem[]> {
  if (entry.bundle && isFresh(entry.bundle.fetchedAt)) {
    return entry.bundle.allMeals;
  }
  return fetchMealsFull();
}

async function loadReportSourceInternal(
  profile: UserProfile,
  minHydrationDays: number,
  seeds?: ReportSourceSeeds,
): Promise<ReportSourceBundle> {
  const userId = profile.id;
  const entry = cacheEntry(userId);

  const [allMeals, hydrationDays, coachInsight] = await Promise.all([
    resolveMeals(entry),
    resolveHydrationDays(userId, minHydrationDays, seeds),
    resolveCoachInsight(userId, seeds),
  ]);

  const bundle: ReportSourceBundle = {
    userId,
    allMeals,
    hydrationDays,
    coachInsight,
    fetchedAt: Date.now(),
  };

  entry.bundle = bundle;
  return bundle;
}

export function getCachedReportSource(userId: string): ReportSourceBundle | null {
  const entry = cacheByUser.get(userId);
  if (!entry?.bundle || entry.bundle.userId !== userId) return null;
  if (!isFresh(entry.bundle.fetchedAt)) return null;
  return entry.bundle;
}

export function clearReportSourceCache(userId?: string): void {
  if (userId) {
    cacheByUser.delete(userId);
    return;
  }
  cacheByUser.clear();
}

export async function loadReportSource(
  profile: UserProfile,
  options?: {
    minHydrationDays?: number;
    seeds?: ReportSourceSeeds;
    force?: boolean;
  },
): Promise<ReportSourceBundle> {
  const userId = profile.id;
  const minHydrationDays = options?.minHydrationDays ?? REPORT_HYDRATION_HISTORY_DAYS;

  if (!options?.force) {
    const cached = getCachedReportSource(userId);
    if (cached) return cached;
  }

  const entry = cacheEntry(userId);
  if (entry.inflight) {
    return entry.inflight;
  }

  entry.inflight = loadReportSourceInternal(profile, minHydrationDays, options?.seeds).finally(() => {
    entry.inflight = null;
  });

  return entry.inflight;
}
