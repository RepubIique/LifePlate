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
import type { CoopChallengeSummary, GamificationServerStatsResponse } from "@lifeplate/shared";
import { useAuth } from "@/context/AuthContext";
import { fetchGamificationBundle } from "@/lib/api";
import { TAB_FOCUS_STALE_MS } from "@/lib/focusStale";
import {
  loadCachedGamification,
  saveCachedGamification,
  type GamificationCachePayload,
} from "@/lib/gamificationCache";

const STALE_MS = TAB_FOCUS_STALE_MS;

type LoadOptions = {
  force?: boolean;
};

type GamificationContextValue = {
  serverStats: GamificationServerStatsResponse | null;
  challenges: CoopChallengeSummary[];
  loading: boolean;
  refreshing: boolean;
  hydrated: boolean;
  loadGamification: (options?: LoadOptions) => Promise<void>;
  refreshGamification: () => Promise<void>;
  invalidateGamification: () => void;
  patchGamification: (
    patch: Partial<Pick<GamificationCachePayload, "stats" | "challenges">>,
  ) => void;
};

const GamificationContext = createContext<GamificationContextValue | null>(null);

export function GamificationProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [serverStats, setServerStats] = useState<GamificationServerStatsResponse | null>(null);
  const [challenges, setChallenges] = useState<CoopChallengeSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const fetchedAtRef = useRef(0);
  const dirtyRef = useRef(false);
  const inflightRef = useRef<Promise<void> | null>(null);
  const snapshotRef = useRef({ serverStats, challenges });

  useEffect(() => {
    snapshotRef.current = { serverStats, challenges };
  }, [serverStats, challenges]);

  useEffect(() => {
    if (!userId) {
      setServerStats(null);
      setChallenges([]);
      setLoading(false);
      setRefreshing(false);
      setHydrated(false);
      fetchedAtRef.current = 0;
      dirtyRef.current = false;
      inflightRef.current = null;
      return;
    }

    let cancelled = false;
    setHydrated(false);
    void (async () => {
      const cached = await loadCachedGamification(userId);
      if (cancelled) return;
      if (cached) {
        setServerStats(cached.stats);
        setChallenges(cached.challenges);
        fetchedAtRef.current = cached.fetchedAt;
      }
      setHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const persist = useCallback(
    (next: Pick<GamificationCachePayload, "stats" | "challenges">, fetchedAt: number) => {
      if (!userId) return;
      void saveCachedGamification(userId, next, fetchedAt);
    },
    [userId],
  );

  const applySnapshot = useCallback(
    (next: Pick<GamificationCachePayload, "stats" | "challenges">, fetchedAt: number) => {
      setServerStats(next.stats);
      setChallenges(next.challenges);
      fetchedAtRef.current = fetchedAt;
      dirtyRef.current = false;
      persist(next, fetchedAt);
    },
    [persist],
  );

  const invalidateGamification = useCallback(() => {
    dirtyRef.current = true;
    fetchedAtRef.current = 0;
  }, []);

  const patchGamification = useCallback(
    (patch: Partial<Pick<GamificationCachePayload, "stats" | "challenges">>) => {
      const current = snapshotRef.current;
      const next = {
        stats: patch.stats ?? current.serverStats ?? { sharesSentCount: 0 },
        challenges: patch.challenges ?? current.challenges,
      };
      setServerStats(next.stats);
      setChallenges(next.challenges);
      persist(next, fetchedAtRef.current || Date.now());
    },
    [persist],
  );

  const loadGamification = useCallback(
    async (options?: LoadOptions) => {
      if (!session || !hydrated) return;

      const force = options?.force ?? false;
      const isFresh =
        !dirtyRef.current &&
        fetchedAtRef.current > 0 &&
        Date.now() - fetchedAtRef.current < STALE_MS;

      if (!force && isFresh) return;

      if (inflightRef.current) {
        await inflightRef.current;
        return;
      }

      const hasData =
        snapshotRef.current.serverStats != null || snapshotRef.current.challenges.length > 0;
      const isBackgroundRefresh = force && hasData;

      const run = (async () => {
        if (isBackgroundRefresh) {
          setRefreshing(true);
        } else if (!hasData) {
          setLoading(true);
        }

        try {
          const data = await fetchGamificationBundle();
          applySnapshot(
            { stats: data.stats, challenges: data.challenges },
            Date.now(),
          );
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
    [session, hydrated, applySnapshot],
  );

  const refreshGamification = useCallback(
    () => loadGamification({ force: true }),
    [loadGamification],
  );

  useEffect(() => {
    if (!session || !hydrated) return;
    void loadGamification();
  }, [session, hydrated, loadGamification]);

  const value = useMemo(
    () => ({
      serverStats,
      challenges,
      loading,
      refreshing,
      hydrated,
      loadGamification,
      refreshGamification,
      invalidateGamification,
      patchGamification,
    }),
    [
      serverStats,
      challenges,
      loading,
      refreshing,
      hydrated,
      loadGamification,
      refreshGamification,
      invalidateGamification,
      patchGamification,
    ],
  );

  return (
    <GamificationContext.Provider value={value}>{children}</GamificationContext.Provider>
  );
}

export function useGamification() {
  const ctx = useContext(GamificationContext);
  if (!ctx) throw new Error("useGamification must be used within GamificationProvider");
  return ctx;
}
