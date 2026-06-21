import { useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePlusPaywall } from "@/context/PlusPaywallContext";

export function useWidgetAccess() {
  const { profile } = useAuth();
  const { openPaywall } = usePlusPaywall();

  const hasWidgetAccess = profile?.isPaid ?? false;

  const requireWidgetAccess = useCallback(() => {
    if (hasWidgetAccess) return true;
    openPaywall("digital_plate_widget");
    return false;
  }, [hasWidgetAccess, openPaywall]);

  return {
    hasWidgetAccess,
    requireWidgetAccess,
  };
}
