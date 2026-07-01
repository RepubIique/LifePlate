import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { ActivityIndicator, Button, Text, TextInput } from "react-native-paper";
import { formatLogDateLabel, todayDateKey } from "@lifeplate/shared";
import { FormattedNotesText } from "@/components/meal/FormattedNotesText";
import { PremiumCard } from "@/components/PremiumCard";
import { BottomSnackbar } from "@/components/ui/BottomSnackbar";
import { confirmPlannedMeal, deleteMeal, fetchMeal, updatePlannedMeal } from "@/lib/api";
import { friendlyErrorMessage } from "@/lib/apiErrors";
import { leaveMealEditScreen, type MealEditReturnTo } from "@/lib/mealNavigation";
import { useMeals } from "@/context/MealsContext";
import { useRefreshAfterMealChange } from "@/lib/refreshAfterMealChange";
import { formatMealTypeLabel } from "@/lib/mealUtils";
import { useThemedStyles } from "@/lib/useThemedStyles";
import { spacing } from "@/src/theme/lifeplate";
import { useAppColors } from "@/context/ThemeContext";

export default function PlannedMealScreen() {
  const { id, returnTo } = useLocalSearchParams<{ id: string; returnTo?: string }>();
  const { semantic } = useAppColors();
  const styles = useThemedStyles((colors) =>
    StyleSheet.create({
      container: {
        flex: 1,
        padding: spacing.lg,
        gap: spacing.md,
      },
      dimmedCard: {
        opacity: 0.72,
      },
      badge: {
        alignSelf: "flex-start",
        opacity: 0.65,
        color: colors.semantic.primary,
        letterSpacing: 0.2,
        textTransform: "uppercase",
        fontSize: 11,
        fontWeight: "700",
      },
      title: {
        letterSpacing: 0.1,
        lineHeight: 28,
      },
      meta: {
        opacity: 0.55,
      },
      notes: {
        opacity: 0.75,
        lineHeight: 20,
      },
      actions: {
        gap: spacing.sm,
        marginTop: spacing.sm,
      },
    }),
  );
  const { invalidateMeals } = useMeals();
  const refreshAfterMealChange = useRefreshAfterMealChange();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mealName, setMealName] = useState("");
  const [notes, setNotes] = useState("");
  const [logDate, setLogDate] = useState("");
  const [mealTypeLabel, setMealTypeLabel] = useState("");
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const meal = await fetchMeal(id);
      if (meal.status !== "planned") {
        router.replace({ pathname: "/meal/edit", params: { id, returnTo: returnTo ?? "plan" } });
        return;
      }
      setMealName(meal.mealName);
      setNotes(meal.notes ?? "");
      setLogDate(meal.logDate);
      setMealTypeLabel(formatMealTypeLabel(meal.mealType));
    } catch (e) {
      setSnackbar(friendlyErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [id, returnTo]);

  useEffect(() => {
    void load();
  }, [load]);

  const canConfirm = logDate <= todayDateKey();

  const handleConfirm = useCallback(async () => {
    if (!id) return;
    setSaving(true);
    try {
      await confirmPlannedMeal(id);
      invalidateMeals();
      await refreshAfterMealChange();
      leaveMealEditScreen(returnTo as MealEditReturnTo);
    } catch (e) {
      setSnackbar(friendlyErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }, [id, invalidateMeals, refreshAfterMealChange, returnTo]);

  const handleLogActual = useCallback(() => {
    if (!id) return;
    void (async () => {
      setSaving(true);
      try {
        await deleteMeal(id);
        invalidateMeals();
        router.replace("/(tabs)");
      } catch (e) {
        setSnackbar(friendlyErrorMessage(e));
      } finally {
        setSaving(false);
      }
    })();
  }, [id, invalidateMeals]);

  const handleSave = useCallback(async () => {
    if (!id) return;
    setSaving(true);
    try {
      await updatePlannedMeal(id, {
        mealName: mealName.trim(),
        notes: notes.trim() || null,
      });
      setSnackbar("Plan updated");
    } catch (e) {
      setSnackbar(friendlyErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }, [id, mealName, notes]);

  const handleDelete = useCallback(() => {
    if (!id) return;
    Alert.alert("Remove planned meal?", "This will delete the penciled-in entry.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          void (async () => {
            setSaving(true);
            try {
              await deleteMeal(id);
              invalidateMeals();
              leaveMealEditScreen(returnTo as MealEditReturnTo);
            } catch (e) {
              setSnackbar(friendlyErrorMessage(e));
            } finally {
              setSaving(false);
            }
          })();
        },
      },
    ]);
  }, [id, invalidateMeals, returnTo]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <PremiumCard style={styles.dimmedCard}>
          <Text style={styles.badge}>Planned</Text>
          <Text variant="headlineSmall" style={styles.title}>
            {mealName}
          </Text>
          <Text variant="bodyMedium" style={styles.meta}>
            {formatLogDateLabel(logDate)} · {mealTypeLabel}
          </Text>
          {notes.trim() ? (
            <FormattedNotesText value={notes} style={styles.notes} />
          ) : null}
        </PremiumCard>

        <TextInput
          mode="outlined"
          label="Dish name"
          value={mealName}
          onChangeText={setMealName}
        />
        <TextInput
          mode="outlined"
          label="Note"
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        <View style={styles.actions}>
          <Button mode="outlined" onPress={() => void handleSave()} loading={saving}>
            Save changes
          </Button>
          {canConfirm ? (
            <>
              <Button mode="contained" onPress={() => void handleConfirm()} loading={saving}>
                Ate as planned
              </Button>
              <Button mode="outlined" onPress={handleLogActual}>
                Log what I actually ate
              </Button>
            </>
          ) : (
            <Text variant="bodySmall" style={styles.meta}>
              You can confirm this meal on {formatLogDateLabel(logDate).toLowerCase()}.
            </Text>
          )}
          <Button mode="text" textColor={semantic.danger} onPress={handleDelete}>
            Remove planned meal
          </Button>
        </View>
      </ScrollView>

      <BottomSnackbar visible={!!snackbar} onDismiss={() => setSnackbar(null)} duration={4000}>
        {snackbar}
      </BottomSnackbar>
    </>
  );
}
