import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import {
  Button,
  Chip,
  Text,
  TextInput,
} from "react-native-paper";
import { BottomSnackbar } from "@/components/ui/BottomSnackbar";
import type { MealDetail, MealListItem, MealType } from "@lifeplate/shared";
import {
  buildMealPortionMeta,
  isMealType,
  MAX_MEAL_NOTES_LENGTH,
  mealListItemToMacros,
  resolveMealPortionState,
  scaleMealForPortions,
  type MealMacroTotals,
} from "@lifeplate/shared";
import { MealPhotoAttachSection } from "@/components/meal/MealPhotoAttachSection";
import { MealLogDateField, mealDateKeyFromIso } from "@/components/meal/MealLogDateField";
import { EditMealSkeleton } from "@/components/skeletons/EditMealSkeleton";
import { KeyboardAvoidingScrollView } from "@/components/Screen";
import { MacroNutritionPanel } from "@/components/MacroNutritionPanel";
import { MealTypePicker } from "@/components/MealTypePicker";
import { PremiumCard } from "@/components/PremiumCard";
import { PremiumHeader } from "@/components/PremiumHeader";
import { MealImage } from "@/components/MealImage";
import { SharedMealPortionsCard } from "@/components/SharedMealPortionsCard";
import { useAuth } from "@/context/AuthContext";
import { useMeals } from "@/context/MealsContext";
import { attachMealPhoto, deleteMeal, updateMeal } from "@/lib/api";
import { deleteMealImage, getLocalMealImageUri, saveMealImage } from "@/lib/mealImages";
import { friendlyErrorMessage } from "@/lib/apiErrors";
import { loadMealDetail } from "@/lib/loadMealDetail";
import { leaveMealEditScreen } from "@/lib/mealNavigation";
import {
  getCachedMealDetail,
  invalidateMealDetail,
  setCachedMealDetail,
} from "@/lib/mealDetailCache";
import {
  useRefreshAfterMealChange,
  useRefreshMealsAndDashboard,
} from "@/lib/refreshAfterMealChange";
import { useMealPhotoAttach } from "@/lib/useMealPhotoAttach";
import { premium } from "@/src/theme/premium";
import { spacing } from "@/src/theme/lifeplate";

function toNumber(value: string, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeFood(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function applyMacrosToForm(
  macros: MealMacroTotals,
  setters: {
    setCalories: (v: string) => void;
    setProtein: (v: string) => void;
    setCarbs: (v: string) => void;
    setFat: (v: string) => void;
    setFibre: (v: string) => void;
    setSugar: (v: string) => void;
    setSodium: (v: string) => void;
  },
) {
  setters.setCalories(String(macros.estimatedCalories));
  setters.setProtein(String(macros.protein));
  setters.setCarbs(String(macros.carbs));
  setters.setFat(String(macros.fat));
  setters.setFibre(String(macros.fibre));
  setters.setSugar(String(macros.sugar));
  setters.setSodium(String(macros.sodium));
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
  applyMacrosToForm(mealListItemToMacros(m), setters);
}

export default function EditMealScreen() {
  const { profile } = useAuth();
  const { patchMealLocally, removeMealLocally } = useMeals();
  const refreshMealsAndDashboard = useRefreshMealsAndDashboard();
  const refreshAfterMealChange = useRefreshAfterMealChange();
  const { id, returnTo } = useLocalSearchParams<{ id: string; returnTo?: string }>();
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
  const [notes, setNotes] = useState("");
  const [attachedImageUri, setAttachedImageUri] = useState("");
  const [resolvedImageUri, setResolvedImageUri] = useState<string | null>(null);
  const [baseMacros, setBaseMacros] = useState<MealMacroTotals>({
    estimatedCalories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fibre: 0,
    sugar: 0,
    sodium: 0,
  });
  const [totalPortions, setTotalPortions] = useState(1);
  const [portionsEaten, setPortionsEaten] = useState(1);
  const [estimatedServings, setEstimatedServings] = useState<number | undefined>();

  const attachPhoto = useCallback(
    async (prepared: { uri: string; mimeType: string; fileName: string }) => {
      if (!id) return;
      const result = await attachMealPhoto(id, prepared);
      await saveMealImage(id, prepared.uri);
      setAttachedImageUri(prepared.uri);
      patchMealLocally(id, { imageUrl: result.imageUrl || "" });
      if (meal) {
        setMeal({ ...meal, imageUrl: result.imageUrl || "" });
        setCachedMealDetail({ ...meal, imageUrl: result.imageUrl || "" });
      }
    },
    [id, meal, patchMealLocally],
  );

  const {
    attaching: attachingPhoto,
    error: attachPhotoError,
    setError: setAttachPhotoError,
    pickPhoto,
  } = useMealPhotoAttach(attachPhoto);

  useEffect(() => {
    if (attachPhotoError) setSnackbar(attachPhotoError);
  }, [attachPhotoError]);

  useEffect(() => {
    if (!meal?.id) {
      setResolvedImageUri(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      const local = await getLocalMealImageUri(meal.id);
      if (cancelled) return;
      const cloud = meal.imageUrl?.trim();
      setResolvedImageUri(attachedImageUri || local || cloud || null);
    })();
    return () => {
      cancelled = true;
    };
  }, [meal?.id, meal?.imageUrl, attachedImageUri]);

  const showPhotoAttach = Boolean(meal && !attachedImageUri && !resolvedImageUri);

  const macroSetters = {
    setCalories,
    setProtein,
    setCarbs,
    setFat,
    setFibre,
    setSugar,
    setSodium,
  };

  useEffect(() => {
    if (!meal) return;
    if (totalPortions <= 1) {
      applyMacrosToForm(baseMacros, macroSetters);
      return;
    }
    applyMacrosToForm(
      scaleMealForPortions(baseMacros, totalPortions, portionsEaten),
      macroSetters,
    );
  }, [meal, totalPortions, portionsEaten, baseMacros]);

  const applyMealDetail = useCallback((m: MealDetail) => {
    setMeal(m);
    const stored = mealListItemToMacros(m);
    const resolved = resolveMealPortionState(stored, m.portionMeta);
    setBaseMacros(resolved.baseMacros);
    setTotalPortions(resolved.totalPortions);
    setPortionsEaten(resolved.portionsEaten);
    setEstimatedServings(resolved.estimatedServings);
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
    setNotes(m.notes ?? "");
  }, []);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    const cached = getCachedMealDetail(id);
    if (cached) {
      applyMealDetail(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    setMeal(null);

    loadMealDetail(id)
      .then((m) => {
        if (cancelled) return;
        applyMealDetail(m);
      })
      .catch((e) => {
        if (cancelled) return;
        setMeal(null);
        setSnackbar(friendlyErrorMessage(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, applyMealDetail]);

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
    if (!id || !meal) return;
    setSaving(true);
    try {
      const portionMeta =
        buildMealPortionMeta(
          baseMacros,
          totalPortions,
          portionsEaten,
          estimatedServings,
        ) ?? null;
      const nextCalories = toNumber(calories, 0);
      const nextProtein = toNumber(protein, 0);
      const nextCarbs = toNumber(carbs, 0);
      const nextFat = toNumber(fat, 0);
      const nextFibre = toNumber(fibre, 0);
      const nextSugar = toNumber(sugar, 0);
      const nextSodium = toNumber(sodium, 0);
      const currentLogDate = meal.logDate ?? mealDateKeyFromIso(meal.createdAt);
      const nextLogDate = mealDateKeyFromIso(loggedAt);
      const logDateChanged = nextLogDate !== currentLogDate;

      await updateMeal(id, {
        mealName,
        mealType,
        foods,
        calories: nextCalories,
        protein: nextProtein,
        carbs: nextCarbs,
        fat: nextFat,
        fibre: nextFibre,
        sugar: nextSugar,
        sodium: nextSodium,
        loggedAt,
        notes,
        portionMeta,
      });

      if (logDateChanged) {
        invalidateMealDetail(id);
        refreshAfterMealChange();
      } else {
        setCachedMealDetail({
          ...meal,
          mealName,
          mealType,
          foods,
          calories: nextCalories,
          protein: nextProtein,
          carbs: nextCarbs,
          fat: nextFat,
          fibre: nextFibre,
          sugar: nextSugar,
          sodium: nextSodium,
          createdAt: loggedAt,
          logDate: nextLogDate,
          notes: notes || null,
          portionMeta: portionMeta ?? undefined,
        });
        patchMealLocally(id, {
          mealName,
          mealType,
          calories: nextCalories,
          protein: nextProtein,
          notes: notes || null,
          createdAt: loggedAt,
          logDate: nextLogDate,
        });
        refreshMealsAndDashboard();
      }

      setSnackbar("Saved");
      leaveMealEditScreen(returnTo);
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
      await deleteMealImage(id);
      invalidateMealDetail(id);
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
      {loading ? (
        <>
          <PremiumHeader title="Edit meal" subtitle="Update what you ate" />
          <EditMealSkeleton />
        </>
      ) : meal ? (
    <KeyboardAvoidingScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <PremiumHeader title="Edit meal" subtitle="Update what you ate" />
      {showPhotoAttach ? (
        <View style={styles.imageWrap}>
          <MealPhotoAttachSection
            mealType={mealType}
            attaching={attachingPhoto}
            onPickCamera={() => {
              setAttachPhotoError(null);
              void pickPhoto(true);
            }}
            onPickLibrary={() => {
              setAttachPhotoError(null);
              void pickPhoto(false);
            }}
          />
        </View>
      ) : (
        <View style={styles.imageWrap}>
          {attachedImageUri ? (
            <Image source={{ uri: attachedImageUri }} style={styles.image} />
          ) : (
            <MealImage
              mealId={meal.id}
              cloudUrl={meal.imageUrl}
              mealType={mealType}
              style={styles.image}
              placeholderStyle={styles.imagePlaceholder}
              placeholderIconSize={56}
            />
          )}
        </View>
      )}

      <View style={styles.cardWrap}>
      <PremiumCard>
        <MealLogDateField
          dateKey={mealDateKeyFromIso(loggedAt || meal.createdAt)}
          mealType={mealType}
          label="Logged on"
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
          Journal notes
        </Text>
        <Text variant="bodySmall" style={styles.notesHint}>
          Who you ate with, where you went, or a quick recipe note.
        </Text>
        <TextInput
          label="Notes"
          value={notes}
          onChangeText={(text) => setNotes(text.slice(0, MAX_MEAL_NOTES_LENGTH))}
          mode="outlined"
          multiline
          numberOfLines={4}
          placeholder="e.g. Dinner with Sam at Hawker Centre. Mum's chicken curry — coconut milk, no potatoes."
          style={styles.notesInput}
        />
        {notes.length > MAX_MEAL_NOTES_LENGTH - 50 ? (
          <Text variant="bodySmall" style={styles.notesCount}>
            {notes.length}/{MAX_MEAL_NOTES_LENGTH}
          </Text>
        ) : null}

        <SharedMealPortionsCard
          variant="edit"
          totalPortions={totalPortions}
          portionsEaten={portionsEaten}
          estimatedServings={estimatedServings}
          onTotalPortionsChange={setTotalPortions}
          onPortionsEatenChange={setPortionsEaten}
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
          dailyFibreGoal={dailyFibreGoal}
          personalisedGoal={personalisedFibreGoal}
          confidence={meal.confidence ?? undefined}
          showConfidence={meal.confidence != null}
          energyUnitToggle
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
        <Button mode="outlined" onPress={() => leaveMealEditScreen(returnTo)} disabled={saving}>
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

      <BottomSnackbar visible={!!snackbar} onDismiss={() => setSnackbar(null)} duration={4000}>
        {snackbar}
      </BottomSnackbar>
    </KeyboardAvoidingScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#FFFFFF" },
  scroll: { flex: 1, backgroundColor: "#FFFFFF" },
  container: { paddingBottom: spacing.xl, gap: spacing.md },
  imageWrap: { paddingHorizontal: spacing.lg },
  image: { width: "100%", height: 220, borderRadius: premium.imageRadius },
  imagePlaceholder: { width: "100%", height: 220, borderRadius: premium.imageRadius },
  cardWrap: { paddingHorizontal: spacing.lg },
  sectionTitle: { marginTop: spacing.md, marginBottom: spacing.xs },
  notesHint: { opacity: 0.65, marginBottom: spacing.sm, lineHeight: 18 },
  notesInput: { minHeight: 112 },
  notesCount: { opacity: 0.5, textAlign: "right", marginTop: spacing.xs },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  macroGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  macroInput: { flexBasis: "48%" },
  actions: { gap: spacing.sm, paddingHorizontal: spacing.lg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg },
});
