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
import type { NutritionDashboardResponse, PillarProgress } from "@lifeplate/shared";
import { useAuth } from "@/context/AuthContext";
import { fetchNutritionDashboard } from "@/lib/api";
import {
  clearCachedDashboard,
  loadCachedDashboard,
  saveCachedDashboard,
  todayDateKey,
} from "@/lib/dashboardCache";

const STALE_MS = 60_000;

type LoadOptions = {
  force?: boolean;
};

type NutritionDashboardContextValue = {
  dashboard: NutritionDashboardResponse | null;
  loading: boolean;
  loadDashboard: (options?: LoadOptions) => Promise<void>;
  refreshDashboard: () => Promise<void>;
  invalidateDashboard: () => void;
  patchHydration: (hydration: PillarProgress) => void;
};

const NutritionDashboardContext = createContext<NutritionDashboardContextValue | null>(null);

export function NutritionDashboardProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [dashboard, setDashboard] = useState<NutritionDashboardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const fetchedAtRef = useRef(0);
  const dirtyRef = useRef(false);
  const inflightRef = useRef<Promise<void> | null>(null);
  const dashboardRef = useRef(dashboard);

  useEffect(() => {
    dashboardRef.current = dashboard;
  }, [dashboard]);

  useEffect(() => {
    if (!userId) {
      setDashboard(null);
      setLoading(false);
      setHydrated(false);
      fetchedAtRef.current = 0;
      dirtyRef.current = false;
      inflightRef.current = null;
      return;
    }

    let cancelled = false;
    setHydrated(false);
    void (async () => {
      const cached = await loadCachedDashboard(userId);
      if (cancelled) return;
      if (cached?.dashboard && cached.dashboard.date === todayDateKey()) {
        setDashboard(cached.dashboard);
        fetchedAtRef.current = cached.fetchedAt;
      }
      setHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const persistDashboard = useCallback(
    (nextDashboard: NutritionDashboardResponse, fetchedAt: number) => {
      if (!userId) return;
      void saveCachedDashboard(userId, nextDashboard, fetchedAt);
    },
    [userId],
  );

  const isFresh = useCallback(() => {
    const current = dashboardRef.current;
    if (!current || dirtyRef.current) return false;
    if (current.date !== todayDateKey()) return false;
    return Date.now() - fetchedAtRef.current < STALE_MS;
  }, []);

  const invalidateDashboard = useCallback(() => {
    dirtyRef.current = true;
    fetchedAtRef.current = 0;
  }, []);

  const patchHydration = useCallback(
    (hydration: PillarProgress) => {
      setDashboard((prev) => {
        if (!prev) return prev;
        const next = {
          ...prev,
          essentials: { ...prev.essentials, hydration },
        };
        persistDashboard(next, fetchedAtRef.current);
        return next;
      });
    },
    [persistDashboard],
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

      const run = (async () => {
        if (!hasData) setLoading(true);

        try {
          const data = await fetchNutritionDashboard();
          const fetchedAt = Date.now();
          setDashboard(data);
          fetchedAtRef.current = fetchedAt;
          dirtyRef.current = false;
          persistDashboard(data, fetchedAt);
        } catch (e) {
          throw e;
        } finally {
          setLoading(false);
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
    [session, hydrated, isFresh, persistDashboard],
  );

  const refreshDashboard = useCallback(
    () => loadDashboard({ force: true }),
    [loadDashboard],
  );

  const value = useMemo(
    () => ({
      dashboard,
      loading,
      loadDashboard,
      refreshDashboard,
      invalidateDashboard,
      patchHydration,
    }),
    [
      dashboard,
      loading,
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
