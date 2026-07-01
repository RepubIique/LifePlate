import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Button, Chip, Text, TextInput } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { MealType, PlanSuggestion } from "@lifeplate/shared";
import { formatPlanDateLabel } from "@lifeplate/shared";
import { PlanDatePickerModal } from "@/components/plan/PlanDatePickerModal";
import { MEAL_SLOTS } from "@/lib/mealSlots";
import { createModalStyles } from "@/lib/modalStyles";
import { useThemedStyles } from "@/lib/useThemedStyles";
import { spacing } from "@/src/theme/lifeplate";
type Props = {
  visible: boolean;
  logDateKey: string;
  mealName: string;
  mealType: MealType;
  notes: string;
  loading?: boolean;
  activeSuggestion?: PlanSuggestion | null;
  onChangeLogDateKey: (dateKey: string) => void;
  onChangeMealName: (value: string) => void;
  onChangeMealType: (value: MealType) => void;
  onChangeNotes: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
};

export function PencilMealModal({
  visible,
  logDateKey,
  mealName,
  mealType,
  notes,
  loading = false,
  activeSuggestion,
  onChangeLogDateKey,
  onChangeMealName,
  onChangeMealType,
  onChangeNotes,
  onSubmit,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();
  const modalStyles = useThemedStyles(createModalStyles);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const styles = useThemedStyles(() =>
    StyleSheet.create({
      sheetContent: {
        gap: spacing.sm,
      },
      title: {
        letterSpacing: 0.15,
      },
      subtitle: {
        opacity: 0.7,
        lineHeight: 22,
      },
      fieldLabel: {
        opacity: 0.6,
        marginTop: spacing.xs,
      },
      slotRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.xs,
      },
      actions: {
        gap: spacing.xs,
        marginTop: spacing.sm,
      },
    }),
  );

  const canSubmit = mealName.trim().length > 0 && !loading;

  const suggestionChip = useMemo(() => {
    if (!activeSuggestion) return null;
    return (
      <Chip
        icon="lightbulb-outline"
        onPress={() => onChangeNotes(activeSuggestion.noteHint)}
        style={{ alignSelf: "flex-start" }}
      >
        {activeSuggestion.noteHint}
      </Chip>
    );
  }, [activeSuggestion, onChangeNotes]);

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <KeyboardAvoidingView
          style={modalStyles.keyboardRoot}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <Pressable style={modalStyles.backdrop} onPress={onClose}>
            <Pressable
              style={[
                modalStyles.sheet,
                { paddingBottom: Math.max(insets.bottom, spacing.lg) },
              ]}
              onPress={(e) => e.stopPropagation()}
            >
              <ScrollView keyboardShouldPersistTaps="handled">
                <View style={styles.sheetContent}>
                  <Text variant="titleMedium" style={styles.title}>
                    Pencil in a meal
                  </Text>
                  <Text variant="bodyMedium" style={styles.subtitle}>
                    Plan ahead — it stays faded until you confirm you ate it.
                  </Text>

                  <Text variant="labelLarge" style={styles.fieldLabel}>
                    Day
                  </Text>
                  <Button mode="outlined" onPress={() => setDatePickerOpen(true)}>
                    {formatPlanDateLabel(logDateKey)}
                  </Button>

                  <Text variant="labelLarge" style={styles.fieldLabel}>
                    Dish name
                  </Text>
                  <TextInput
                    mode="outlined"
                    value={mealName}
                    onChangeText={onChangeMealName}
                    placeholder="e.g. Chicken tacos"
                    autoCapitalize="sentences"
                  />

                  <Text variant="labelLarge" style={styles.fieldLabel}>
                    Meal slot
                  </Text>
                  <View style={styles.slotRow}>
                    {MEAL_SLOTS.map((slot) => (
                      <Chip
                        key={slot.key}
                        selected={mealType === slot.key}
                        onPress={() => onChangeMealType(slot.key)}
                      >
                        {slot.label}
                      </Chip>
                    ))}
                  </View>

                  <Text variant="labelLarge" style={styles.fieldLabel}>
                    Note (optional)
                  </Text>
                  {suggestionChip}
                  <TextInput
                    mode="outlined"
                    value={notes}
                    onChangeText={onChangeNotes}
                    placeholder="Prep tips, who you're cooking for..."
                    multiline
                  />

                  <View style={styles.actions}>
                    <Button mode="contained" onPress={onSubmit} loading={loading} disabled={!canSubmit}>
                      Pencil it in
                    </Button>
                    <Button mode="text" onPress={onClose}>
                      Cancel
                    </Button>
                  </View>
                </View>
              </ScrollView>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      <PlanDatePickerModal
        visible={datePickerOpen}
        selectedDateKey={logDateKey}
        onSelect={onChangeLogDateKey}
        onClose={() => setDatePickerOpen(false)}
      />
    </>
  );
}
