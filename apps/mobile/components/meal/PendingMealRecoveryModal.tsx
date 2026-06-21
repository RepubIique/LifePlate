import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { BottomSnackbar } from "@/components/ui/BottomSnackbar";
import { useAuth } from "@/context/AuthContext";
import { clearPendingUpload, loadPendingConfirm } from "@/lib/mealPendingStorage";
import { retryPendingConfirm } from "@/lib/mealPendingRetry";
import { useRefreshAfterMealChange } from "@/lib/refreshAfterMealChange";

/** Background retry for failed meal confirms — never blocks the UI. */
export function MealPendingSync() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const refreshAfterMealChange = useRefreshAfterMealChange();
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const syncingRef = useRef(false);
  const clearedStaleUploadRef = useRef<string | null>(null);

  // Drop stale upload queue entries from older app versions — they no longer drive UI.
  useEffect(() => {
    if (!userId || clearedStaleUploadRef.current === userId) return;
    clearedStaleUploadRef.current = userId;
    void clearPendingUpload(userId);
  }, [userId]);

  const runBackgroundConfirmRetry = useCallback(async () => {
    if (!userId || syncingRef.current) return;

    const pending = await loadPendingConfirm(userId);
    if (!pending) return;

    syncingRef.current = true;
    try {
      const result = await retryPendingConfirm(userId);
      if (result.ok) {
        refreshAfterMealChange();
        setSnackbar("Your meal was saved.");
      }
    } finally {
      syncingRef.current = false;
    }
  }, [refreshAfterMealChange, userId]);

  useEffect(() => {
    if (!userId) return;
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void runBackgroundConfirmRetry();
      }
    });
    return () => sub.remove();
  }, [runBackgroundConfirmRetry, userId]);

  return (
    <BottomSnackbar visible={!!snackbar} onDismiss={() => setSnackbar(null)} duration={4000}>
      {snackbar}
    </BottomSnackbar>
  );
}
