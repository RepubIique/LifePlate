import { Modal, Pressable, ScrollView, StyleSheet } from "react-native";
import { Button, Text } from "react-native-paper";
import { GOALS, type UserGoal } from "@lifeplate/shared";
import { PremiumCard } from "@/components/PremiumCard";
import { createModalStyles } from "@/lib/modalStyles";
import { useThemedStyles } from "@/lib/useThemedStyles";
import type { AppColors } from "@/src/theme/lifeplate";
import { spacing } from "@/src/theme/lifeplate";

type Props = {
  visible: boolean;
  selected: string;
  onSelect: (goal: UserGoal) => void;
  onClose: () => void;
};

function createLocalStyles({ semantic, ui }: AppColors) {
  return StyleSheet.create({
    sheet: {
      paddingBottom: spacing.xl,
      gap: spacing.sm,
    },
    title: {
      letterSpacing: 0.15,
    },
    list: {
      maxHeight: 420,
    },
    option: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.xs,
    },
    optionSelected: {
      borderColor: semantic.primary,
      backgroundColor: ui.cardBackground,
    },
    optionTextSelected: {
      color: semantic.primary,
    },
  });
}

export function GoalPickerModal({ visible, selected, onSelect, onClose }: Props) {
  const modalStyles = useThemedStyles(createModalStyles);
  const styles = useThemedStyles(createLocalStyles);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={modalStyles.backdrop} onPress={onClose}>
        <Pressable
          style={[modalStyles.sheet, styles.sheet]}
          onPress={(e) => e.stopPropagation()}
        >
          <Text variant="titleMedium" style={styles.title}>
            What is your goal?
          </Text>
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {GOALS.map((goal) => {
              const isSelected = goal === selected;
              return (
                <Pressable
                  key={goal}
                  onPress={() => {
                    onSelect(goal);
                    onClose();
                  }}
                >
                  <PremiumCard
                    noBlur
                    style={[styles.option, isSelected && styles.optionSelected]}
                  >
                    <Text
                      variant="bodyLarge"
                      style={isSelected ? styles.optionTextSelected : undefined}
                    >
                      {goal}
                    </Text>
                  </PremiumCard>
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
