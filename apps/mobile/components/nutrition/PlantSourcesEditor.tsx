import { useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { Button, Chip, Text, TextInput } from "react-native-paper";
import type { MealListItem } from "@lifeplate/shared";
import { fetchMeal, updateMeal } from "@/lib/api";
import { friendlyErrorMessage } from "@/lib/apiErrors";
import {
  buildPlantSources,
  normalizeFoodName,
  type PlantSourceEntry,
} from "@/lib/plantSources";
import { MEAL_SLOTS, mealMatchesSlot, type MealSlotKey } from "@/lib/mealSlots";
import { spacing } from "@/src/theme/lifeplate";
import { DetailBlock } from "./shared";

type Props = {
  meals: MealListItem[];
  onChanged: () => void;
};

type DialogMode = "add" | "edit" | null;

export function PlantSourcesEditor({ meals, onChanged }: Props) {
  const sources = useMemo(() => buildPlantSources(meals), [meals]);
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [draftName, setDraftName] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<MealSlotKey>("lunch");
  const [editingEntry, setEditingEntry] = useState<PlantSourceEntry | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openAdd() {
    setDraftName("");
    setSelectedSlot("lunch");
    setEditingEntry(null);
    setError(null);
    setDialogMode("add");
  }

  function openEdit(entry: PlantSourceEntry) {
    setDraftName(entry.food);
    setEditingEntry(entry);
    setError(null);
    setDialogMode("edit");
  }

  function closeDialog() {
    if (busy) return;
    setDialogMode(null);
    setEditingEntry(null);
    setDraftName("");
    setError(null);
  }

  async function patchMealFoods(
    mealId: string,
    mutate: (foods: string[]) => string[],
  ) {
    const meal = await fetchMeal(mealId);
    const nextFoods = mutate([...(meal.foods ?? [])]);
    await updateMeal(mealId, { foods: nextFoods });
    onChanged();
  }

  async function handleRemove(entry: PlantSourceEntry) {
    setBusy(true);
    setError(null);
    try {
      await patchMealFoods(entry.mealId, (foods) =>
        foods.filter((_, index) => index !== entry.foodIndex),
      );
    } catch (e) {
      setError(friendlyErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveEdit() {
    if (!editingEntry) return;
    const nextName = normalizeFoodName(draftName);
    if (!nextName) {
      setError("Enter a food name.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await patchMealFoods(editingEntry.mealId, (foods) =>
        foods.map((food, index) => (index === editingEntry.foodIndex ? nextName : food)),
      );
      closeDialog();
    } catch (e) {
      setError(friendlyErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveAdd() {
    const nextName = normalizeFoodName(draftName);
    if (!nextName) {
      setError("Enter a food name.");
      return;
    }

    const targetMeal = meals.find((meal) => mealMatchesSlot(meal.mealType, selectedSlot));
    if (!targetMeal) {
      setError(`Log ${MEAL_SLOTS.find((s) => s.key === selectedSlot)?.label ?? "a meal"} first.`);
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await patchMealFoods(targetMeal.id, (foods) => {
        const exists = foods.some((food) => food.toLowerCase() === nextName.toLowerCase());
        return exists ? foods : [...foods, nextName];
      });
      closeDialog();
    } catch (e) {
      setError(friendlyErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <DetailBlock label="Today's sources">
        {sources.length > 0 ? (
          <View style={styles.chips}>
            {sources.map((entry) => (
              <Chip
                key={entry.key}
                mode="flat"
                style={styles.chip}
                textStyle={styles.chipText}
                onPress={() => openEdit(entry)}
                onClose={() => void handleRemove(entry)}
                closeIconAccessibilityLabel={`Remove ${entry.food}`}
              >
                {entry.food}
              </Chip>
            ))}
          </View>
        ) : (
          <Text variant="bodyMedium" style={styles.empty}>
            No plant foods logged yet.
          </Text>
        )}

        <Button mode="text" icon="plus" onPress={openAdd} style={styles.addButton}>
          Add source
        </Button>

        {error && !dialogMode ? (
          <Text variant="bodySmall" style={styles.error}>
            {error}
          </Text>
        ) : null}
      </DetailBlock>

      <Modal
        visible={dialogMode != null}
        transparent
        animationType="fade"
        onRequestClose={closeDialog}
      >
        <Pressable style={styles.backdrop} onPress={closeDialog}>
          <Pressable style={styles.dialogCard} onPress={(e) => e.stopPropagation()}>
            <Text variant="titleMedium" style={styles.dialogTitle}>
              {dialogMode === "add" ? "Add plant source" : "Edit source"}
            </Text>

            <TextInput
              label="Food"
              value={draftName}
              onChangeText={setDraftName}
              mode="outlined"
              autoFocus
            />

            {dialogMode === "add" ? (
              <View style={styles.slotPicker}>
                <Text variant="labelLarge" style={styles.slotLabel}>
                  Add to
                </Text>
                <View style={styles.slotRow}>
                  {MEAL_SLOTS.map((slot) => {
                    const selected = selectedSlot === slot.key;
                    const hasMeal = meals.some((meal) => mealMatchesSlot(meal.mealType, slot.key));
                    return (
                      <Pressable
                        key={slot.key}
                        onPress={() => setSelectedSlot(slot.key)}
                        style={[
                          styles.slotChip,
                          selected && styles.slotChipSelected,
                          !hasMeal && styles.slotChipMuted,
                        ]}
                      >
                        <Text
                          variant="labelMedium"
                          style={[styles.slotChipText, selected && styles.slotChipTextSelected]}
                        >
                          {slot.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {error && dialogMode ? (
              <Text variant="bodySmall" style={styles.error}>
                {error}
              </Text>
            ) : null}

            <View style={styles.dialogActions}>
              <Button onPress={closeDialog} disabled={busy}>
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={() => void (dialogMode === "add" ? handleSaveAdd() : handleSaveEdit())}
                loading={busy}
              >
                Save
              </Button>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    backgroundColor: "#EEF2F0",
  },
  chipText: {
    color: "#1B4332",
  },
  empty: {
    opacity: 0.55,
    fontStyle: "italic",
  },
  addButton: {
    alignSelf: "flex-start",
    marginLeft: -spacing.sm,
  },
  error: {
    color: "#c0392b",
    marginTop: spacing.xs,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(45, 52, 54, 0.45)",
    justifyContent: "center",
    padding: spacing.lg,
  },
  dialogCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.md,
  },
  dialogTitle: {
    letterSpacing: 0.15,
  },
  dialogActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
  },
  slotPicker: {
    gap: spacing.sm,
  },
  slotLabel: {
    opacity: 0.55,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  slotRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  slotChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: "#F1F3F5",
  },
  slotChipSelected: {
    backgroundColor: "#D8F3DC",
  },
  slotChipMuted: {
    opacity: 0.55,
  },
  slotChipText: {
    color: "#636E72",
  },
  slotChipTextSelected: {
    color: "#1B4332",
    fontWeight: "600",
  },
});
