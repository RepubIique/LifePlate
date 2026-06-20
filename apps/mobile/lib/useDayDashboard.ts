import { useCallback, useEffect, useRef, useState } from "react";
import type { NutritionTargets } from "@lifeplate/shared";
import { buildHydrationPillarFromGlasses } from "@lifeplate/shared";
import { useAuth } from "@/context/AuthContext";
import { fetchNutritionDashboard } from "@/lib/api";
import { TAB_FOCUS_STALE_MS } from "@/lib/focusStale";
import {
  loadCachedDayDashboards,
  removeCachedDayDashboard,
  saveCachedDayDashboard,
  type DayDashboardCacheEntry,
} from "@/lib/dayDashboardCache";
import { expandDashboard, type NutritionDashboardView } from "@/lib/nutritionDashboardView";

type Options = {
  dateKey: string;
  mealsRevision: string;
  enabled: boolean;
  nutritionTargets: NutritionTargets | null | undefined;
  hydrationTarget: number;
  onError?: (error: unknown) => void;
};

export function useDayDashboard({
  dateKey,
  mealsRevision,
  enabled,
  nutritionTargets,
  hydrationTarget,
  onError,
}: Options) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const [dashboard, setDashboard] = useState<NutritionDashboardView | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [diskHydrated, setDiskHydrated] = useState(false);
  const memoryRef = useRef<Map<string, DayDashboardCacheEntry>>(new Map());
  const inflightRef = useRef<Promise<void> | null>(null);

  const expand = useCallback(
    (raw: DayDashboardCacheEntry["dashboard"]) =>
      expandDashboard(raw, nutritionTargets ?? null),
    [nutritionTargets],
  );

  useEffect(() => {
    memoryRef.current.clear();
    setDiskHydrated(false);
    setDashboard(null);
    setLoading(false);

    if (!userId) return;

    let cancelled = false;
    void (async () => {
      const cached = await loadCachedDayDashboards(userId);
      if (cancelled) return;
      for (const [key, entry] of Object.entries(cached)) {
        memoryRef.current.set(key, entry);
      }
      setDiskHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const persistEntry = useCallback(
    (targetDateKey: string, entry: DayDashboardCacheEntry) => {
      memoryRef.current.set(targetDateKey, entry);
      if (userId) {
        void saveCachedDayDashboard(userId, targetDateKey, entry);
      }
    },
    [userId],
  );

  const applyCachedEntry = useCallback(
    (entry: DayDashboardCacheEntry) => {
      setDashboard(expand(entry.dashboard));
    },
    [expand],
  );

  const fetchAndStore = useCallback(
    async (targetDateKey: string, revision: string, showLoading: boolean) => {
      if (inflightRef.current) {
        await inflightRef.current;
        const cached = memoryRef.current.get(targetDateKey);
        if (cached && cached.mealsRevision === revision) {
          applyCachedEntry(cached);
          return;
        }
      }

      const run = (async () => {
        if (showLoading) setLoading(true);
        try {
          const raw = await fetchNutritionDashboard(targetDateKey);
          const entry: DayDashboardCacheEntry = {
            dashboard: raw,
            mealsRevision: revision,
            fetchedAt: Date.now(),
          };
          persistEntry(targetDateKey, entry);
          if (enabled && targetDateKey === dateKey) {
            applyCachedEntry(entry);
            setLoadFailed(false);
          }
        } catch (error) {
          if (enabled && targetDateKey === dateKey) {
            setLoadFailed(true);
          }
          onErrorRef.current?.(error);
          throw error;
        } finally {
          if (showLoading) setLoading(false);
        }
      })();

      inflightRef.current = run;
      try {
        await run;
      } finally {
        if (inflightRef.current === run) {
          inflightRef.current = null;
        }
      }
    },
    [applyCachedEntry, dateKey, enabled, persistEntry],
  );

  useEffect(() => {
    if (!enabled) {
      setDashboard(null);
      setLoading(false);
      setLoadFailed(false);
      return;
    }

    if (!diskHydrated) return;

    const cached = memoryRef.current.get(dateKey);
    if (cached && cached.mealsRevision === mealsRevision) {
      applyCachedEntry(cached);
      setLoading(false);
      const isFresh = Date.now() - cached.fetchedAt < TAB_FOCUS_STALE_MS;
      if (!isFresh) {
        void fetchAndStore(dateKey, mealsRevision, false);
      }
      return;
    }

    void fetchAndStore(dateKey, mealsRevision, !cached);
  }, [
    applyCachedEntry,
    dateKey,
    diskHydrated,
    enabled,
    fetchAndStore,
    mealsRevision,
  ]);

  useEffect(() => {
    if (!enabled || !diskHydrated) return;
    const cached = memoryRef.current.get(dateKey);
    if (cached) {
      applyCachedEntry(cached);
    }
  }, [applyCachedEntry, dateKey, diskHydrated, enabled, expand]);

  const refresh = useCallback(async () => {
    memoryRef.current.delete(dateKey);
    if (userId) {
      await removeCachedDayDashboard(userId, dateKey);
    }
    await fetchAndStore(dateKey, mealsRevision, true);
  }, [dateKey, fetchAndStore, mealsRevision, userId]);

  const patchHydration = useCallback(
    (glasses: number) => {
      const cached = memoryRef.current.get(dateKey);
      if (!cached) {
        setDashboard((prev) => {
          if (!prev) return prev;
          const hydration = buildHydrationPillarFromGlasses(glasses, hydrationTarget);
          return { ...prev, essentials: { ...prev.essentials, hydration } };
        });
        return;
      }

      const raw = { ...cached.dashboard, hydration: { glasses } };
      const nextEntry: DayDashboardCacheEntry = {
        ...cached,
        dashboard: raw,
      };
      persistEntry(dateKey, nextEntry);
      setDashboard(expandDashboard(raw, nutritionTargets ?? null));
    },
    [dateKey, expand, hydrationTarget, nutritionTargets, persistEntry],
  );

  return {
    dashboard,
    loading: loading || (enabled && !diskHydrated && !memoryRef.current.has(dateKey)),
    loadFailed,
    refresh,
    patchHydration,
  };
}
