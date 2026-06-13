import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Image, ScrollView, StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  Chip,
  Snackbar,
  Text,
  TextInput,
} from "react-native-paper";
import type { MealDetail } from "@lifeplate/shared";
import { MacroNutritionPanel } from "@/components/MacroNutritionPanel";
import { PremiumCard } from "@/components/PremiumCard";
import { PremiumHeader } from "@/components/PremiumHeader";
import { deleteMeal, fetchMeal, updateMeal } from "@/lib/api";
import { friendlyErrorMessage } from "@/lib/apiErrors";
import { premium } from "@/src/theme/premium";
import { spacing } from "@/src/theme/lifeplate";

function toNumber(value: string, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeFood(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export default function EditMealScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [meal, setMeal] = useState<MealDetail | null>(null);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const [mealName, setMealName] = useState("");
  const [foods, setFoods] = useState<string[]>([]);
  const [newFood, setNewFood] = useState("");
  const [calories, setCalories] = useState("0");
  const [protein, setProtein] = useState("0");
  const [carbs, setCarbs] = useState("0");
  const [fat, setFat] = useState("0");
  const [fibre, setFibre] = useState("0");
  const [sugar, setSugar] = useState("0");
  const [sodium, setSodium] = useState("0");

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const m = await fetchMeal(id);
      setMeal(m);
      setMealName(m.mealName);
      setFoods(m.foods ?? []);
      setCalories(String(m.calories ?? 0));
      setProtein(String(m.protein ?? 0));
      setCarbs(String(m.carbs ?? 0));
      setFat(String(m.fat ?? 0));
      setFibre(String(m.fibre ?? 0));
      setSugar(String(m.sugar ?? 0));
      setSodium(String(m.sodium ?? 0));
    } catch (e) {
      setMeal(null);
      setSnackbar(friendlyErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  function addFood() {
    const f = normalizeFood(newFood);
    if (!f) return;
    setFoods((prev) => {
      const exists = prev.some((x) => x.toLowerCase() === f.toLowerCase());
      return exists ? prev : [...prev, f];
    });
    setNewFood("");
  }

  function removeFood(name: string) {
    setFoods((prev) => prev.filter((f) => f !== name));
  }

  async function handleSave() {
    if (!id) return;
    setSaving(true);
    try {
      await updateMeal(id, {
        mealName,
        foods,
        calories: toNumber(calories, 0),
        protein: toNumber(protein, 0),
        carbs: toNumber(carbs, 0),
        fat: toNumber(fat, 0),
        fibre: toNumber(fibre, 0),
        sugar: toNumber(sugar, 0),
        sodium: toNumber(sodium, 0),
      });
      setSnackbar("Saved");
      router.back();
    } catch (e) {
      setSnackbar(friendlyErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!id) return;
    setDeleting(true);
    try {
      await deleteMeal(id);
      router.replace("/(tabs)/timeline");
    } catch (e) {
      setSnackbar(friendlyErrorMessage(e));
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!meal) {
    return (
      <View style={styles.center}>
        <Text variant="bodyLarge">Meal not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <PremiumHeader title="Edit meal" subtitle="Update what you ate" />
      <View style={styles.imageWrap}>
        {meal.imageUrl ? (
          <Image source={{ uri: meal.imageUrl }} style={styles.image} />
        ) : null}
      </View>

      <View style={styles.cardWrap}>
      <PremiumCard>
        <TextInput
          label="Meal name"
          value={mealName}
          onChangeText={setMealName}
          mode="outlined"
        />

        <Text variant="titleMedium" style={styles.sectionTitle}>
          Foods
        </Text>
        <View style={styles.chips}>
          {foods.map((f) => (
            <Chip key={f} onClose={() => removeFood(f)}>
              {f}
            </Chip>
          ))}
        </View>
        <TextInput
          label="Add food"
          value={newFood}
          onChangeText={setNewFood}
          onSubmitEditing={addFood}
          mode="outlined"
          right={<TextInput.Icon icon="plus" onPress={addFood} />}
        />

        <MacroNutritionPanel
          calories={toNumber(calories, 0)}
          protein={toNumber(protein, 0)}
          carbs={toNumber(carbs, 0)}
          fat={toNumber(fat, 0)}
          fibre={toNumber(fibre, 0)}
          sugar={toNumber(sugar, 0)}
          sodium={toNumber(sodium, 0)}
          confidence={meal.confidence ?? undefined}
          showConfidence={meal.confidence != null}
        />
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Adjust macros
        </Text>
        <View style={styles.macroGrid}>
          <TextInput
            label="Calories"
            value={calories}
            onChangeText={setCalories}
            keyboardType="numeric"
            mode="outlined"
            style={styles.macroInput}
          />
          <TextInput
            label="Protein (g)"
            value={protein}
            onChangeText={setProtein}
            keyboardType="numeric"
            mode="outlined"
            style={styles.macroInput}
          />
          <TextInput
            label="Carbs (g)"
            value={carbs}
            onChangeText={setCarbs}
            keyboardType="numeric"
            mode="outlined"
            style={styles.macroInput}
          />
          <TextInput
            label="Fat (g)"
            value={fat}
            onChangeText={setFat}
            keyboardType="numeric"
            mode="outlined"
            style={styles.macroInput}
          />
          <TextInput
            label="Fibre (g)"
            value={fibre}
            onChangeText={setFibre}
            keyboardType="numeric"
            mode="outlined"
            style={styles.macroInput}
          />
          <TextInput
            label="Sugar (g)"
            value={sugar}
            onChangeText={setSugar}
            keyboardType="numeric"
            mode="outlined"
            style={styles.macroInput}
          />
          <TextInput
            label="Sodium (mg)"
            value={sodium}
            onChangeText={setSodium}
            keyboardType="numeric"
            mode="outlined"
            style={styles.macroInput}
          />
        </View>
      </PremiumCard>
      </View>

      <View style={styles.actions}>
        <Button mode="contained" onPress={handleSave} loading={saving}>
          Save changes
        </Button>
        <Button mode="outlined" onPress={() => router.back()} disabled={saving}>
          Cancel
        </Button>
        <Button
          mode="text"
          textColor={premium.danger}
          onPress={handleDelete}
          loading={deleting}
          disabled={saving}
        >
          Delete meal
        </Button>
      </View>

      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar(null)} duration={4000}>
        {snackbar}
      </Snackbar>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#FFFFFF" },
  container: { paddingBottom: spacing.xl, gap: spacing.md },
  imageWrap: { paddingHorizontal: spacing.lg },
  image: { width: "100%", height: 220, borderRadius: premium.imageRadius },
  cardWrap: { paddingHorizontal: spacing.lg },
  sectionTitle: { marginTop: spacing.md, marginBottom: spacing.xs },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  macroGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  macroInput: { flexBasis: "48%" },
  actions: { gap: spacing.sm, paddingHorizontal: spacing.lg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg },
});
