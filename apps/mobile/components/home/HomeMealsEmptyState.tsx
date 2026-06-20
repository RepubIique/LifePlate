import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { PremiumCard } from "@/components/PremiumCard";
import { palette, semantic, tints, ui, spacing } from "@/src/theme/lifeplate";

type Props = {
  title: string;
  subtitle: string;
  onLogPhoto?: () => void;
  onLogText?: () => void;
};

export function HomeMealsEmptyState({ title, subtitle, onLogPhoto, onLogText }: Props) {
  return (
    <PremiumCard style={styles.card} noBlur>
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons name="silverware-fork-knife" size={28} color={semantic.primary} />
      </View>
      <Text variant="titleMedium" style={styles.title}>
        {title}
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        {subtitle}
      </Text>
      {onLogPhoto || onLogText ? (
        <View style={styles.actions}>
          {onLogPhoto ? (
            <Button mode="contained" icon="camera" onPress={onLogPhoto}>
              Log a meal
            </Button>
          ) : null}
          {onLogText ? (
            <Button mode="text" icon="text-box-outline" onPress={onLogText}>
              Log without photo
            </Button>
          ) : null}
        </View>
      ) : null}
    </PremiumCard>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    backgroundColor: ui.cardBackground,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: ui.selectedBackground,
    alignItems: "center",
    justifyContent: "center",
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
  actions: {
    width: "100%",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
});
