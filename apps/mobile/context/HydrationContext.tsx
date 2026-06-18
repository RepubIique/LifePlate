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
import { useAuth } from "@/context/AuthContext";
import { fetchHydrationHistory, updateHydration } from "@/lib/api";
import { TAB_FOCUS_STALE_MS } from "@/lib/focusStale";
import {
  clearCachedHydration,
  loadCachedHydration,
  saveCachedHydration,
} from "@/lib/hydrationCache";

export const HYDRATION_HISTORY_DAYS = 60;

const DEBOUNCE_MS = 900;
const MAX_GLASSES = 24;

type LoadOptions = {
  force?: boolean;
};

type HydrationContextValue = {
  hydrationByDate: Record<string, number>;
  syncingDate: string | null;
  loadHydration: (options?: LoadOptions) => Promise<void>;
  refreshHydration: () => Promise<void>;
  invalidateHydration: () => void;
  syncDate: (dateKey: string, glasses: number) => void;
  adjustHydration: (dateKey: string, delta: number) => void;
};

const HydrationContext = createContext<HydrationContextValue | null>(null);

export function HydrationProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [hydrationByDate, setHydrationByDate] = useState<Record<string, number>>({});
  const [syncingDate, setSyncingDate] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const fetchedAtRef = useRef(0);
  const dirtyRef = useRef(false);
  const inflightRef = useRef<Promise<void> | null>(null);
  const confirmedRef = useRef<Record<string, number>>({});
  const debounceRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const pendingGlassesRef = useRef<Map<string, number>>(new Map());
  const persistInflightRef = useRef<Set<string>>(new Set());
  const queuedRef = useRef<Map<string, number>>(new Map());
  const hydrationRef = useRef(hydrationByDate);

  useEffect(() => {
    hydrationRef.current = hydrationByDate;
  }, [hydrationByDate]);

  useEffect(() => {
    if (!userId) {
      setHydrationByDate({});
      setSyncingDate(null);
      setHydrated(false);
      fetchedAtRef.current = 0;
      dirtyRef.current = false;
      inflightRef.current = null;
      confirmedRef.current = {};
      return;
    }

    let cancelled = false;
    setHydrated(false);
    void (async () => {
      const cached = await loadCachedHydration(userId);
      if (cancelled) return;
      if (cached) {
        setHydrationByDate(cached.byDate);
        confirmedRef.current = { ...cached.byDate };
        fetchedAtRef.current = cached.fetchedAt;
      }
      setHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const persistLocal = useCallback(
    (byDate: Record<string, number>, fetchedAt: number) => {
      if (!userId) return;
      void saveCachedHydration(userId, byDate, fetchedAt);
    },
    [userId],
  );

  const replaceFromServer = useCallback(
    (map: Record<string, number>) => {
      setHydrationByDate(map);
      confirmedRef.current = { ...map };
      const fetchedAt = Date.now();
      fetchedAtRef.current = fetchedAt;
      dirtyRef.current = false;
      persistLocal(map, fetchedAt);
    },
    [persistLocal],
  );

  const invalidateHydration = useCallback(() => {
    dirtyRef.current = true;
    fetchedAtRef.current = 0;
  }, []);

  const loadHydration = useCallback(
    async (options?: LoadOptions) => {
      if (!session || !hydrated) return;

      const force = options?.force ?? false;
      const isFresh =
        !dirtyRef.current &&
        fetchedAtRef.current > 0 &&
        Date.now() - fetchedAtRef.current < TAB_FOCUS_STALE_MS;

      if (!force && isFresh) return;

      if (inflightRef.current) {
        await inflightRef.current;
        return;
      }

      const run = (async () => {
        const { days } = await fetchHydrationHistory(HYDRATION_HISTORY_DAYS);
        const map: Record<string, number> = {};
        for (const day of days) {
          map[day.date] = day.glasses;
        }
        replaceFromServer(map);
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
    [session, hydrated, replaceFromServer],
  );

  const refreshHydration = useCallback(
    () => loadHydration({ force: true }),
    [loadHydration],
  );

  const persistDate = useCallback(
    async (dateKey: string, glasses: number) => {
      if (persistInflightRef.current.has(dateKey)) {
        queuedRef.current.set(dateKey, glasses);
        return;
      }

      persistInflightRef.current.add(dateKey);
      setSyncingDate(dateKey);
      try {
        const { glasses: saved } = await updateHydration(glasses, dateKey);
        confirmedRef.current[dateKey] = saved;
        setHydrationByDate((prev) => {
          const next = { ...prev, [dateKey]: saved };
          persistLocal(next, fetchedAtRef.current || Date.now());
          return next;
        });
      } catch {
        const rollback = confirmedRef.current[dateKey] ?? 0;
        setHydrationByDate((prev) => ({ ...prev, [dateKey]: rollback }));
      } finally {
        persistInflightRef.current.delete(dateKey);
        setSyncingDate((current) => (current === dateKey ? null : current));

        const queued = queuedRef.current.get(dateKey);
        if (queued !== undefined) {
          queuedRef.current.delete(dateKey);
          void persistDate(dateKey, queued);
        }
      }
    },
    [persistLocal],
  );

  const schedulePersist = useCallback(
    (dateKey: string, glasses: number) => {
      pendingGlassesRef.current.set(dateKey, glasses);

      const existing = debounceRef.current.get(dateKey);
      if (existing) clearTimeout(existing);

      const timer = setTimeout(() => {
        debounceRef.current.delete(dateKey);
        const pending = pendingGlassesRef.current.get(dateKey);
        if (pending === undefined) return;
        pendingGlassesRef.current.delete(dateKey);
        void persistDate(dateKey, pending);
      }, DEBOUNCE_MS);

      debounceRef.current.set(dateKey, timer);
    },
    [persistDate],
  );

  const syncDate = useCallback(
    (dateKey: string, glasses: number) => {
      if (debounceRef.current.has(dateKey) || persistInflightRef.current.has(dateKey)) {
        return;
      }
      confirmedRef.current[dateKey] = glasses;
      setHydrationByDate((prev) => ({ ...prev, [dateKey]: glasses }));
    },
    [],
  );

  const adjustHydration = useCallback(
    (dateKey: string, delta: number) => {
      setHydrationByDate((prev) => {
        const current = prev[dateKey] ?? confirmedRef.current[dateKey] ?? 0;
        const glasses = Math.max(0, Math.min(MAX_GLASSES, current + delta));
        schedulePersist(dateKey, glasses);
        return { ...prev, [dateKey]: glasses };
      });
    },
    [schedulePersist],
  );

  useEffect(() => {
    const debounceTimers = debounceRef.current;
    const pendingGlasses = pendingGlassesRef.current;

    return () => {
      for (const timer of debounceTimers.values()) {
        clearTimeout(timer);
      }
      debounceTimers.clear();

      for (const [dateKey, glasses] of pendingGlasses.entries()) {
        pendingGlasses.delete(dateKey);
        void persistDate(dateKey, glasses);
      }
    };
  }, [persistDate]);

  const value = useMemo(
    () => ({
      hydrationByDate,
      syncingDate,
      loadHydration,
      refreshHydration,
      invalidateHydration,
      syncDate,
      adjustHydration,
    }),
    [
      hydrationByDate,
      syncingDate,
      loadHydration,
      refreshHydration,
      invalidateHydration,
      syncDate,
      adjustHydration,
    ],
  );

  return (
    <HydrationContext.Provider value={value}>{children}</HydrationContext.Provider>
  );
}

export function useHydration() {
  const ctx = useContext(HydrationContext);
  if (!ctx) throw new Error("useHydration must be used within HydrationProvider");
  return ctx;
}

export { clearCachedHydration };
