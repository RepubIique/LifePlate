import { useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePlusPaywall } from "@/context/PlusPaywallContext";

export function useLoggingAccess() {
  const { profile } = useAuth();
  const { openPaywall } = usePlusPaywall();

  const loggingLocked = profile?.loggingLocked ?? false;
  const canLog = !loggingLocked;
  const daysRemaining = profile?.freeLoggingDaysRemaining ?? 0;

  const requireLoggingAccess = useCallback(
    (featureId: "unlimited_logging" = "unlimited_logging") => {
      if (canLog) return true;
      openPaywall(featureId);
      return false;
    },
    [canLog, openPaywall],
  );

  return {
    canLog,
    loggingLocked,
    daysRemaining,
    requireLoggingAccess,
  };
}
