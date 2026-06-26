import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { PremiumCard } from "@/components/PremiumCard";
import { useAppColors } from "@/context/ThemeContext";
import { useThemedStyles } from "@/lib/useThemedStyles";
import { spacing } from "@/src/theme/lifeplate";
import type { AppColors } from "@/src/theme/lifeplate";

function createStyles({ semantic, ui }: AppColors) {
  return StyleSheet.create({
    card: {
      alignItems: "center",
      gap: spacing.sm,
      paddingVertical: spacing.xl,
      backgroundColor: ui.cardBackground,
      marginTop: spacing.md,
    },
    iconWrap: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: ui.selectedBackground,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.xs,
    },
    title: {
      textAlign: "center",
      color: semantic.primary,
      letterSpacing: 0.15,
    },
    subtitle: {
      textAlign: "center",
      opacity: 0.65,
      lineHeight: 22,
      paddingHorizontal: spacing.sm,
    },
  });
}

export function TimelineEmptyState() {
  const styles = useThemedStyles(createStyles);
  const { semantic } = useAppColors();

  return (
    <PremiumCard style={styles.card} noBlur>
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons name="timeline-clock-outline" size={32} color={semantic.primary} />
      </View>
      <Text variant="titleMedium" style={styles.title}>
        Your health story starts here
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Every meal you log builds a chronological record of what you&apos;re feeding your future.
      </Text>
    </PremiumCard>
  );
}
