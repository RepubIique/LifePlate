import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Platform, StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { PremiumCard } from "@/components/PremiumCard";
import { usePlusPaywall } from "@/context/PlusPaywallContext";
import { semantic, tints, ui, spacing } from "@/src/theme/lifeplate";

type Props = {
  isPaid: boolean;
};

export function WidgetSetupSection({ isPaid }: Props) {
  const { openPaywall } = usePlusPaywall();
  const isIos = Platform.OS === "ios";

  if (!isIos) {
    return (
      <PremiumCard style={styles.card} noBlur>
        <View style={styles.headerRow}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons name="view-grid-outline" size={22} color={semantic.primary} />
          </View>
          <View style={styles.copy}>
            <Text variant="titleMedium" style={styles.title}>
              Digital Plate widget
            </Text>
            <Text variant="bodySmall" style={styles.subtitle}>
              Home screen widgets are available on iOS. Android support is coming later.
            </Text>
          </View>
        </View>
      </PremiumCard>
    );
  }

  if (!isPaid) {
    return (
      <PremiumCard style={styles.card} noBlur>
        <View style={styles.headerRow}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons name="view-grid-outline" size={22} color={semantic.primary} />
          </View>
          <View style={styles.copy}>
            <Text variant="titleMedium" style={styles.title}>
              Digital Plate widget
            </Text>
            <Text variant="bodySmall" style={styles.subtitle}>
              Pin today&apos;s plate to your home screen with LifePlate Plus.
            </Text>
          </View>
        </View>
        <Button mode="contained" onPress={() => openPaywall("digital_plate_widget")}>
          Unlock with Plus
        </Button>
      </PremiumCard>
    );
  }

  return (
    <PremiumCard style={styles.card} noBlur>
      <View style={styles.headerRow}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name="view-grid-outline" size={22} color={semantic.primary} />
        </View>
        <View style={styles.copy}>
          <Text variant="titleMedium" style={styles.title}>
            Digital Plate widget
          </Text>
          <Text variant="bodySmall" style={styles.subtitle}>
            Your home screen widget updates whenever you log meals in the app.
          </Text>
        </View>
      </View>

      <View style={styles.steps}>
        <Text variant="labelLarge" style={styles.stepsTitle}>
          Add to Home Screen
        </Text>
        <Text variant="bodySmall" style={styles.step}>
          1. Long-press your home screen, then tap the + button.
        </Text>
        <Text variant="bodySmall" style={styles.step}>
          2. Search for LifePlate and choose Digital Plate.
        </Text>
        <Text variant="bodySmall" style={styles.step}>
          3. Add the medium Digital Plate widget to your home screen.
        </Text>
      </View>
    </PremiumCard>
  );
}

const styles = StyleSheet.create({
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
  steps: {
    gap: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: ui.borderSubtle,
  },
  stepsTitle: {
    color: semantic.primary,
    marginBottom: 2,
  },
  step: {
    color: semantic.textMuted,
    lineHeight: 18,
  },
});
