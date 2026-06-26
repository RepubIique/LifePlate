import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { Button, Chip, Text, TextInput, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSnackbar } from "@/components/ui/BottomSnackbar";
import {
  buildMealPortionMeta,
  dateKeyFromIso,
  inferMealType,
  loggedAtForDateKey,
  scaleMealForPortions,
  todayDateKey,
  type MealMacroTotals,
  type MealType,
} from "@lifeplate/shared";
import { KeyboardAvoidingScrollView } from "@/components/Screen";
import { MealImagePlaceholder } from "@/components/MealImage";
import { MacroNutritionPanel } from "@/components/MacroNutritionPanel";
import { MealPhotoAttachSection } from "@/components/meal/MealPhotoAttachSection";
import { MealLogDateField } from "@/components/meal/MealLogDateField";
import { MealTypePicker } from "@/components/MealTypePicker";
import { PremiumCard } from "@/components/PremiumCard";
import { SharedMealPortionsCard } from "@/components/SharedMealPortionsCard";
import { ShareWithFriendsPicker } from "@/components/meal/ShareWithFriendsPicker";
import { useAuth } from "@/context/AuthContext";
import { attachDraftPhoto, confirmMeal, refineMeal } from "@/lib/api";
import { friendlyErrorMessage, isLoggingLockedError, isRetryableError, mealFlowErrorMessage } from "@/lib/apiErrors";
import { useLoggingAccess } from "@/lib/useLoggingAccess";
import {
  clearPendingConfirm,
  savePendingConfirm,
  type PendingMealConfirmForm,
} from "@/lib/mealPendingStorage";
import {
  clearMealUploadSession,
  getMealUploadSession,
  routeParam,
  saveMealUploadSession,
} from "@/lib/mealUploadSession";
import { saveMealImage } from "@/lib/mealImages";
import { useMealPhotoAttach } from "@/lib/useMealPhotoAttach";
import { useRefreshAfterMealChange } from "@/lib/refreshAfterMealChange";
import { premium } from "@/src/theme/premium";
import { spacing } from "@/src/theme/lifeplate";

function toNumber(value: string | undefined, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeFood(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export default function MealResultScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { profile, session } = useAuth();
  const { requireLoggingAccess } = useLoggingAccess();
  const userId = session?.user.id;
  const refreshAfterMealChange = useRefreshAfterMealChange();
  const params = useLocalSearchParams<{
    draftId: string;
    imageUrl?: string;
    mealName: string;
    foods: string;
    estimatedCalories: string;
    protein: string;
    carbs: string;
    fat: string;
    fibre: string;
    sugar: string;
    sodium: string;
    confidence: string;
    coachNudge: string;
    logDate?: string;
    loggedAt?: string;
    isTextLog?: string;
  }>();

  const draftId = routeParam(params.draftId);
  const uploadSession = useMemo(
    () => getMealUploadSession(draftId),
    [draftId],
  );
  const isTextLog =
    routeParam(params.isTextLog) === "true" || uploadSession?.isTextLog === true;
  const [localImageUri, setLocalImageUri] = useState(
    () => uploadSession?.localImageUri || "",
  );
  const [cloudImageUrl, setCloudImageUrl] = useState(
    () => uploadSession?.imageUrl || routeParam(params.imageUrl) || "",
  );
  const displayImageUri =
    localImageUri ||
    routeParam(params.imageUrl) ||
    cloudImageUrl ||
    uploadSession?.imageUrl ||
    "";
  const initialLogDateKey = routeParam(params.logDate) || todayDateKey();
  const [loggedAt, setLoggedAt] = useState(() => {
    const fromParams = routeParam(params.loggedAt);
    if (fromParams) return fromParams;
    return loggedAtForDateKey(initialLogDateKey, inferMealType());
  });

  const initialFoods = useMemo(() => {
    try {
      return JSON.parse(params.foods ?? "[]") as string[];
    } catch {
      return [];
    }
  }, [params.foods]);

  const initialBaseMacros: MealMacroTotals = {
    estimatedCalories: toNumber(params.estimatedCalories, 0),
    protein: toNumber(params.protein, 0),
    carbs: toNumber(params.carbs, 0),
    fat: toNumber(params.fat, 0),
    fibre: toNumber(params.fibre, 0),
    sugar: toNumber(params.sugar, 0),
    sodium: toNumber(params.sodium, 0),
  };

  const [baseMacros, setBaseMacros] = useState<MealMacroTotals>(initialBaseMacros);
  const [editing, setEditing] = useState(false);
  const [mealType, setMealType] = useState<MealType>(() => inferMealType());
  const prevMealTypeRef = useRef(mealType);
  const [mealName, setMealName] = useState(params.mealName ?? "");
  const [foods, setFoods] = useState<string[]>(initialFoods);
  const [newFood, setNewFood] = useState("");
  const [calories, setCalories] = useState(
    String(initialBaseMacros.estimatedCalories),
  );
  const [protein, setProtein] = useState(String(initialBaseMacros.protein));
  const [carbs, setCarbs] = useState(String(initialBaseMacros.carbs));
  const [fat, setFat] = useState(String(initialBaseMacros.fat));
  const [fibre, setFibre] = useState(String(initialBaseMacros.fibre));
  const [sugar, setSugar] = useState(String(initialBaseMacros.sugar));
  const [sodium, setSodium] = useState(String(initialBaseMacros.sodium));
  const [confidence, setConfidence] = useState(toNumber(params.confidence, 0));
  const [coachNudge, setCoachNudge] = useState(params.coachNudge ?? "");
  const [totalPortions, setTotalPortions] = useState(1);
  const [portionsEaten, setPortionsEaten] = useState(1);
  const [clarification, setClarification] = useState("");
  const [refining, setRefining] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [confirmRetryable, setConfirmRetryable] = useState(false);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);

  useEffect(() => {
    if (prevMealTypeRef.current === mealType) return;
    prevMealTypeRef.current = mealType;
    setLoggedAt((prev) => loggedAtForDateKey(dateKeyFromIso(prev), mealType));
  }, [mealType]);

  function buildPendingConfirmForm(): PendingMealConfirmForm {
    return {
      draftId,
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
      confidence,
      logDate: dateKeyFromIso(loggedAt),
      loggedAt,
      totalPortions,
      portionsEaten,
      cloudImageUrl,
      localImageUri,
      isTextLog,
      selectedFriendIds,
      baseMacros,
      coachNudge,
    };
  }

  async function handleConfirm() {
    if (!requireLoggingAccess()) return;

    setSaving(true);
    setConfirmRetryable(false);
    try {
      const { id } = await confirmMeal({
        draftId,
        imageUrl: cloudImageUrl || undefined,
        mealName,
        mealType,
        foods,
        estimatedCalories: toNumber(calories, 0),
        protein: toNumber(protein, 0),
        carbs: toNumber(carbs, 0),
        fat: toNumber(fat, 0),
        fibre: toNumber(fibre, 0),
        sugar: toNumber(sugar, 0),
        sodium: toNumber(sodium, 0),
        confidence,
        portionMeta: buildMealPortionMeta(
          baseMacros,
          totalPortions,
          portionsEaten,
        ),
        loggedAt,
        shareWithFriendIds:
          selectedFriendIds.length > 0 ? selectedFriendIds : undefined,
      });
      if (localImageUri || displayImageUri) {
        await saveMealImage(id, localImageUri || displayImageUri);
      }
      if (userId) {
        await clearPendingConfirm(userId);
      }
      clearMealUploadSession(draftId);
      refreshAfterMealChange();
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)/timeline");
    } catch (e) {
      if (isLoggingLockedError(e)) {
        requireLoggingAccess();
      }
      const retryable = isRetryableError(e);
      setConfirmRetryable(retryable);
      setSnackbar(mealFlowErrorMessage(e, "confirm"));
      if (retryable && userId) {
        await savePendingConfirm(userId, buildPendingConfirmForm());
      }
    } finally {
      setSaving(false);
    }
  }

  const attachPhoto = useCallback(
    async (prepared: { uri: string; mimeType: string; fileName: string }) => {
      const result = await attachDraftPhoto(draftId, prepared);
      setLocalImageUri(prepared.uri);
      const nextCloudUrl = result.imageUrl || "";
      setCloudImageUrl(nextCloudUrl);
      const session = getMealUploadSession(draftId);
      if (session) {
        saveMealUploadSession(draftId, {
          ...session,
          localImageUri: prepared.uri,
          imageUrl: nextCloudUrl,
        });
      }
    },
    [draftId],
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

  function applyPortionScaling(
    macros: MealMacroTotals,
    total: number,
    eaten: number,
  ) {
    const scaled = scaleMealForPortions(macros, total, eaten);
    setCalories(String(scaled.estimatedCalories));
    setProtein(String(scaled.protein));
    setCarbs(String(scaled.carbs));
    setFat(String(scaled.fat));
    setFibre(String(scaled.fibre));
    setSugar(String(scaled.sugar));
    setSodium(String(scaled.sodium));
  }

  useEffect(() => {
    applyPortionScaling(baseMacros, totalPortions, portionsEaten);
  }, [totalPortions, portionsEaten, baseMacros]);

  const lowConfidence = confidence < 0.6;
  const macroCalories = toNumber(calories, 0);
  const macroProtein = toNumber(protein, 0);
  const macroCarbs = toNumber(carbs, 0);
  const macroFat = toNumber(fat, 0);
  const macroFibre = toNumber(fibre, 0);
  const macroSugar = toNumber(sugar, 0);
  const macroSodium = toNumber(sodium, 0);
  const dailyFibreGoal = profile?.nutritionTargets?.dailyFibreG;
  const personalisedFibreGoal = profile?.nutritionTargets != null;

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

  async function handleRefine() {
    const note = clarification.trim();
    if (!note) {
      setSnackbar("Add a quick fix note first (e.g. “sauce was peanut, not sesame”).");
      return;
    }
    setRefining(true);
    try {
      const result = await refineMeal(draftId, note);
      setMealName(result.mealName);
      setFoods(result.foods);
      const nextBase: MealMacroTotals = {
        estimatedCalories: result.estimatedCalories,
        protein: result.protein,
        carbs: result.carbs,
        fat: result.fat,
        fibre: result.fibre,
        sugar: result.sugar,
        sodium: result.sodium,
      };
      setBaseMacros(nextBase);
      applyPortionScaling(nextBase, totalPortions, portionsEaten);
      setConfidence(result.confidence);
      setCoachNudge(result.coachNudge);
      setClarification("");
      setSnackbar("Updated from your note");
    } catch (e) {
      setSnackbar(friendlyErrorMessage(e));
    } finally {
      setRefining(false);
    }
  }

  return (
    <KeyboardAvoidingScrollView
      style={[styles.scroll, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + spacing.xl }]}
    >
      <PremiumCard>
        <MealLogDateField
          loggedAt={loggedAt}
          onChange={setLoggedAt}
        />
        <MealTypePicker value={mealType} onChange={setMealType} />
      </PremiumCard>

      {isTextLog && !displayImageUri ? (
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
      ) : displayImageUri ? (
        <Image source={{ uri: displayImageUri }} style={styles.image} />
      ) : (
        <MealImagePlaceholder
          mealType={mealType}
          style={styles.image}
          iconSize={56}
        />
      )}

      {coachNudge ? (
        <PremiumCard>
          <Text variant="labelLarge" style={styles.coachLabel}>
            Coach
          </Text>
          <Text variant="bodyLarge" style={styles.coachText}>
            {coachNudge}
          </Text>
        </PremiumCard>
      ) : null}

      <SharedMealPortionsCard
        totalPortions={totalPortions}
        portionsEaten={portionsEaten}
        onTotalPortionsChange={setTotalPortions}
        onPortionsEatenChange={setPortionsEaten}
      />

      <ShareWithFriendsPicker
        selectedFriendIds={selectedFriendIds}
        onSelectionChange={setSelectedFriendIds}
      />

      <PremiumCard>
        {editing ? (
          <>
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
              calories={macroCalories}
              protein={macroProtein}
              carbs={macroCarbs}
              fat={macroFat}
              fibre={macroFibre}
              sugar={macroSugar}
              sodium={macroSodium}
              dailyFibreGoal={dailyFibreGoal}
              personalisedGoal={personalisedFibreGoal}
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
          </>
        ) : (
          <>
            <Text variant="headlineSmall" style={styles.mealTitle}>
              {mealName}
            </Text>
            <View style={styles.chips}>
              {foods.map((f) => (
                <Chip key={f}>{f}</Chip>
              ))}
            </View>
          </>
        )}

        {!editing ? (
          <MacroNutritionPanel
            calories={macroCalories}
            protein={macroProtein}
            carbs={macroCarbs}
            fat={macroFat}
            fibre={macroFibre}
            sugar={macroSugar}
            sodium={macroSodium}
            dailyFibreGoal={dailyFibreGoal}
            personalisedGoal={personalisedFibreGoal}
            confidence={confidence}
            showConfidence
          />
        ) : null}
        <Text variant="bodySmall" style={styles.confidenceCopy}>
          {lowConfidence
            ? isTextLog
              ? "Low confidence—add more detail with Edit or try a clearer description next time."
              : "Tricky photo—use Quick fix below or edit before saving."
            : "Looks good. You can edit foods and macros before saving."}
        </Text>
      </PremiumCard>

      {displayImageUri || !isTextLog ? (
        <PremiumCard>
          <Text variant="titleMedium" style={styles.quickFixTitle}>
            Quick fix
          </Text>
          <Text variant="bodySmall" style={styles.quickFixSub}>
            {isTextLog
              ? "One detail about this meal—we'll re-check using your photo."
              : "One detail about this plate—we'll re-analyze the same photo."}
          </Text>
          <TextInput
            label="What should change?"
            value={clarification}
            onChangeText={setClarification}
            mode="outlined"
            placeholder="e.g. sauce was peanut, not sesame"
            multiline
          />
          <Button
            mode="contained-tonal"
            icon="auto-fix"
            onPress={handleRefine}
            loading={refining}
            disabled={refining || saving || attachingPhoto}
            style={styles.refineBtn}
          >
            Refine analysis
          </Button>
        </PremiumCard>
      ) : null}

      <View style={styles.actions}>
        <Button mode="contained" onPress={handleConfirm} loading={saving} disabled={refining || attachingPhoto}>
          Confirm
        </Button>
        <Button mode="outlined" onPress={() => setEditing((e) => !e)} disabled={refining || attachingPhoto}>
          {editing ? "Done editing" : "Edit"}
        </Button>
      </View>

      <BottomSnackbar
        visible={!!snackbar}
        onDismiss={() => {
          setSnackbar(null);
          setConfirmRetryable(false);
        }}
        duration={confirmRetryable ? 8000 : 4000}
        action={
          confirmRetryable
            ? { label: "Retry", onPress: () => void handleConfirm() }
            : undefined
        }
      >
        {snackbar}
      </BottomSnackbar>
    </KeyboardAvoidingScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { padding: spacing.lg, gap: spacing.md },
  image: { width: "100%", height: 220, borderRadius: premium.imageRadius },
  coachLabel: { opacity: 0.55, letterSpacing: 0.8, textTransform: "uppercase" },
  coachText: { marginTop: spacing.xs, lineHeight: 24 },
  mealTitle: { letterSpacing: 0.2, marginBottom: spacing.sm },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.xs },
  sectionTitle: { marginTop: spacing.md, marginBottom: spacing.xs },
  macroGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  macroInput: { flexBasis: "48%" },
  confidenceCopy: { opacity: 0.65, marginTop: spacing.md, lineHeight: 18 },
  quickFixTitle: { letterSpacing: 0.15 },
  quickFixSub: { opacity: 0.65, marginBottom: spacing.sm, lineHeight: 18 },
  refineBtn: { marginTop: spacing.sm },
  actions: { gap: spacing.sm },
});
