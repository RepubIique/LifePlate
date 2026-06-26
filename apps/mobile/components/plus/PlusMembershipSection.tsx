import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { PLUS_FEATURES, PLUS_PLAN } from "@lifeplate/shared";
import { PremiumCard } from "@/components/PremiumCard";
import { useAppColors } from "@/context/ThemeContext";
import { usePlusPaywall } from "@/context/PlusPaywallContext";
import { useThemedStyles } from "@/lib/useThemedStyles";
import { spacing } from "@/src/theme/lifeplate";
import type { AppColors } from "@/src/theme/lifeplate";

type Props = {
  isPaid: boolean;
};

function createStyles({ semantic, tints }: AppColors) {
  return StyleSheet.create({
    card: {
      gap: spacing.md,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: tints.tealLight,
      alignItems: "center",
      justifyContent: "center",
    },
    copy: {
      flex: 1,
      gap: 2,
    },
    title: {
      color: semantic.primary,
    },
    subtitle: {
      color: semantic.textMuted,
      lineHeight: 18,
    },
    bullets: {
      gap: spacing.sm,
      paddingLeft: spacing.xs,
    },
    bulletRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    bulletText: {
      color: semantic.textMuted,
      flex: 1,
    },
    button: {
      alignSelf: "flex-start",
    },
  });
}

export function PlusMembershipSection({ isPaid }: Props) {
  const styles = useThemedStyles(createStyles);
  const { semantic } = useAppColors();
  const { openPaywall } = usePlusPaywall();

  if (isPaid) {
    return (
      <PremiumCard style={styles.card} noBlur>
        <View style={styles.headerRow}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons name="star-circle-outline" size={22} color={semantic.primary} />
          </View>
          <View style={styles.copy}>
            <Text variant="titleMedium" style={styles.title}>
              LifePlate Plus
            </Text>
            <Text variant="bodySmall" style={styles.subtitle}>
              Unlimited logging, cloud photo backup, and the Digital Plate widget are active.
            </Text>
          </View>
        </View>
      </PremiumCard>
    );
  }

  return (
    <PremiumCard style={styles.card} noBlur>
      <View style={styles.headerRow}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name="star-circle-outline" size={22} color={semantic.primary} />
        </View>
        <View style={styles.copy}>
          <Text variant="titleMedium" style={styles.title}>
            {PLUS_PLAN.name}
          </Text>
          <Text variant="bodySmall" style={styles.subtitle}>
            {PLUS_PLAN.tagline}
          </Text>
        </View>
      </View>

      <View style={styles.bullets}>
        {PLUS_FEATURES.map((feature) => (
          <View key={feature.id} style={styles.bulletRow}>
            <MaterialCommunityIcons
              name={feature.icon as keyof typeof MaterialCommunityIcons.glyphMap}
              size={16}
              color={semantic.primary}
            />
            <Text variant="bodySmall" style={styles.bulletText}>
              {feature.title}
            </Text>
          </View>
        ))}
      </View>

      <Button mode="contained" onPress={() => openPaywall()} style={styles.button}>
        See Plus
      </Button>
    </PremiumCard>
  );
}
