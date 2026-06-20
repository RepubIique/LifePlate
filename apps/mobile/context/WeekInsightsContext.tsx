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
import type { InsightsResponse } from "@lifeplate/shared";
import { useAuth } from "@/context/AuthContext";
import { fetchInsights } from "@/lib/api";
import { TAB_FOCUS_STALE_MS } from "@/lib/focusStale";
import {
  currentWeekStartKey,
  loadCachedWeekInsights,
  saveCachedWeekInsights,
} from "@/lib/weekInsightsCache";

const STALE_MS = TAB_FOCUS_STALE_MS;

type LoadOptions = {
  force?: boolean;
};

type WeekInsightsContextValue = {
  insights: InsightsResponse | null;
  loading: boolean;
  refreshing: boolean;
  loadWeekInsights: (options?: LoadOptions) => Promise<void>;
  refreshWeekInsights: () => Promise<void>;
  invalidateWeekInsights: () => void;
};

const WeekInsightsContext = createContext<WeekInsightsContextValue | null>(null);

export function WeekInsightsProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const fetchedAtRef = useRef(0);
  const dirtyRef = useRef(false);
  const weekStartRef = useRef<string | null>(null);
  const inflightRef = useRef<Promise<void> | null>(null);
  const insightsRef = useRef(insights);

  useEffect(() => {
    insightsRef.current = insights;
  }, [insights]);

  useEffect(() => {
    if (!userId) {
      setInsights(null);
      setLoading(false);
      setRefreshing(false);
      setHydrated(false);
      fetchedAtRef.current = 0;
      dirtyRef.current = false;
      weekStartRef.current = null;
      inflightRef.current = null;
      return;
    }

    let cancelled = false;
    setHydrated(false);
    void (async () => {
      const cached = await loadCachedWeekInsights(userId);
      if (cancelled) return;
      if (cached?.insights) {
        setInsights(cached.insights);
        fetchedAtRef.current = cached.fetchedAt;
        weekStartRef.current = cached.weekStartDateKey;
      }
      setHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const persistInsights = useCallback(
    (next: InsightsResponse, fetchedAt: number) => {
      if (!userId) return;
      const weekStart = currentWeekStartKey();
      weekStartRef.current = weekStart;
      void saveCachedWeekInsights(userId, next, fetchedAt);
    },
    [userId],
  );

  const isFresh = useCallback(() => {
    if (!insightsRef.current || dirtyRef.current) return false;
    if (weekStartRef.current !== currentWeekStartKey()) return false;
    if (fetchedAtRef.current <= 0) return false;
    return Date.now() - fetchedAtRef.current < STALE_MS;
  }, []);

  const invalidateWeekInsights = useCallback(() => {
    dirtyRef.current = true;
    fetchedAtRef.current = 0;
  }, []);

  const loadWeekInsights = useCallback(
    async (options?: LoadOptions) => {
      if (!session || !hydrated) return;

      const force = options?.force ?? false;
      if (!force && isFresh()) return;

      if (inflightRef.current) {
        await inflightRef.current;
        return;
      }

      const hasData = insightsRef.current != null;
      const isBackgroundRefresh = force && hasData;

      const run = (async () => {
        if (isBackgroundRefresh) {
          setRefreshing(true);
        } else if (!hasData) {
          setLoading(true);
        }

        try {
          const data = await fetchInsights();
          const fetchedAt = Date.now();
          setInsights(data);
          fetchedAtRef.current = fetchedAt;
          dirtyRef.current = false;
          persistInsights(data, fetchedAt);
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
    [session, hydrated, isFresh, persistInsights],
  );

  const refreshWeekInsights = useCallback(
    () => loadWeekInsights({ force: true }),
    [loadWeekInsights],
  );

  const value = useMemo(
    () => ({
      insights,
      loading,
      refreshing,
      loadWeekInsights,
      refreshWeekInsights,
      invalidateWeekInsights,
    }),
    [
      insights,
      loading,
      refreshing,
      loadWeekInsights,
      refreshWeekInsights,
      invalidateWeekInsights,
    ],
  );

  return (
    <WeekInsightsContext.Provider value={value}>{children}</WeekInsightsContext.Provider>
  );
}

export function useWeekInsights() {
  const ctx = useContext(WeekInsightsContext);
  if (!ctx) {
    throw new Error("useWeekInsights must be used within WeekInsightsProvider");
  }
  return ctx;
}
