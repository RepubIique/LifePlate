import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { PremiumCard } from "@/components/PremiumCard";
import { MEAL_SLOTS, type MealSlotKey } from "@/lib/mealSlots";
import { spacing } from "@/src/theme/lifeplate";

type Props = {
  slot: MealSlotKey;
  onPress?: () => void;
};

export function SuggestedMealSlotCard({ slot, onPress }: Props) {
  const slotMeta = MEAL_SLOTS.find((entry) => entry.key === slot) ?? MEAL_SLOTS[0]!;

  return (
    <PremiumCard style={styles.card} noBlur>
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        style={({ pressed }) => [styles.inner, pressed && onPress && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`Log ${slotMeta.label.toLowerCase()}`}
      >
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name={slotMeta.icon} size={24} color="#1B4332" />
        </View>
        <View style={styles.copy}>
          <Text variant="labelMedium" style={styles.eyebrow}>
            Next up
          </Text>
          <Text variant="titleMedium" style={styles.title}>
            {slotMeta.label}
          </Text>
          <Text variant="bodySmall" style={styles.subtitle}>
            Tap to log what you&apos;re having
          </Text>
        </View>
        {onPress ? (
          <MaterialCommunityIcons name="chevron-right" size={22} color="#40916C" />
        ) : null}
      </Pressable>
    </PremiumCard>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: 0,
    overflow: "hidden",
    backgroundColor: "#F0F7F4",
    borderColor: "#40916C",
    borderWidth: 1.5,
    marginBottom: spacing.md,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm,
  },
  pressed: {
    opacity: 0.92,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#D8F3DC",
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  eyebrow: {
    color: "#40916C",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  title: {
    color: "#1B4332",
    letterSpacing: 0.1,
  },
  subtitle: {
    opacity: 0.65,
    lineHeight: 18,
  },
});
