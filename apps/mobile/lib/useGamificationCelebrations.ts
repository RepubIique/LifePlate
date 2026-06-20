import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MilestoneId } from "@lifeplate/shared";
import { computeEligibleMilestones, milestoneMessage } from "@lifeplate/shared";
import { useAuth } from "@/context/AuthContext";
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

  const checkCelebrations = useCallback(async () => {
    if (!enabled || !userId || !statsInput || checkingRef.current) return;
    checkingRef.current = true;
    try {
      const seen = await loadSeenMilestones(userId);
      const eligible = computeEligibleMilestones(statsInput);
      const next = eligible.find((id) => !seen.has(id));
      if (!next) return;

      await markMilestoneSeen(userId, next);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCelebration({ id: next, message: milestoneMessage(next) });
    } finally {
      checkingRef.current = false;
    }
  }, [enabled, userId, statsInput]);

  const dismissCelebration = useCallback(() => setCelebration(null), []);

  useEffect(() => {
    if (!statsInput) return;
    void checkCelebrations();
  }, [
    statsInput?.currentStreak,
    statsInput?.mealsLogged,
    statsInput?.sharesSentCount,
    statsInput?.hydrationGoalDaysLast7,
    checkCelebrations,
    statsInput,
  ]);

  return { celebration, dismissCelebration, checkCelebrations };
}
