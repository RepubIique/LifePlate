import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  StyleSheet,
  View,
  type NativeSyntheticEvent,
  type TextInputSelectionChangeEventData,
} from "react-native";
import { IconButton, Text, TextInput } from "react-native-paper";
import type { FriendSummary } from "@lifeplate/shared";
import { MAX_MEAL_NOTES_LENGTH } from "@lifeplate/shared";
import { useFriends } from "@/context/FriendsContext";
import { FriendMentionSuggestions } from "@/components/meal/FriendMentionSuggestions";
import {
  applyBulletPrefix,
  applyNotesFormat,
  filterFriendsForMention,
  getActiveMentionQuery,
  insertFriendMention,
  type NotesSelection,
} from "@/lib/mealNotesFormat";
import { spacing } from "@/src/theme/lifeplate";
import { premium } from "@/src/theme/premium";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function MealNotesField({ value, onChange }: Props) {
  const { friends, hydrated, loadFriends } = useFriends();
  const selectionRef = useRef<NotesSelection>({ start: 0, end: 0 });
  const [selection, setSelection] = useState<NotesSelection>({ start: 0, end: 0 });
  const [pendingSelection, setPendingSelection] = useState<NotesSelection | null>(null);
  const [mentionPickerOpen, setMentionPickerOpen] = useState(false);

  useEffect(() => {
    void loadFriends();
  }, [loadFriends]);

  const mentionQuery = useMemo(
    () => getActiveMentionQuery(value, selection.start),
    [selection.start, value],
  );

  const mentionSuggestions = useMemo(() => {
    if (!mentionQuery && !mentionPickerOpen) return [];
    return filterFriendsForMention(friends, mentionQuery?.query ?? "");
  }, [friends, mentionPickerOpen, mentionQuery]);

  const showMentionSuggestions = hydrated && (mentionQuery !== null || mentionPickerOpen);

  const handleSelectionChange = useCallback(
    (event: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
      const next = event.nativeEvent.selection;
      selectionRef.current = next;
      setSelection(next);
      if (pendingSelection) setPendingSelection(null);
    },
    [pendingSelection],
  );

  const applySelection = useCallback((next: NotesSelection) => {
    selectionRef.current = next;
    setSelection(next);
    setPendingSelection(next);
  }, []);

  const applyFormat = useCallback(
    (format: "bold" | "italic" | "bullet") => {
      setMentionPickerOpen(false);
      const result =
        format === "bullet"
          ? applyBulletPrefix(value, selectionRef.current, MAX_MEAL_NOTES_LENGTH)
          : applyNotesFormat(value, selectionRef.current, format, MAX_MEAL_NOTES_LENGTH);
      onChange(result.text);
      applySelection(result.selection);
    },
    [applySelection, onChange, value],
  );

  const insertMention = useCallback(
    (friend: FriendSummary) => {
      const result = insertFriendMention(
        value,
        selectionRef.current,
        friend,
        MAX_MEAL_NOTES_LENGTH,
      );
      onChange(result.text);
      applySelection(result.selection);
      setMentionPickerOpen(false);
    },
    [applySelection, onChange, value],
  );

  const handleMentionPress = useCallback(() => {
    if (friends.length === 0) {
      setMentionPickerOpen(true);
      return;
    }

    const { start, end } = selectionRef.current;
    const before = value.slice(0, start);
    const after = value.slice(end);
    const nextText = `${before}@${after}`.slice(0, MAX_MEAL_NOTES_LENGTH);
    const pos = Math.min(start + 1, nextText.length);
    onChange(nextText);
    applySelection({ start: pos, end: pos });
    setMentionPickerOpen(true);
  }, [applySelection, friends.length, onChange, value]);

  return (
    <View>
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Journal notes
      </Text>
      <Text variant="bodySmall" style={styles.hint}>
        Who you ate with, where you went, or a quick recipe note. Use the toolbar for bold, italic,
        bullet lists, and @ mentions.
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
        <IconButton
          icon="at"
          size={20}
          mode="contained-tonal"
          onPress={handleMentionPress}
          accessibilityLabel="Mention friend"
        />
      </View>

      {showMentionSuggestions ? (
        <FriendMentionSuggestions
          friends={mentionSuggestions}
          query={mentionQuery?.query ?? ""}
          onSelect={insertMention}
        />
      ) : null}

      <TextInput
        label="Notes"
        value={value}
        onChangeText={(text) => {
          const sliced = text.slice(0, MAX_MEAL_NOTES_LENGTH);
          const delta = sliced.length - value.length;
          const estimatedCursor = Math.max(
            0,
            Math.min(selectionRef.current.start + delta, sliced.length),
          );
          onChange(sliced);
          setMentionPickerOpen(getActiveMentionQuery(sliced, estimatedCursor) !== null);
        }}
        onSelectionChange={handleSelectionChange}
        selection={pendingSelection ?? undefined}
        mode="outlined"
        multiline
        numberOfLines={4}
        placeholder="Supports **bold**, *italic*, - bullets, and @friends. e.g. Dinner with @Sam at Hawker Centre."
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
