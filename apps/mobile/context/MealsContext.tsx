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
import type { MealListSummary } from "@lifeplate/shared";
import { useAuth } from "@/context/AuthContext";
import { fetchMeals } from "@/lib/api";
import {
  loadCachedMeals,
  saveCachedMeals,
} from "@/lib/mealsCache";

const STALE_MS = 60_000;

type LoadOptions = {
  force?: boolean;
};

type MealsContextValue = {
  meals: MealListSummary[];
  loading: boolean;
  refreshing: boolean;
  loadMeals: (options?: LoadOptions) => Promise<void>;
  refreshMeals: () => Promise<void>;
  invalidateMeals: () => void;
  getMealById: (id: string) => MealListSummary | undefined;
  removeMealLocally: (id: string) => void;
  restoreMealLocally: (meal: MealListSummary) => void;
};

const MealsContext = createContext<MealsContextValue | null>(null);

export function MealsProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [meals, setMeals] = useState<MealListSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const fetchedAtRef = useRef(0);
  const dirtyRef = useRef(false);
  const inflightRef = useRef<Promise<void> | null>(null);
  const mealsRef = useRef(meals);

  useEffect(() => {
    mealsRef.current = meals;
  }, [meals]);

  useEffect(() => {
    if (!userId) {
      setMeals([]);
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
      const cached = await loadCachedMeals(userId);
      if (cancelled) return;
      if (cached?.meals.length) {
        setMeals(cached.meals);
        fetchedAtRef.current = cached.fetchedAt;
      }
      setHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const persistMeals = useCallback(
    (nextMeals: MealListSummary[], fetchedAt: number) => {
      if (!userId) return;
      void saveCachedMeals(userId, nextMeals, fetchedAt);
    },
    [userId],
  );

  const invalidateMeals = useCallback(() => {
    dirtyRef.current = true;
    fetchedAtRef.current = 0;
  }, []);

  const removeMealLocally = useCallback(
    (id: string) => {
      setMeals((prev) => {
        const next = prev.filter((m) => m.id !== id);
        persistMeals(next, fetchedAtRef.current);
        return next;
      });
    },
    [persistMeals],
  );

  const restoreMealLocally = useCallback(
    (meal: MealListSummary) => {
      setMeals((prev) => {
        if (prev.some((m) => m.id === meal.id)) return prev;
        const next = [meal, ...prev].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        persistMeals(next, fetchedAtRef.current);
        return next;
      });
    },
    [persistMeals],
  );

  const getMealById = useCallback(
    (id: string) => mealsRef.current.find((meal) => meal.id === id),
    [],
  );

  const loadMeals = useCallback(
    async (options?: LoadOptions) => {
      if (!session || !hydrated) return;

      const force = options?.force ?? false;
      const hasData = mealsRef.current.length > 0;
      const isFresh =
        !dirtyRef.current && hasData && Date.now() - fetchedAtRef.current < STALE_MS;

      if (!force && isFresh) return;

      if (inflightRef.current) {
        await inflightRef.current;
        return;
      }

      const isBackgroundRefresh = force && hasData;

      const run = (async () => {
        if (isBackgroundRefresh) {
          setRefreshing(true);
        } else if (!hasData) {
          setLoading(true);
        }

        try {
          const data = await fetchMeals();
          const fetchedAt = Date.now();
          setMeals(data);
          fetchedAtRef.current = fetchedAt;
          dirtyRef.current = false;
          persistMeals(data, fetchedAt);
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
    [session, hydrated, persistMeals],
  );

  const refreshMeals = useCallback(() => loadMeals({ force: true }), [loadMeals]);

  const value = useMemo(
    () => ({
      meals,
      loading,
      refreshing,
      loadMeals,
      refreshMeals,
      invalidateMeals,
      getMealById,
      removeMealLocally,
      restoreMealLocally,
    }),
    [
      meals,
      loading,
      refreshing,
      loadMeals,
      refreshMeals,
      invalidateMeals,
      getMealById,
      removeMealLocally,
      restoreMealLocally,
    ],
  );

  return <MealsContext.Provider value={value}>{children}</MealsContext.Provider>;
}

export function useMeals() {
  const ctx = useContext(MealsContext);
  if (!ctx) throw new Error("useMeals must be used within MealsProvider");
  return ctx;
}
