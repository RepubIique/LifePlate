import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import type { PlanSuggestion } from "@lifeplate/shared";
import { PremiumCard } from "@/components/PremiumCard";
import { useAppColors } from "@/context/ThemeContext";
import { useThemedStyles } from "@/lib/useThemedStyles";
import { spacing } from "@/src/theme/lifeplate";

type Props = {
  suggestions: PlanSuggestion[];
  onSelectSuggestion?: (suggestion: PlanSuggestion) => void;
};

export function PlanSuggestionsCard({ suggestions, onSelectSuggestion }: Props) {
  const { semantic, ui } = useAppColors();
  const styles = useThemedStyles((colors) =>
    StyleSheet.create({
      card: {
        marginHorizontal: spacing.lg,
        marginBottom: spacing.md,
        gap: spacing.sm,
      },
      titleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
      },
      title: {
        color: semantic.primary,
        letterSpacing: 0.15,
        flex: 1,
      },
      item: {
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.sm,
        borderRadius: 12,
        backgroundColor: ui.selectedBackground,
      },
      itemPressed: {
        opacity: 0.9,
      },
      message: {
        lineHeight: 20,
        opacity: 0.85,
      },
      foods: {
        marginTop: 4,
        opacity: 0.55,
        lineHeight: 18,
      },
    }),
  );

  if (suggestions.length === 0) return null;

  return (
    <PremiumCard style={styles.card}>
      <View style={styles.titleRow}>
        <MaterialCommunityIcons name="lightbulb-outline" size={20} color={semantic.primary} />
        <Text variant="titleSmall" style={styles.title}>
          What to try next
        </Text>
      </View>
      {suggestions.map((suggestion) => (
        <Pressable
          key={suggestion.pillar}
          disabled={!onSelectSuggestion}
          onPress={() => onSelectSuggestion?.(suggestion)}
          style={({ pressed }) => [
            styles.item,
            pressed && onSelectSuggestion && styles.itemPressed,
          ]}
        >
          <Text variant="bodyMedium" style={styles.message}>
            {suggestion.message}
          </Text>
          {suggestion.foods.length > 0 ? (
            <Text variant="bodySmall" style={styles.foods}>
              e.g. {suggestion.foods.slice(0, 3).join(", ")}
            </Text>
          ) : null}
        </Pressable>
      ))}
    </PremiumCard>
  );
}
