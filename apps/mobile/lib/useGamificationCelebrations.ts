import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MilestoneId } from "@lifeplate/shared";
import { computeEligibleMilestones, milestoneMessage } from "@lifeplate/shared";
import { useAuth } from "@/context/AuthContext";
import { milestoneEligibilityKey } from "@/lib/computeLocalGamificationStats";
import { loadSeenMilestones, saveSeenMilestones } from "@/lib/milestonePrefs";
import { pickMilestoneToCelebrate } from "@/lib/pickMilestoneToCelebrate";
import { useGamificationStatsInput } from "@/lib/useGamificationStatsInput";

const STATS_SETTLE_MS = 2000;

export function useGamificationCelebrations(enabled = true) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const statsInput = useGamificationStatsInput();
  const [celebration, setCelebration] = useState<{ id: MilestoneId; message: string } | null>(
    null,
  );
  const checkingRef = useRef(false);
  const hasCheckedThisSessionRef = useRef(false);
  const seenMilestonesRef = useRef<Set<MilestoneId>>(new Set());
  const seenLoadedRef = useRef(false);

  const eligibilityKey = useMemo(
    () => (statsInput ? milestoneEligibilityKey(statsInput) : null),
    [statsInput],
  );

  useEffect(() => {
    hasCheckedThisSessionRef.current = false;
    seenLoadedRef.current = false;
    seenMilestonesRef.current = new Set();

    if (!userId) return;

    let cancelled = false;
    void (async () => {
      const seen = await loadSeenMilestones(userId);
      if (cancelled) return;
      seenMilestonesRef.current = seen;
      seenLoadedRef.current = true;
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const checkCelebrations = useCallback(async () => {
    if (
      !enabled ||
      !userId ||
      !statsInput ||
      checkingRef.current ||
      hasCheckedThisSessionRef.current
    ) {
      return;
    }

    checkingRef.current = true;
    hasCheckedThisSessionRef.current = true;

    try {
      if (!seenLoadedRef.current) {
        seenMilestonesRef.current = await loadSeenMilestones(userId);
        seenLoadedRef.current = true;
      }

      const pick = pickMilestoneToCelebrate(
        computeEligibleMilestones(statsInput),
        seenMilestonesRef.current,
      );
      if (!pick) return;

      for (const id of pick.markSeen) {
        seenMilestonesRef.current.add(id);
      }
      await saveSeenMilestones(userId, seenMilestonesRef.current);

      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCelebration({ id: pick.celebrate, message: milestoneMessage(pick.celebrate) });
    } finally {
      checkingRef.current = false;
    }
  }, [enabled, userId, statsInput]);

  const dismissCelebration = useCallback(() => setCelebration(null), []);

  useEffect(() => {
    if (!eligibilityKey || !userId || hasCheckedThisSessionRef.current) return;

    const timer = setTimeout(() => {
      void checkCelebrations();
    }, STATS_SETTLE_MS);

    return () => clearTimeout(timer);
  }, [eligibilityKey, userId, checkCelebrations]);

  return { celebration, dismissCelebration, checkCelebrations };
}
