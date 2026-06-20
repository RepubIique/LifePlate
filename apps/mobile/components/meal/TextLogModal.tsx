import { Modal, Pressable, StyleSheet, View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";
import { dateKeyFromIso } from "@lifeplate/shared";
import { MealLogDateField } from "@/components/meal/MealLogDateField";
import { spacing } from "@/src/theme/lifeplate";

type Props = {
  visible: boolean;
  description: string;
  logDateKey: string;
  loading?: boolean;
  onChangeDescription: (value: string) => void;
  onChangeLogDateKey: (dateKey: string) => void;
  onSubmit: () => void;
  onClose: () => void;
};

export function TextLogModal({
  visible,
  description,
  logDateKey,
  loading = false,
  onChangeDescription,
  onChangeLogDateKey,
  onSubmit,
  onClose,
}: Props) {
  const canSubmit = description.trim().length > 0 && !loading;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={loading ? undefined : onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text variant="titleMedium" style={styles.title}>
            Log without a photo
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Describe what you ate. We&apos;ll estimate nutrition and you can edit before saving.
          </Text>
          <MealLogDateField
            dateKey={logDateKey}
            onChange={(loggedAt) => onChangeLogDateKey(dateKeyFromIso(loggedAt))}
          />
          <TextInput
            label="What did you eat?"
            value={description}
            onChangeText={onChangeDescription}
            mode="outlined"
            multiline
            numberOfLines={4}
            placeholder="e.g. grilled chicken, rice, and steamed broccoli"
            disabled={loading}
            autoFocus
          />
          <View style={styles.actions}>
            <Button mode="contained" onPress={onSubmit} loading={loading} disabled={!canSubmit}>
              Analyze meal
            </Button>
            <Button mode="text" onPress={onClose} disabled={loading}>
              Cancel
            </Button>
          </View>
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
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  title: {
    letterSpacing: 0.15,
  },
  subtitle: {
    opacity: 0.7,
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  actions: {
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
});
