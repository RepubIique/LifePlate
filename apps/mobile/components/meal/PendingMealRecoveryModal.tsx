import { useSegments } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Modal, Pressable, StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSnackbar } from "@/components/ui/BottomSnackbar";
import { PremiumCard } from "@/components/PremiumCard";
import { useAuth } from "@/context/AuthContext";
import { mealFlowErrorMessage } from "@/lib/apiErrors";
import {
  clearPendingConfirm,
  clearPendingUpload,
  loadPendingConfirm,
  loadPendingUpload,
  type PendingMealConfirmForm,
  type PendingUpload,
} from "@/lib/mealPendingStorage";
import {
  navigateToMealResult,
  navigateToPendingConfirm,
  retryPendingConfirm,
  retryPendingUpload,
} from "@/lib/mealPendingRetry";
import { useRefreshAfterMealChange } from "@/lib/refreshAfterMealChange";
import { spacing } from "@/src/theme/lifeplate";

type RecoveryKind = "confirm" | "upload-photo" | "upload-text";

function shouldShowRecovery(segments: string[], hasSession: boolean) {
  if (!hasSession) return false;
  const root = segments[0];
  if (root === "(auth)" || root === "auth" || root === "onboarding") return false;
  return true;
}

function recoveryCopy(kind: RecoveryKind): { title: string; body: string; resumeLabel: string } {
  if (kind === "confirm") {
    return {
      title: "Unfinished meal",
      body: "Your meal wasn't saved yet. Open it to finish logging, or discard it.",
      resumeLabel: "Open meal",
    };
  }
  if (kind === "upload-text") {
    return {
      title: "Unfinished meal",
      body: "You started logging a meal by text. Resume or discard it.",
      resumeLabel: "Resume",
    };
  }
  return {
    title: "Unfinished meal",
    body: "Your photo didn't finish uploading. Resume analysis or discard it.",
    resumeLabel: "Resume",
  };
}

function uploadKind(upload: PendingUpload): RecoveryKind {
  return upload.kind === "text" ? "upload-text" : "upload-photo";
}

export function MealPendingSync() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const refreshAfterMealChange = useRefreshAfterMealChange();
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const syncingRef = useRef(false);

  const runBackgroundConfirmRetry = useCallback(async () => {
    if (!userId || syncingRef.current) return;
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

export function PendingMealRecoveryModal() {
  const { session } = useAuth();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [checked, setChecked] = useState(false);
  const [kind, setKind] = useState<RecoveryKind>("upload-photo");
  const [confirmForm, setConfirmForm] = useState<PendingMealConfirmForm | null>(null);
  const [resuming, setResuming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const shownThisSessionRef = useRef(false);

  const userId = session?.user.id;
  const eligible = shouldShowRecovery(segments, Boolean(session));

  useEffect(() => {
    if (!eligible || !userId) {
      setChecked(false);
      return;
    }
    if (checked || shownThisSessionRef.current) return;

    let cancelled = false;
    void (async () => {
      const pendingConfirm = await loadPendingConfirm(userId);
      if (cancelled) return;

      if (pendingConfirm) {
        setKind("confirm");
        setConfirmForm(pendingConfirm.form);
        setVisible(true);
        shownThisSessionRef.current = true;
        setChecked(true);
        return;
      }

      const pendingUpload = await loadPendingUpload(userId);
      if (cancelled) return;
      if (pendingUpload) {
        setKind(uploadKind(pendingUpload));
        setConfirmForm(null);
        setVisible(true);
        shownThisSessionRef.current = true;
      }
      setChecked(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [checked, eligible, userId]);

  async function handleDiscard() {
    if (!userId) return;
    if (kind === "confirm") {
      await clearPendingConfirm(userId);
    } else {
      await clearPendingUpload(userId);
    }
    setVisible(false);
    setError(null);
  }

  async function handleResume() {
    if (!userId) return;
    setResuming(true);
    setError(null);
    try {
      if (kind === "confirm" && confirmForm) {
        setVisible(false);
        navigateToPendingConfirm(confirmForm);
        return;
      }

      const result = await retryPendingUpload(userId);
      if (!result) {
        setError("Couldn't find your unfinished meal.");
        return;
      }
      setVisible(false);
      navigateToMealResult(result.analysis, {
        logDateKey: result.logDateKey,
        localImageUri: result.localImageUri,
        isTextLog: result.isTextLog,
      });
    } catch (err) {
      setError(mealFlowErrorMessage(err, kind === "upload-text" ? "analyze-text" : "upload"));
    } finally {
      setResuming(false);
    }
  }

  if (!visible) return null;

  const copy = recoveryCopy(kind);

  return (
    <>
      <Modal visible transparent animationType="fade" onRequestClose={() => void handleDiscard()}>
        <Pressable style={styles.backdrop} onPress={() => void handleDiscard()}>
          <Pressable
            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}
            onPress={(e) => e.stopPropagation()}
          >
            <PremiumCard noBlur style={styles.card}>
              <Text variant="titleLarge" style={styles.title}>
                {copy.title}
              </Text>
              <Text variant="bodyMedium" style={styles.body}>
                {copy.body}
              </Text>
              {error ? (
                <Text variant="bodySmall" style={styles.error}>
                  {error}
                </Text>
              ) : null}
              <View style={styles.actions}>
                <Button mode="contained" onPress={() => void handleResume()} loading={resuming}>
                  {copy.resumeLabel}
                </Button>
                <Button mode="outlined" onPress={() => void handleDiscard()} disabled={resuming}>
                  Discard
                </Button>
              </View>
            </PremiumCard>
          </Pressable>
        </Pressable>
      </Modal>
      <BottomSnackbar visible={!!error} onDismiss={() => setError(null)} duration={6000}>
        {error}
      </BottomSnackbar>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    paddingHorizontal: spacing.lg,
  },
  card: {
    gap: spacing.md,
  },
  title: {
    letterSpacing: 0.2,
  },
  body: {
    opacity: 0.75,
    lineHeight: 22,
  },
  error: {
    color: "#B00020",
    lineHeight: 18,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
});
