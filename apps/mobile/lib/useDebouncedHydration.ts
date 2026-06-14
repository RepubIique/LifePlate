import { useCallback, useEffect, useRef, useState } from "react";
import { updateHydration } from "@/lib/api";

const DEFAULT_DEBOUNCE_MS = 500;
const MAX_GLASSES = 24;

type Options = {
  debounceMs?: number;
  onSynced?: () => void;
  onError?: (error: unknown) => void;
};

export function useDebouncedHydration({
  debounceMs = DEFAULT_DEBOUNCE_MS,
  onSynced,
  onError,
}: Options = {}) {
  const [hydrationByDate, setHydrationByDate] = useState<Record<string, number>>({});
  const [syncingDate, setSyncingDate] = useState<string | null>(null);

  const confirmedRef = useRef<Record<string, number>>({});
  const debounceRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const pendingGlassesRef = useRef<Map<string, number>>(new Map());
  const inflightRef = useRef<Set<string>>(new Set());
  const queuedRef = useRef<Map<string, number>>(new Map());

  const onSyncedRef = useRef(onSynced);
  const onErrorRef = useRef(onError);
  onSyncedRef.current = onSynced;
  onErrorRef.current = onError;

  const replaceFromServer = useCallback((map: Record<string, number>) => {
    setHydrationByDate(map);
    confirmedRef.current = { ...map };
  }, []);

  const persistDate = useCallback(async (dateKey: string, glasses: number) => {
    if (inflightRef.current.has(dateKey)) {
      queuedRef.current.set(dateKey, glasses);
      return;
    }

    inflightRef.current.add(dateKey);
    setSyncingDate(dateKey);
    try {
      const { glasses: saved } = await updateHydration(glasses, dateKey);
      confirmedRef.current[dateKey] = saved;
      setHydrationByDate((prev) => ({ ...prev, [dateKey]: saved }));
      onSyncedRef.current?.();
    } catch (error) {
      const rollback = confirmedRef.current[dateKey] ?? 0;
      setHydrationByDate((prev) => ({ ...prev, [dateKey]: rollback }));
      onErrorRef.current?.(error);
    } finally {
      inflightRef.current.delete(dateKey);
      setSyncingDate((current) => (current === dateKey ? null : current));

      const queued = queuedRef.current.get(dateKey);
      if (queued !== undefined) {
        queuedRef.current.delete(dateKey);
        void persistDate(dateKey, queued);
      }
    }
  }, []);

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
      }, debounceMs);

      debounceRef.current.set(dateKey, timer);
    },
    [debounceMs, persistDate],
  );

  const setHydration = useCallback(
    (dateKey: string, nextGlasses: number) => {
      const glasses = Math.max(0, Math.min(MAX_GLASSES, nextGlasses));
      setHydrationByDate((prev) => ({ ...prev, [dateKey]: glasses }));
      schedulePersist(dateKey, glasses);
    },
    [schedulePersist],
  );

  const adjustHydration = useCallback(
    (dateKey: string, delta: number) => {
      setHydrationByDate((prev) => {
        const current = prev[dateKey] ?? 0;
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

  return {
    hydrationByDate,
    syncingDate,
    replaceFromServer,
    setHydration,
    adjustHydration,
  };
}
