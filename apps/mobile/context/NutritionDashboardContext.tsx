import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { NutritionDashboardApiResponse } from "@lifeplate/shared";
import { useAuth } from "@/context/AuthContext";
import { fetchNutritionDashboard } from "@/lib/api";
import { TAB_FOCUS_STALE_MS } from "@/lib/focusStale";
import {
  clearCachedDashboard,
  loadCachedDashboard,
  saveCachedDashboard,
  todayDateKey,
} from "@/lib/dashboardCache";
import { expandDashboard, normalizeDashboardApi, type NutritionDashboardView } from "@/lib/nutritionDashboardView";

const STALE_MS = TAB_FOCUS_STALE_MS;

type LoadOptions = {
  force?: boolean;
};

type NutritionDashboardContextValue = {
  dashboard: NutritionDashboardView | null;
  loading: boolean;
  refreshing: boolean;
  loadDashboard: (options?: LoadOptions) => Promise<void>;
  refreshDashboard: () => Promise<void>;
  invalidateDashboard: () => void;
  patchHydration: (glasses: number) => void;
};

const NutritionDashboardContext = createContext<NutritionDashboardContextValue | null>(null);

export function NutritionDashboardProvider({ children }: { children: ReactNode }) {
  const { session, profile } = useAuth();
  const userId = session?.user.id;
  const [dashboard, setDashboard] = useState<NutritionDashboardView | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const fetchedAtRef = useRef(0);
  const dirtyRef = useRef(false);
  const inflightRef = useRef<Promise<void> | null>(null);
  const dashboardRef = useRef(dashboard);
  const rawDashboardRef = useRef<NutritionDashboardApiResponse | null>(null);

  useEffect(() => {
    dashboardRef.current = dashboard;
  }, [dashboard]);

  const expand = useCallback(
    (raw: NutritionDashboardApiResponse): NutritionDashboardView =>
      expandDashboard(normalizeDashboardApi(raw), profile?.nutritionTargets ?? null),
    [profile?.nutritionTargets],
  );

  useEffect(() => {
    if (!rawDashboardRef.current) return;
    setDashboard(expand(rawDashboardRef.current));
  }, [expand]);

  useEffect(() => {
    if (!userId) {
      setDashboard(null);
      setLoading(false);
      setHydrated(false);
      fetchedAtRef.current = 0;
      dirtyRef.current = false;
      inflightRef.current = null;
      rawDashboardRef.current = null;
      return;
    }

    let cancelled = false;
    setHydrated(false);
    void (async () => {
      const cached = await loadCachedDashboard(userId);
      if (cancelled) return;
      if (cached?.dashboard && cached.dashboard.date === todayDateKey()) {
        const normalized = normalizeDashboardApi(cached.dashboard);
        rawDashboardRef.current = normalized;
        setDashboard(expandDashboard(normalized, profile?.nutritionTargets ?? null));
        fetchedAtRef.current = cached.fetchedAt;
      }
      setHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const persistDashboard = useCallback(
    (rawDashboard: NutritionDashboardApiResponse, fetchedAt: number) => {
      if (!userId) return;
      void saveCachedDashboard(userId, rawDashboard, fetchedAt);
    },
    [userId],
  );

  const isFresh = useCallback(() => {
    const current = dashboardRef.current;
    if (!current || dirtyRef.current) return false;
    if (current.date !== todayDateKey()) return false;
    if (fetchedAtRef.current <= 0) return false;
    return Date.now() - fetchedAtRef.current < STALE_MS;
  }, []);

  const invalidateDashboard = useCallback(() => {
    dirtyRef.current = true;
    fetchedAtRef.current = 0;
  }, []);

  const patchHydration = useCallback(
    (glasses: number) => {
      setDashboard((prev) => {
        if (!prev || !rawDashboardRef.current) return prev;
        const raw: NutritionDashboardApiResponse = {
          ...rawDashboardRef.current,
          hydration: { glasses },
        };
        rawDashboardRef.current = raw;
        const next = expand(raw);
        persistDashboard(raw, fetchedAtRef.current);
        return next;
      });
    },
    [expand, persistDashboard],
  );

  const loadDashboard = useCallback(
    async (options?: LoadOptions) => {
      if (!session || !hydrated) return;

      const force = options?.force ?? false;
      if (!force && isFresh()) return;

      if (inflightRef.current) {
        await inflightRef.current;
        return;
      }

      const hasData = dashboardRef.current != null;
      const isBackgroundRefresh = force && hasData;

      const run = (async () => {
        if (isBackgroundRefresh) {
          setRefreshing(true);
        } else if (!hasData) {
          setLoading(true);
        }

        try {
          const data = normalizeDashboardApi(await fetchNutritionDashboard());
          const fetchedAt = Date.now();
          rawDashboardRef.current = data;
          setDashboard(expand(data));
          fetchedAtRef.current = fetchedAt;
          dirtyRef.current = false;
          persistDashboard(data, fetchedAt);
        } catch (e) {
          throw e;
        } finally {
          setLoading(false);
          setRefreshing(false);
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
    [session, hydrated, isFresh, expand, persistDashboard],
  );

  const refreshDashboard = useCallback(
    () => loadDashboard({ force: true }),
    [loadDashboard],
  );

  useEffect(() => {
    if (!session || !hydrated) return;
    void loadDashboard();
  }, [session, hydrated, loadDashboard]);

  const value = useMemo(
    () => ({
      dashboard,
      loading,
      refreshing,
      loadDashboard,
      refreshDashboard,
      invalidateDashboard,
      patchHydration,
    }),
    [
      dashboard,
      loading,
      refreshing,
      loadDashboard,
      refreshDashboard,
      invalidateDashboard,
      patchHydration,
    ],
  );

  return (
    <NutritionDashboardContext.Provider value={value}>
      {children}
    </NutritionDashboardContext.Provider>
  );
}

export function useNutritionDashboard() {
  const ctx = useContext(NutritionDashboardContext);
  if (!ctx) {
    throw new Error("useNutritionDashboard must be used within NutritionDashboardProvider");
  }
  return ctx;
}

export { clearCachedDashboard };
