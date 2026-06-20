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
import type { FriendSummary, MealShareRequestSummary } from "@lifeplate/shared";
import { useAuth } from "@/context/AuthContext";
import { fetchFriends } from "@/lib/api";
import { TAB_FOCUS_STALE_MS } from "@/lib/focusStale";
import {
  loadCachedFriends,
  saveCachedFriends,
  type FriendsCachePayload,
} from "@/lib/friendsCache";
import { prefetchMissingFriendAvatars } from "@/lib/friendAvatars";

const STALE_MS = TAB_FOCUS_STALE_MS;

type LoadOptions = {
  force?: boolean;
};

type FriendsContextValue = {
  friendCode: string;
  friends: FriendSummary[];
  pendingShares: MealShareRequestSummary[];
  pendingShareCount: number;
  loading: boolean;
  refreshing: boolean;
  hydrated: boolean;
  loadFriends: (options?: LoadOptions) => Promise<void>;
  refreshFriends: () => Promise<void>;
  invalidateFriends: () => void;
  patchFriends: (patch: Partial<Pick<FriendsCachePayload, "friendCode" | "friends" | "pendingShares">>) => void;
};

const FriendsContext = createContext<FriendsContextValue | null>(null);

export function FriendsProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [friendCode, setFriendCode] = useState("");
  const [friends, setFriends] = useState<FriendSummary[]>([]);
  const [pendingShares, setPendingShares] = useState<MealShareRequestSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const fetchedAtRef = useRef(0);
  const dirtyRef = useRef(false);
  const inflightRef = useRef<Promise<void> | null>(null);
  const snapshotRef = useRef({ friendCode, friends, pendingShares });

  useEffect(() => {
    snapshotRef.current = { friendCode, friends, pendingShares };
  }, [friendCode, friends, pendingShares]);

  useEffect(() => {
    if (!userId) {
      setFriendCode("");
      setFriends([]);
      setPendingShares([]);
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
      const cached = await loadCachedFriends(userId);
      if (cancelled) return;
      if (cached) {
        setFriendCode(cached.friendCode);
        setFriends(cached.friends);
        setPendingShares(cached.pendingShares);
        fetchedAtRef.current = cached.fetchedAt;
        void prefetchMissingFriendAvatars(cached.friends);
      }
      setHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const persistFriends = useCallback(
    (
      next: Pick<FriendsCachePayload, "friendCode" | "friends" | "pendingShares">,
      fetchedAt: number,
    ) => {
      if (!userId) return;
      void saveCachedFriends(userId, next, fetchedAt);
    },
    [userId],
  );

  const applySnapshot = useCallback(
    (next: Pick<FriendsCachePayload, "friendCode" | "friends" | "pendingShares">, fetchedAt: number) => {
      setFriendCode(next.friendCode);
      setFriends(next.friends);
      setPendingShares(next.pendingShares);
      fetchedAtRef.current = fetchedAt;
      dirtyRef.current = false;
      persistFriends(next, fetchedAt);
    },
    [persistFriends],
  );

  const invalidateFriends = useCallback(() => {
    dirtyRef.current = true;
    fetchedAtRef.current = 0;
  }, []);

  const patchFriends = useCallback(
    (patch: Partial<Pick<FriendsCachePayload, "friendCode" | "friends" | "pendingShares">>) => {
      const current = snapshotRef.current;
      const next = {
        friendCode: patch.friendCode ?? current.friendCode,
        friends: patch.friends ?? current.friends,
        pendingShares: patch.pendingShares ?? current.pendingShares,
      };
      setFriendCode(next.friendCode);
      setFriends(next.friends);
      setPendingShares(next.pendingShares);
      persistFriends(next, fetchedAtRef.current || Date.now());
    },
    [persistFriends],
  );

  const loadFriends = useCallback(
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
        snapshotRef.current.friendCode.length > 0 ||
        snapshotRef.current.friends.length > 0 ||
        snapshotRef.current.pendingShares.length > 0;
      const isBackgroundRefresh = force && hasData;

      const run = (async () => {
        if (isBackgroundRefresh) {
          setRefreshing(true);
        } else if (!hasData) {
          setLoading(true);
        }

        try {
          const data = await fetchFriends();
          applySnapshot(
            {
              friendCode: data.friendCode,
              friends: data.friends,
              pendingShares: data.pendingShares,
            },
            Date.now(),
          );
          void prefetchMissingFriendAvatars(data.friends);
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

  const refreshFriends = useCallback(() => loadFriends({ force: true }), [loadFriends]);

  useEffect(() => {
    if (!session || !hydrated) return;
    void loadFriends();
  }, [session, hydrated, loadFriends]);

  const value = useMemo(
    () => ({
      friendCode,
      friends,
      pendingShares,
      pendingShareCount: pendingShares.length,
      loading,
      refreshing,
      hydrated,
      loadFriends,
      refreshFriends,
      invalidateFriends,
      patchFriends,
    }),
    [
      friendCode,
      friends,
      pendingShares,
      loading,
      refreshing,
      hydrated,
      loadFriends,
      refreshFriends,
      invalidateFriends,
      patchFriends,
    ],
  );

  return <FriendsContext.Provider value={value}>{children}</FriendsContext.Provider>;
}

export function useFriends() {
  const ctx = useContext(FriendsContext);
  if (!ctx) throw new Error("useFriends must be used within FriendsProvider");
  return ctx;
}
