import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Button, Text, TextInput } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  const insets = useSafeAreaInsets();
  const canSubmit = description.trim().length > 0 && !loading;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.keyboardRoot}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <View style={styles.backdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={loading ? undefined : onClose}
            accessibilityRole="button"
            accessibilityLabel="Close log without photo"
          />
          <View
            style={[styles.sheet, { paddingBottom: insets.bottom + spacing.sm }]}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              bounces={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.sheetContent}
            >
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
              {!description.trim() ? (
                <Text variant="bodySmall" style={styles.hint}>
                  Be specific — ingredients and portions help us estimate better.
                </Text>
              ) : null}
              <View style={styles.actions}>
                <Button mode="contained" onPress={onSubmit} loading={loading} disabled={!canSubmit}>
                  Analyze meal
                </Button>
                <Button mode="text" onPress={onClose} disabled={loading}>
                  Cancel
                </Button>
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardRoot: {
    flex: 1,
  },
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
    maxHeight: "92%",
  },
  sheetContent: {
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
  hint: {
    opacity: 0.5,
    lineHeight: 18,
  },
  actions: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
});
