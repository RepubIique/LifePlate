import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MilestoneId } from "@lifeplate/shared";
import { computeEligibleMilestones, milestoneMessage } from "@lifeplate/shared";
import { useAuth } from "@/context/AuthContext";
import { milestoneEligibilityKey } from "@/lib/computeLocalGamificationStats";
import { loadSeenMilestones, markMilestoneSeen } from "@/lib/milestonePrefs";
import { useGamificationStatsInput } from "@/lib/useGamificationStatsInput";

export function useGamificationCelebrations(enabled = true) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const statsInput = useGamificationStatsInput();
  const [celebration, setCelebration] = useState<{ id: MilestoneId; message: string } | null>(
    null,
  );
  const checkingRef = useRef(false);
  const shownThisSessionRef = useRef<Set<MilestoneId>>(new Set());

  const eligibilityKey = useMemo(
    () => (statsInput ? milestoneEligibilityKey(statsInput) : null),
    [statsInput],
  );

  useEffect(() => {
    shownThisSessionRef.current = new Set();
  }, [userId]);

  const checkCelebrations = useCallback(async () => {
    if (!enabled || !userId || !statsInput || checkingRef.current) return;
    checkingRef.current = true;
    try {
      const seen = await loadSeenMilestones(userId);
      const eligible = computeEligibleMilestones(statsInput);
      const next = eligible.find(
        (id) => !seen.has(id) && !shownThisSessionRef.current.has(id),
      );
      if (!next) return;

      shownThisSessionRef.current.add(next);
      await markMilestoneSeen(userId, next);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCelebration({ id: next, message: milestoneMessage(next) });
    } finally {
      checkingRef.current = false;
    }
  }, [enabled, userId, statsInput]);

  const dismissCelebration = useCallback(() => setCelebration(null), []);

  useEffect(() => {
    if (!eligibilityKey) return;
    void checkCelebrations();
  }, [eligibilityKey, checkCelebrations]);

  return { celebration, dismissCelebration, checkCelebrations };
}
