import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { Button, Chip, Snackbar, Text, TextInput } from "react-native-paper";
import { KeyboardAvoidingScrollView } from "@/components/Screen";
import { MacroNutritionPanel } from "@/components/MacroNutritionPanel";
import { PremiumCard } from "@/components/PremiumCard";
import { useAuth } from "@/context/AuthContext";
import { confirmMeal, refineMeal } from "@/lib/api";
import { friendlyErrorMessage } from "@/lib/apiErrors";
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
  const { profile } = useAuth();
  const params = useLocalSearchParams<{
    draftId: string;
    imageUrl: string;
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
  }>();

  const initialFoods = useMemo(() => {
    try {
      return JSON.parse(params.foods ?? "[]") as string[];
    } catch {
      return [];
    }
  }, [params.foods]);

  const [editing, setEditing] = useState(false);
  const [mealName, setMealName] = useState(params.mealName ?? "");
  const [foods, setFoods] = useState<string[]>(initialFoods);
  const [newFood, setNewFood] = useState("");
  const [calories, setCalories] = useState(
    String(toNumber(params.estimatedCalories, 0)),
  );
  const [protein, setProtein] = useState(String(toNumber(params.protein, 0)));
  const [carbs, setCarbs] = useState(String(toNumber(params.carbs, 0)));
  const [fat, setFat] = useState(String(toNumber(params.fat, 0)));
  const [fibre, setFibre] = useState(String(toNumber(params.fibre, 0)));
  const [sugar, setSugar] = useState(String(toNumber(params.sugar, 0)));
  const [sodium, setSodium] = useState(String(toNumber(params.sodium, 0)));
  const [confidence, setConfidence] = useState(toNumber(params.confidence, 0));
  const [coachNudge, setCoachNudge] = useState(params.coachNudge ?? "");
  const [clarification, setClarification] = useState("");
  const [refining, setRefining] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<string | null>(null);

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
      const result = await refineMeal(params.draftId, note);
      setMealName(result.mealName);
      setFoods(result.foods);
      setCalories(String(result.estimatedCalories));
      setProtein(String(result.protein));
      setCarbs(String(result.carbs));
      setFat(String(result.fat));
      setFibre(String(result.fibre));
      setSugar(String(result.sugar));
      setSodium(String(result.sodium));
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

  async function handleConfirm() {
    setSaving(true);
    try {
      await confirmMeal({
        draftId: params.draftId,
        imageUrl: params.imageUrl,
        mealName,
        foods,
        estimatedCalories: toNumber(calories, 0),
        protein: toNumber(protein, 0),
        carbs: toNumber(carbs, 0),
        fat: toNumber(fat, 0),
        fibre: toNumber(fibre, 0),
        sugar: toNumber(sugar, 0),
        sodium: toNumber(sodium, 0),
        confidence,
      });
      router.replace("/(tabs)");
    } catch (e) {
      setSnackbar(friendlyErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      {params.imageUrl ? (
        <Image source={{ uri: params.imageUrl }} style={styles.image} />
      ) : null}

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
            ? "Tricky photo—use Quick fix below or edit before saving."
            : "Looks good. You can edit foods and macros before saving."}
        </Text>
      </PremiumCard>

      <PremiumCard>
        <Text variant="titleMedium" style={styles.quickFixTitle}>
          Quick fix
        </Text>
        <Text variant="bodySmall" style={styles.quickFixSub}>
          One detail about this plate—we&apos;ll re-analyze the same photo.
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
          disabled={refining || saving}
          style={styles.refineBtn}
        >
          Refine analysis
        </Button>
      </PremiumCard>

      <View style={styles.actions}>
        <Button mode="contained" onPress={handleConfirm} loading={saving} disabled={refining}>
          Confirm
        </Button>
        <Button mode="outlined" onPress={() => setEditing((e) => !e)} disabled={refining}>
          {editing ? "Done editing" : "Edit"}
        </Button>
      </View>

      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar(null)} duration={4000}>
        {snackbar}
      </Snackbar>
    </KeyboardAvoidingScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#FFFFFF" },
  container: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
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
