import { useCallback, useRef, useState } from "react";
import {
  StyleSheet,
  View,
  type NativeSyntheticEvent,
  type TextInputSelectionChangeEventData,
} from "react-native";
import { IconButton, Text, TextInput } from "react-native-paper";
import { MAX_MEAL_NOTES_LENGTH } from "@lifeplate/shared";
import {
  applyBulletPrefix,
  applyNotesFormat,
  type NotesSelection,
} from "@/lib/mealNotesFormat";
import { spacing } from "@/src/theme/lifeplate";
import { premium } from "@/src/theme/premium";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function MealNotesField({ value, onChange }: Props) {
  const selectionRef = useRef<NotesSelection>({ start: 0, end: 0 });
  const [pendingSelection, setPendingSelection] = useState<NotesSelection | null>(null);

  const handleSelectionChange = useCallback(
    (event: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
      selectionRef.current = event.nativeEvent.selection;
      if (pendingSelection) setPendingSelection(null);
    },
    [pendingSelection],
  );

  const applyFormat = useCallback(
    (format: "bold" | "italic" | "bullet") => {
      const result =
        format === "bullet"
          ? applyBulletPrefix(value, selectionRef.current, MAX_MEAL_NOTES_LENGTH)
          : applyNotesFormat(value, selectionRef.current, format, MAX_MEAL_NOTES_LENGTH);
      onChange(result.text);
      selectionRef.current = result.selection;
      setPendingSelection(result.selection);
    },
    [onChange, value],
  );

  return (
    <View>
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Journal notes
      </Text>
      <Text variant="bodySmall" style={styles.hint}>
        Who you ate with, where you went, or a quick recipe note. Use the toolbar for bold, italic,
        and bullet lists.
      </Text>

      <View style={styles.toolbar}>
        <IconButton
          icon="format-bold"
          size={20}
          mode="contained-tonal"
          onPress={() => applyFormat("bold")}
          accessibilityLabel="Bold"
        />
        <IconButton
          icon="format-italic"
          size={20}
          mode="contained-tonal"
          onPress={() => applyFormat("italic")}
          accessibilityLabel="Italic"
        />
        <IconButton
          icon="format-list-bulleted"
          size={20}
          mode="contained-tonal"
          onPress={() => applyFormat("bullet")}
          accessibilityLabel="Bullet list"
        />
      </View>

      <TextInput
        label="Notes"
        value={value}
        onChangeText={(text) => onChange(text.slice(0, MAX_MEAL_NOTES_LENGTH))}
        onSelectionChange={handleSelectionChange}
        selection={pendingSelection ?? undefined}
        mode="outlined"
        multiline
        numberOfLines={4}
        placeholder="e.g. Dinner with Sam at Hawker Centre. Mum's chicken curry — coconut milk, no potatoes."
        style={styles.input}
      />

      {value.length > MAX_MEAL_NOTES_LENGTH - 50 ? (
        <Text variant="bodySmall" style={styles.count}>
          {value.length}/{MAX_MEAL_NOTES_LENGTH}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    letterSpacing: 0.15,
  },
  hint: {
    opacity: 0.65,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: premium.borderColor,
    borderRadius: 12,
    alignSelf: "flex-start",
    paddingHorizontal: spacing.xs,
  },
  input: { minHeight: 112 },
  count: { opacity: 0.5, textAlign: "right", marginTop: spacing.xs },
});
