import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import {
  Button,
  Chip,
  Snackbar,
  Text,
  TextInput,
} from "react-native-paper";
import type { MealDetail, MealListItem, MealType } from "@lifeplate/shared";
import { isMealType } from "@lifeplate/shared";
import { MealLogDateField, mealDateKeyFromIso } from "@/components/meal/MealLogDateField";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { KeyboardAvoidingScrollView } from "@/components/Screen";
import { MacroNutritionPanel } from "@/components/MacroNutritionPanel";
import { MealTypePicker } from "@/components/MealTypePicker";
import { PremiumCard } from "@/components/PremiumCard";
import { PremiumHeader } from "@/components/PremiumHeader";
import { useAuth } from "@/context/AuthContext";
import { useMeals } from "@/context/MealsContext";
import { deleteMeal, fetchMeal, updateMeal } from "@/lib/api";
import { friendlyErrorMessage } from "@/lib/apiErrors";
import { useRefreshAfterMealChange } from "@/lib/refreshAfterMealChange";
import { premium } from "@/src/theme/premium";
import { spacing } from "@/src/theme/lifeplate";

function toNumber(value: string, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeFood(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function applyMealToForm(
  m: MealListItem,
  setters: {
    setMealName: (v: string) => void;
    setMealType: (v: MealType) => void;
    setFoods: (v: string[]) => void;
    setCalories: (v: string) => void;
    setProtein: (v: string) => void;
    setCarbs: (v: string) => void;
    setFat: (v: string) => void;
    setFibre: (v: string) => void;
    setSugar: (v: string) => void;
    setSodium: (v: string) => void;
  },
) {
  setters.setMealName(m.mealName);
  const type = m.mealType ?? "";
  setters.setMealType(isMealType(type) ? type : "lunch");
  setters.setFoods(m.foods ?? []);
  setters.setCalories(String(m.calories ?? 0));
  setters.setProtein(String(m.protein ?? 0));
  setters.setCarbs(String(m.carbs ?? 0));
  setters.setFat(String(m.fat ?? 0));
  setters.setFibre(String(m.fibre ?? 0));
  setters.setSugar(String(m.sugar ?? 0));
  setters.setSodium(String(m.sodium ?? 0));
}

export default function EditMealScreen() {
  const { profile } = useAuth();
  const { removeMealLocally } = useMeals();
  const refreshAfterMealChange = useRefreshAfterMealChange();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [meal, setMeal] = useState<MealDetail | null>(null);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const [mealName, setMealName] = useState("");
  const [mealType, setMealType] = useState<MealType>("lunch");
  const [foods, setFoods] = useState<string[]>([]);
  const [newFood, setNewFood] = useState("");
  const [calories, setCalories] = useState("0");
  const [protein, setProtein] = useState("0");
  const [carbs, setCarbs] = useState("0");
  const [fat, setFat] = useState("0");
  const [fibre, setFibre] = useState("0");
  const [sugar, setSugar] = useState("0");
  const [sodium, setSodium] = useState("0");
  const [loggedAt, setLoggedAt] = useState<string>("");

  const load = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    try {
      const m = await fetchMeal(id);
      setMeal(m);
      applyMealToForm(m, {
        setMealName,
        setMealType,
        setFoods,
        setCalories,
        setProtein,
        setCarbs,
        setFat,
        setFibre,
        setSugar,
        setSodium,
      });
      setLoggedAt(m.createdAt);
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
        mealType,
        foods,
        calories: toNumber(calories, 0),
        protein: toNumber(protein, 0),
        carbs: toNumber(carbs, 0),
        fat: toNumber(fat, 0),
        fibre: toNumber(fibre, 0),
        sugar: toNumber(sugar, 0),
        sodium: toNumber(sodium, 0),
        loggedAt,
      });
      refreshAfterMealChange();
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
      removeMealLocally(id);
      refreshAfterMealChange();
      router.replace("/(tabs)/timeline");
    } catch (e) {
      setSnackbar(friendlyErrorMessage(e));
    } finally {
      setDeleting(false);
    }
  }

  if (!loading && !meal) {
    return (
      <View style={styles.center}>
        <Text variant="bodyLarge">Meal not found.</Text>
      </View>
    );
  }

  const dailyFibreGoal = profile?.nutritionTargets?.dailyFibreG;
  const personalisedFibreGoal = profile?.nutritionTargets != null;

  return (
    <View style={styles.page}>
      {meal ? (
    <KeyboardAvoidingScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <PremiumHeader title="Edit meal" subtitle="Update what you ate" />
      <View style={styles.imageWrap}>
        {meal.imageUrl ? (
          <Image source={{ uri: meal.imageUrl }} style={styles.image} />
        ) : null}
      </View>

      <View style={styles.cardWrap}>
      <PremiumCard>
        <MealLogDateField
          dateKey={mealDateKeyFromIso(loggedAt || meal.createdAt)}
          mealType={mealType}
          onChange={setLoggedAt}
        />
        <TextInput
          label="Meal name"
          value={mealName}
          onChangeText={setMealName}
          mode="outlined"
        />

        <MealTypePicker value={mealType} onChange={setMealType} />

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
          dailyFibreGoal={dailyFibreGoal}
          personalisedGoal={personalisedFibreGoal}
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
    </KeyboardAvoidingScrollView>
      ) : null}
      <LoadingOverlay visible={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#FFFFFF" },
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
