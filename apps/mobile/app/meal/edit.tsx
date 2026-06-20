import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import {
  Button,
  Chip,
  Text,
  TextInput,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSnackbar } from "@/components/ui/BottomSnackbar";
import type { MealDetail, MealListItem, MealSource, MealType } from "@lifeplate/shared";
import {
  buildMealPortionMeta,
  isMealSource,
  isMealSourceOptional,
  isMealType,
  MAX_MEAL_REANALYZES,
  mealListItemToMacros,
  scaleMealForPortions,
  type MealMacroTotals,
} from "@lifeplate/shared";
import { MealNotesField } from "@/components/meal/MealNotesField";
import { MealPhotoAttachSection } from "@/components/meal/MealPhotoAttachSection";
import { MealLogDateField } from "@/components/meal/MealLogDateField";
import { dateKeyFromIso } from "@lifeplate/shared";
import { EditMealSkeleton } from "@/components/skeletons/EditMealSkeleton";
import { KeyboardAvoidingScrollView } from "@/components/Screen";
import { MacroNutritionPanel } from "@/components/MacroNutritionPanel";
import { MealTypePicker } from "@/components/MealTypePicker";
import { MealSourcePicker } from "@/components/MealSourcePicker";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { PremiumCard } from "@/components/PremiumCard";
import { PremiumHeader } from "@/components/PremiumHeader";
import { SharedMealPortionsCard } from "@/components/SharedMealPortionsCard";
import { ShareWithFriendsPicker } from "@/components/meal/ShareWithFriendsPicker";
import { useAuth } from "@/context/AuthContext";
import { useMeals } from "@/context/MealsContext";
import { attachMealPhoto, deleteMeal, reanalyzeMeal, shareMealWithFriends, updateMeal } from "@/lib/api";
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
  useRefreshDashboardOnly,
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
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const { patchMealLocally, removeMealLocally } = useMeals();
  const refreshDashboardOnly = useRefreshDashboardOnly();
  const refreshAfterMealChange = useRefreshAfterMealChange();
  const { id, returnTo } = useLocalSearchParams<{ id: string; returnTo?: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [reanalyzeRemaining, setReanalyzeRemaining] = useState(MAX_MEAL_REANALYZES);
  const [deleting, setDeleting] = useState(false);
  const [meal, setMeal] = useState<MealDetail | null>(null);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const [mealName, setMealName] = useState("");
  const [mealType, setMealType] = useState<MealType>("lunch");
  const [mealSource, setMealSource] = useState<MealSource | null>("home_cooked");
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
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);

  const canShareMeal = !meal?.sharedByUserId;

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

  const displayImageUri = attachedImageUri || resolvedImageUri || undefined;

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

  useEffect(() => {
    if (isMealSourceOptional(mealType)) return;
    if (mealSource === null) {
      setMealSource("home_cooked");
    }
  }, [mealType, mealSource]);

  const applyMealDetail = useCallback((m: MealDetail) => {
    setMeal(m);
    const stored = mealListItemToMacros(m);
    setBaseMacros(stored);
    setTotalPortions(1);
    setPortionsEaten(1);
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
    const source = m.mealSource ?? "";
    const type = isMealType(m.mealType ?? "") ? m.mealType : "lunch";
    if (isMealSource(source)) {
      setMealSource(source);
    } else if (isMealSourceOptional(type)) {
      setMealSource(null);
    } else {
      setMealSource("home_cooked");
    }
    setReanalyzeRemaining(
      m.reanalyzeRemaining ?? Math.max(0, MAX_MEAL_REANALYZES - (m.reanalyzeCount ?? 0)),
    );
    setSelectedFriendIds(m.pendingShareFriendIds ?? []);
  }, []);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    const cached = getCachedMealDetail(id);
    if (cached) {
      applyMealDetail(cached);
      setLoading(false);
    } else {
      setLoading(true);
      setMeal(null);
    }

    loadMealDetail(id, { force: true })
      .then((m) => {
        if (cancelled) return;
        applyMealDetail(m);
      })
      .catch((e) => {
        if (cancelled) return;
        if (!cached) {
          setMeal(null);
          setSnackbar(friendlyErrorMessage(e));
        }
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

  async function handleReanalyze() {
    if (!id || foods.length === 0 || reanalyzeRemaining <= 0) return;
    setReanalyzing(true);
    try {
      const result = await reanalyzeMeal(id, {
        foods,
        mealName,
        mealType,
      });
      const nextMacros: MealMacroTotals = {
        estimatedCalories: result.estimatedCalories,
        protein: result.protein,
        carbs: result.carbs,
        fat: result.fat,
        fibre: result.fibre,
        sugar: result.sugar,
        sodium: result.sodium,
      };
      setMealName(result.mealName);
      setFoods(result.foods);
      setBaseMacros(nextMacros);
      setReanalyzeRemaining(result.reanalyzeRemaining);
      if (meal) {
        setMeal({ ...meal, confidence: result.confidence });
      }
      setSnackbar("Macros updated from your food list — review and save when ready.");
    } catch (e) {
      setSnackbar(friendlyErrorMessage(e));
    } finally {
      setReanalyzing(false);
    }
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
        ) ?? null;
      const nextCalories = toNumber(calories, 0);
      const nextProtein = toNumber(protein, 0);
      const nextCarbs = toNumber(carbs, 0);
      const nextFat = toNumber(fat, 0);
      const nextFibre = toNumber(fibre, 0);
      const nextSugar = toNumber(sugar, 0);
      const nextSodium = toNumber(sodium, 0);
      const currentLogDate = meal.logDate ?? dateKeyFromIso(meal.createdAt);
      const nextLogDate = dateKeyFromIso(loggedAt);
      const logDateChanged = nextLogDate !== currentLogDate;
      const resolvedMealSource = isMealSourceOptional(mealType)
        ? mealSource
        : (mealSource ?? "home_cooked");

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
        mealSource: resolvedMealSource,
      });

      let sharesSent = 0;
      let pendingShareFriendIds = meal.pendingShareFriendIds ?? [];
      if (canShareMeal && selectedFriendIds.length > 0) {
        const shareResult = await shareMealWithFriends(id, {
          shareWithFriendIds: selectedFriendIds,
        });
        sharesSent = shareResult.sharesSent;
        pendingShareFriendIds = [...new Set(selectedFriendIds)];
      }

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
          mealSource: resolvedMealSource,
          pendingShareFriendIds,
        });
        patchMealLocally(id, {
          mealName,
          mealType,
          calories: nextCalories,
          protein: nextProtein,
          fibre: nextFibre,
          notes: notes || null,
          mealSource: resolvedMealSource,
          createdAt: loggedAt,
          logDate: nextLogDate,
        });
        refreshDashboardOnly();
      }

      if (sharesSent > 0) {
        setSnackbar(
          `Saved and sent to ${sharesSent} friend${sharesSent === 1 ? "" : "s"} for review`,
        );
      } else {
        setSnackbar("Saved");
      }
      leaveMealEditScreen(returnTo);
    } catch (e) {
      setSnackbar(friendlyErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete() {
    if (!id) return;
    Alert.alert(
      "Delete this meal?",
      "This removes it from your timeline. This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => void handleDelete() },
      ],
    );
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
    <KeyboardAvoidingScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + spacing.xl }]}
    >
      <PremiumHeader title="Edit meal" subtitle="Update what you ate" />

      <MealPhotoAttachSection
        mealType={mealType}
        imageUri={displayImageUri}
        attaching={attachingPhoto}
        variant="compact"
        onPickCamera={() => {
          setAttachPhotoError(null);
          void pickPhoto(true);
        }}
        onPickLibrary={() => {
          setAttachPhotoError(null);
          void pickPhoto(false);
        }}
      />

      <View style={styles.cardWrap}>
        <PremiumCard style={styles.sectionCard}>
          <MealLogDateField
            dateKey={dateKeyFromIso(loggedAt || meal.createdAt)}
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
          <View style={styles.metaGroup}>
            <MealTypePicker compact value={mealType} onChange={setMealType} />
            <MealSourcePicker
              compact
              optional={isMealSourceOptional(mealType)}
              value={mealSource}
              onChange={setMealSource}
            />
          </View>
        </PremiumCard>
      </View>

      <View style={styles.cardWrap}>
        <PremiumCard style={styles.sectionCard}>
          <Text variant="titleMedium" style={styles.blockTitle}>
            What you ate
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

          <View style={styles.reanalyzeRow}>
            <Text variant="bodySmall" style={styles.reanalyzeHint}>
              {reanalyzeRemaining > 0
                ? `${reanalyzeRemaining} AI re-analyse${reanalyzeRemaining === 1 ? "" : "s"} left`
                : "Manual macro edits only"}
            </Text>
            <Button
              mode="outlined"
              icon="auto-fix"
              compact
              onPress={handleReanalyze}
              loading={reanalyzing}
              disabled={
                reanalyzing ||
                saving ||
                foods.length === 0 ||
                reanalyzeRemaining <= 0
              }
            >
              Re-analyse
            </Button>
          </View>

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
        </PremiumCard>
      </View>

      <View style={styles.cardWrap}>
        <CollapsibleSection title="Fine-tune macros" subtitle="Adjust individual numbers">
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
        </CollapsibleSection>
      </View>

      <View style={styles.cardWrap}>
        <CollapsibleSection
          title="Journal notes"
          subtitle={notes.trim() ? notes.trim().slice(0, 48) : "Optional"}
          defaultExpanded={Boolean(notes.trim())}
        >
          <MealNotesField compact value={notes} onChange={setNotes} />
        </CollapsibleSection>
      </View>

      <View style={styles.cardWrap}>
        <CollapsibleSection
          title="Portions"
          subtitle={
            totalPortions > 1
              ? `Logging ${portionsEaten} of ${totalPortions}`
              : "Single portion"
          }
          defaultExpanded={totalPortions > 1}
        >
          <SharedMealPortionsCard
            embedded
            variant="edit"
            totalPortions={totalPortions}
            portionsEaten={portionsEaten}
            onTotalPortionsChange={setTotalPortions}
            onPortionsEatenChange={setPortionsEaten}
          />
        </CollapsibleSection>
      </View>

      {canShareMeal ? (
        <View style={styles.cardWrap}>
          <CollapsibleSection
            key={`share-${selectedFriendIds.join(",")}`}
            title="Share with friends"
            subtitle={
              selectedFriendIds.length > 0
                ? `${selectedFriendIds.length} selected`
                : "Optional"
            }
            defaultExpanded={selectedFriendIds.length > 0}
          >
            <ShareWithFriendsPicker
              embedded
              selectedFriendIds={selectedFriendIds}
              onSelectionChange={setSelectedFriendIds}
            />
          </CollapsibleSection>
        </View>
      ) : null}

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
          onPress={confirmDelete}
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
  container: { gap: spacing.sm },
  cardWrap: { paddingHorizontal: spacing.lg },
  sectionCard: { gap: spacing.sm },
  metaGroup: { gap: spacing.md, marginTop: spacing.xs },
  blockTitle: { letterSpacing: 0.15 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  reanalyzeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  reanalyzeHint: { opacity: 0.7, flex: 1, lineHeight: 18 },
  macroGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  macroInput: { flexBasis: "48%" },
  actions: { gap: spacing.sm, paddingHorizontal: spacing.lg, marginTop: spacing.xs },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg },
});
