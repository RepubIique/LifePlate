import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import type { PlusFeatureId } from "@lifeplate/shared";
import { PLUS_FEATURES, PLUS_FREE_TIER_NOTE, PLUS_PLAN } from "@lifeplate/shared";
import { PremiumCard } from "@/components/PremiumCard";
import { useAuth } from "@/context/AuthContext";
import {
  purchasePlus,
  restorePurchases,
  showPlusSyncFailedAlert,
} from "@/lib/subscription";
import { palette, semantic, tints, spacing } from "@/src/theme/lifeplate";

type Props = {
  visible: boolean;
  highlightFeatureId: PlusFeatureId | null;
  onClose: () => void;
};

function PlusFeatureRow({
  icon,
  title,
  description,
  highlighted,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  description: string;
  highlighted: boolean;
}) {
  return (
    <View style={[styles.featureRow, highlighted && styles.featureRowHighlighted]}>
      <View style={styles.featureIconWrap}>
        <MaterialCommunityIcons name={icon} size={20} color={semantic.primary} />
      </View>
      <View style={styles.featureCopy}>
        <Text variant="titleSmall" style={styles.featureTitle}>
          {title}
        </Text>
        <Text variant="bodySmall" style={styles.featureDescription}>
          {description}
        </Text>
      </View>
    </View>
  );
}

export function PlusPaywallModal({ visible, highlightFeatureId, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { refreshProfile, patchProfile } = useAuth();
  const [busy, setBusy] = useState<"purchase" | "restore" | null>(null);

  async function handleSubscribe() {
    setBusy("purchase");
    try {
      const result = await purchasePlus();
      if (result === "cancelled" || result === "unavailable") return;
      if (result === "sync_failed") {
        showPlusSyncFailedAlert();
        return;
      }

      const updated = await refreshProfile();
      if (updated?.isPaid) {
        patchProfile(updated);
        onClose();
        return;
      }

      Alert.alert(
        "Plus not active yet",
        "Your purchase went through, but Plus isn't active on your account yet. Try Restore purchases or check back in a moment.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function handleRestore() {
    setBusy("restore");
    try {
      const { profile: updated, syncFailed } = await restorePurchases(refreshProfile);
      if (syncFailed) {
        showPlusSyncFailedAlert();
      }
      if (updated?.isPaid) {
        patchProfile(updated);
        onClose();
        return;
      }
      if (!syncFailed) {
        Alert.alert(
          "No subscription found",
          "We couldn't find an active LifePlate Plus subscription for this account.",
        );
      }
    } finally {
      setBusy(null);
    }
  }

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}
          onPress={(event) => event.stopPropagation()}
        >
          <PremiumCard noBlur style={styles.card}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <View style={styles.hero}>
                <Image
                  source={require("@/assets/images/logo.png")}
                  style={styles.logo}
                  resizeMode="contain"
                />
                <View style={styles.heroCopy}>
                  <Text variant="headlineSmall" style={styles.title}>
                    {PLUS_PLAN.name}
                  </Text>
                  <Text variant="bodyMedium" style={styles.tagline}>
                    {PLUS_PLAN.tagline}
                  </Text>
                </View>
              </View>

              <View style={styles.featureList}>
                {PLUS_FEATURES.map((feature) => (
                  <PlusFeatureRow
                    key={feature.id}
                    icon={feature.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                    title={feature.title}
                    description={feature.description}
                    highlighted={highlightFeatureId === feature.id}
                  />
                ))}
              </View>

              <Text variant="bodySmall" style={styles.freeTierNote}>
                {PLUS_FREE_TIER_NOTE}
              </Text>

              <View style={styles.pricing}>
                <Text variant="titleMedium" style={styles.priceLabel}>
                  {PLUS_PLAN.priceLabel}
                </Text>
                <Text variant="bodySmall" style={styles.priceNote}>
                  {PLUS_PLAN.priceNote}
                </Text>
              </View>
            </ScrollView>

            <Button
              mode="contained"
              onPress={handleSubscribe}
              loading={busy === "purchase"}
              disabled={busy != null}
              style={styles.cta}
            >
              Subscribe
            </Button>
            <Button
              mode="text"
              onPress={handleRestore}
              loading={busy === "restore"}
              disabled={busy != null}
            >
              Restore purchases
            </Button>
            <Button mode="text" onPress={onClose} disabled={busy != null}>
              Not now
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
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: palette.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "92%",
  },
  card: {
    gap: spacing.md,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  scrollContent: {
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  logo: {
    width: 56,
    height: 56,
  },
  heroCopy: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: semantic.primary,
    letterSpacing: 0.15,
  },
  tagline: {
    color: semantic.textMuted,
    lineHeight: 20,
  },
  featureList: {
    gap: spacing.sm,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    padding: spacing.sm,
    borderRadius: 12,
  },
  featureRowHighlighted: {
    backgroundColor: tints.tealLight,
  },
  featureIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: tints.tealLight,
    alignItems: "center",
    justifyContent: "center",
  },
  featureCopy: {
    flex: 1,
    gap: 2,
  },
  featureTitle: {
    color: semantic.primary,
  },
  featureDescription: {
    color: semantic.textMuted,
    lineHeight: 18,
  },
  freeTierNote: {
    color: semantic.textMuted,
    lineHeight: 18,
  },
  pricing: {
    gap: 2,
    paddingTop: spacing.xs,
  },
  priceLabel: {
    color: semantic.primary,
  },
  priceNote: {
    color: semantic.textMuted,
    lineHeight: 18,
  },
  cta: {
    marginTop: spacing.xs,
  },
});
