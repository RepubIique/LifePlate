import { useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Modal, Pressable, StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PremiumCard } from "@/components/PremiumCard";
import { useAuth } from "@/context/AuthContext";
import { getHasSeenAlphaWelcome, setHasSeenAlphaWelcome } from "@/lib/alphaWelcomePrefs";
import { palette, semantic, tints, ui, spacing } from "@/src/theme/lifeplate";

function shouldShowWelcome(segments: string[], hasSession: boolean) {
  if (!hasSession) return false;
  const root = segments[0];
  if (root === "(auth)" || root === "auth" || root === "onboarding") return false;
  return true;
}

export function AlphaWelcomeModal() {
  const { session } = useAuth();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [checked, setChecked] = useState(false);

  const eligible = shouldShowWelcome(segments, Boolean(session));

  useEffect(() => {
    if (!eligible) {
      setChecked(false);
      return;
    }
    if (checked) return;

    let cancelled = false;
    void (async () => {
      const seen = await getHasSeenAlphaWelcome();
      if (cancelled) return;
      setChecked(true);
      if (!seen) setVisible(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [checked, eligible]);

  async function dismiss() {
    setVisible(false);
    await setHasSeenAlphaWelcome();
  }

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => void dismiss()}>
      <Pressable style={styles.backdrop} onPress={() => void dismiss()}>
        <Pressable style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]} onPress={(e) => e.stopPropagation()}>
          <PremiumCard noBlur style={styles.card}>
            <View style={styles.hero}>
              <Image
                source={require("@/assets/images/logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text variant="headlineSmall" style={styles.title}>
                Welcome to the alpha
              </Text>
            </View>

            <Text variant="bodyLarge" style={styles.body}>
              We&apos;re so glad you joined us. You&apos;re among the first people helping shape
              LifePlate — thank you for being here.
            </Text>
            <Text variant="bodyMedium" style={styles.bodyMuted}>
              Things may change quickly, and you might hit the occasional rough edge. That&apos;s
              expected at this stage. Your feedback genuinely helps us improve.
            </Text>
            <Text variant="bodyMedium" style={styles.bodyMuted}>
              Tap the chat bubble anytime to share thoughts with other alpha testers.
            </Text>

            <Button mode="contained" onPress={() => void dismiss()} style={styles.cta}>
              Let&apos;s go
            </Button>
          </PremiumCard>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(45, 52, 54, 0.45)",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  sheet: {
    width: "100%",
  },
  card: {
    gap: spacing.md,
    alignItems: "stretch",
  },
  hero: {
    alignItems: "center",
    gap: spacing.sm,
  },
  logo: {
    width: 72,
    height: 72,
  },
  title: {
    letterSpacing: 0.2,
    color: semantic.primary,
    textAlign: "center",
  },
  body: {
    lineHeight: 24,
    textAlign: "center",
  },
  bodyMuted: {
    opacity: 0.72,
    lineHeight: 22,
    textAlign: "center",
  },
  cta: {
    marginTop: spacing.xs,
  },
});
