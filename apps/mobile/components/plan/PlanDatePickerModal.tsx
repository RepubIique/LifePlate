import { useMemo } from "react";
import { Modal, Pressable, ScrollView, StyleSheet } from "react-native";
import { Button, Text } from "react-native-paper";
import { formatPlanDateLabel, upcomingPlanDateKeys } from "@lifeplate/shared";
import { createModalStyles } from "@/lib/modalStyles";
import { useThemedStyles } from "@/lib/useThemedStyles";
import { spacing } from "@/src/theme/lifeplate";

type Props = {
  visible: boolean;
  selectedDateKey: string;
  onSelect: (dateKey: string) => void;
  onClose: () => void;
};

export function PlanDatePickerModal({
  visible,
  selectedDateKey,
  onSelect,
  onClose,
}: Props) {
  const modalStyles = useThemedStyles(createModalStyles);
  const styles = useThemedStyles((colors) =>
    StyleSheet.create({
      sheetExtra: {
        paddingBottom: spacing.xl,
        maxHeight: "70%",
        gap: spacing.sm,
      },
      title: {
        letterSpacing: 0.15,
      },
      list: {
        maxHeight: 360,
      },
      option: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.sm,
        borderRadius: 12,
      },
      optionSelected: {
        backgroundColor: colors.ui.selectedBackground,
      },
      optionText: {
        letterSpacing: 0.1,
      },
      optionTextSelected: {
        color: colors.semantic.primary,
        fontWeight: "600",
      },
    }),
  );

  const options = useMemo(() => upcomingPlanDateKeys(), []);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={modalStyles.backdrop} onPress={onClose}>
        <Pressable
          style={[modalStyles.sheet, styles.sheetExtra]}
          onPress={(e) => e.stopPropagation()}
        >
          <Text variant="titleMedium" style={styles.title}>
            Which day are you planning for?
          </Text>
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {options.map((dateKey) => {
              const selected = dateKey === selectedDateKey;
              return (
                <Pressable
                  key={dateKey}
                  style={[styles.option, selected && styles.optionSelected]}
                  onPress={() => {
                    onSelect(dateKey);
                    onClose();
                  }}
                >
                  <Text
                    variant="bodyLarge"
                    style={[styles.optionText, selected && styles.optionTextSelected]}
                  >
                    {formatPlanDateLabel(dateKey)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <Button mode="text" onPress={onClose}>
            Cancel
          </Button>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
