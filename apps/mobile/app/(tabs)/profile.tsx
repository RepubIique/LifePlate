import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Snackbar, Text, TextInput } from "react-native-paper";
import { computeNutritionTargets } from "@lifeplate/shared";
import { PremiumCard } from "@/components/PremiumCard";
import { PremiumHeader } from "@/components/PremiumHeader";
import { Screen } from "@/components/Screen";
import { useAuth } from "@/context/AuthContext";
import { fetchMeals, updateProfile } from "@/lib/api";
import { friendlyErrorMessage } from "@/lib/apiErrors";
import { exportUserData } from "@/lib/exportData";
import { spacing } from "@/src/theme/lifeplate";

function toOptionalNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function toOptionalInt(value: string): number | null {
  const n = toOptionalNumber(value);
  return n == null ? null : Math.round(n);
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text variant="bodyMedium" style={styles.rowLabel}>
        {label}
      </Text>
      <Text variant="bodyLarge">{value}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { profile, linkProvider, refreshProfile, signOut } = useAuth();
  const [name, setName] = useState(profile?.name ?? "");
  const [goal, setGoal] = useState(profile?.goal ?? "");
  const [weightKg, setWeightKg] = useState(
    profile?.weightKg != null ? String(profile.weightKg) : "",
  );
  const [heightCm, setHeightCm] = useState(
    profile?.heightCm != null ? String(profile.heightCm) : "",
  );
  const [age, setAge] = useState(profile?.age != null ? String(profile.age) : "");
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  useEffect(() => {
    setName(profile?.name ?? "");
    setGoal(profile?.goal ?? "");
    setWeightKg(profile?.weightKg != null ? String(profile.weightKg) : "");
    setHeightCm(profile?.heightCm != null ? String(profile.heightCm) : "");
    setAge(profile?.age != null ? String(profile.age) : "");
  }, [
    profile?.age,
    profile?.goal,
    profile?.heightCm,
    profile?.name,
    profile?.weightKg,
  ]);

  const draftTargets = useMemo(
    () =>
      computeNutritionTargets({
        weightKg: toOptionalNumber(weightKg),
        heightCm: toOptionalNumber(heightCm),
        age: toOptionalInt(age),
      }),
    [age, heightCm, weightKg],
  );

  const canSave = useMemo(() => {
    const n = name.trim();
    const g = goal.trim();
    const w = toOptionalNumber(weightKg);
    const h = toOptionalNumber(heightCm);
    const a = toOptionalInt(age);
    return (
      (profile?.name ?? "") !== n ||
      (profile?.goal ?? "") !== g ||
      (profile?.weightKg ?? null) !== w ||
      (profile?.heightCm ?? null) !== h ||
      (profile?.age ?? null) !== a
    );
  }, [
    age,
    goal,
    heightCm,
    name,
    profile?.age,
    profile?.goal,
    profile?.heightCm,
    profile?.name,
    profile?.weightKg,
    weightKg,
  ]);

  async function handleSave() {
    setSaving(true);
    try {
      await updateProfile({
        name: name.trim() || undefined,
        goal: goal.trim() || undefined,
        weightKg: toOptionalNumber(weightKg),
        heightCm: toOptionalNumber(heightCm),
        age: toOptionalInt(age),
      });
      await refreshProfile();
      setSnackbar("Profile updated");
    } catch (e) {
      setSnackbar(friendlyErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  async function handleExport() {
    if (!profile) return;
    setExporting(true);
    try {
      const meals = await fetchMeals();
      await exportUserData(profile, meals);
      setSnackbar("Export ready");
    } catch (e) {
      setSnackbar(friendlyErrorMessage(e));
    } finally {
      setExporting(false);
    }
  }

  return (
    <Screen scroll padded={false}>
      <PremiumHeader
        title="Profile"
        subtitle={profile?.email ?? "Your account"}
      />
      <View style={styles.body}>
        <PremiumCard>
          <TextInput
            label="Name"
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Goal"
            value={goal}
            onChangeText={setGoal}
            mode="outlined"
            style={styles.input}
          />
        </PremiumCard>

        <PremiumCard>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Body metrics
          </Text>
          <Text variant="bodySmall" style={styles.sectionHint}>
            Used to estimate your daily fibre and calorie targets.
          </Text>
          <View style={styles.metricsGrid}>
            <TextInput
              label="Weight (kg)"
              value={weightKg}
              onChangeText={setWeightKg}
              keyboardType="decimal-pad"
              mode="outlined"
              style={styles.metricInput}
            />
            <TextInput
              label="Height (cm)"
              value={heightCm}
              onChangeText={setHeightCm}
              keyboardType="decimal-pad"
              mode="outlined"
              style={styles.metricInput}
            />
            <TextInput
              label="Age"
              value={age}
              onChangeText={setAge}
              keyboardType="number-pad"
              mode="outlined"
              style={styles.metricInput}
            />
          </View>
          {draftTargets ? (
            <View style={styles.targetsBox}>
              <ProfileRow
                label="Recommended fibre / day"
                value={`${draftTargets.dailyFibreG}g`}
              />
              <ProfileRow
                label="Estimated calories / day"
                value={`${draftTargets.dailyCalories} kcal`}
              />
            </View>
          ) : (
            <Text variant="bodySmall" style={styles.sectionHint}>
              Enter weight, height, and age to see personalised daily targets.
            </Text>
          )}
          <Button mode="contained" onPress={handleSave} disabled={!canSave} loading={saving}>
            Save profile
          </Button>
        </PremiumCard>

        <PremiumCard>
          <ProfileRow label="Meals logged" value={String(profile?.mealsLogged ?? 0)} />
          <ProfileRow
            label="Current streak"
            value={`${profile?.currentStreak ?? 0} days`}
          />
          <ProfileRow
            label="Longest streak"
            value={`${profile?.longestStreak ?? 0} days`}
          />
        </PremiumCard>

        <Text variant="titleMedium" style={styles.sectionLabel}>
          Linked accounts
        </Text>
        <PremiumCard noBlur>
          <View style={styles.linkActions}>
            <Button mode="outlined" onPress={() => linkProvider("apple")}>
              Link Apple
            </Button>
            <Button mode="outlined" onPress={() => linkProvider("google")}>
              Link Google
            </Button>
          </View>
        </PremiumCard>

        <Button mode="text" onPress={handleExport} loading={exporting} style={styles.export}>
          Export data
        </Button>
        <Button
          mode="outlined"
          onPress={async () => {
            await signOut();
            router.replace("/(auth)/welcome");
          }}
        >
          Sign out
        </Button>
      </View>

      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar(null)} duration={4000}>
        {snackbar}
      </Snackbar>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md },
  input: { marginBottom: spacing.sm },
  sectionTitle: { letterSpacing: 0.15, marginBottom: spacing.xs },
  sectionHint: { opacity: 0.65, lineHeight: 18, marginBottom: spacing.sm },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  metricInput: { flexBasis: "48%", flexGrow: 1 },
  targetsBox: { marginBottom: spacing.sm },
  row: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F3F5",
  },
  rowLabel: { opacity: 0.65, marginBottom: 2 },
  sectionLabel: { marginTop: spacing.sm, letterSpacing: 0.15 },
  linkActions: { gap: spacing.sm },
  export: { alignSelf: "flex-start" },
});
