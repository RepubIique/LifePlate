import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Snackbar, Text, TextInput } from "react-native-paper";
import type { Gender, UserProfile } from "@lifeplate/shared";
import {
  BodyMetricsForm,
  toOptionalInt,
  toOptionalNumber,
} from "@/components/BodyMetricsForm";
import { PremiumCard } from "@/components/PremiumCard";
import { PremiumHeader } from "@/components/PremiumHeader";
import { Screen } from "@/components/Screen";
import { useAuth } from "@/context/AuthContext";
import { fetchMeals, updateProfile } from "@/lib/api";
import { friendlyErrorMessage } from "@/lib/apiErrors";
import { exportUserData } from "@/lib/exportData";
import { spacing } from "@/src/theme/lifeplate";

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

function metricEqual(stored: number | null, draft: number | null): boolean {
  if (stored == null && draft == null) return true;
  if (stored == null || draft == null) return false;
  return Math.abs(stored - draft) < 0.01;
}

function applyProfileToForm(
  profile: UserProfile | null | undefined,
  setters: {
    setName: (v: string) => void;
    setGoal: (v: string) => void;
    setWeightKg: (v: string) => void;
    setHeightCm: (v: string) => void;
    setAge: (v: string) => void;
    setGender: (v: Gender | null) => void;
  },
) {
  setters.setName(profile?.name ?? "");
  setters.setGoal(profile?.goal ?? "");
  setters.setWeightKg(profile?.weightKg != null ? String(profile.weightKg) : "");
  setters.setHeightCm(profile?.heightCm != null ? String(profile.heightCm) : "");
  setters.setAge(profile?.age != null ? String(profile.age) : "");
  setters.setGender(profile?.gender ?? null);
}

export default function ProfileScreen() {
  const { profile, linkProvider, patchProfile, refreshProfile, signOut } = useAuth();
  const [name, setName] = useState(profile?.name ?? "");
  const [goal, setGoal] = useState(profile?.goal ?? "");
  const [weightKg, setWeightKg] = useState(
    profile?.weightKg != null ? String(profile.weightKg) : "",
  );
  const [heightCm, setHeightCm] = useState(
    profile?.heightCm != null ? String(profile.heightCm) : "",
  );
  const [age, setAge] = useState(profile?.age != null ? String(profile.age) : "");
  const [gender, setGender] = useState<Gender | null>(profile?.gender ?? null);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setIsDirty(false);
  }, [profile?.id]);

  useEffect(() => {
    if (isDirty || !profile) return;
    applyProfileToForm(profile, {
      setName,
      setGoal,
      setWeightKg,
      setHeightCm,
      setAge,
      setGender,
    });
  }, [
    isDirty,
    profile,
    profile?.age,
    profile?.gender,
    profile?.goal,
    profile?.heightCm,
    profile?.name,
    profile?.weightKg,
  ]);

  useFocusEffect(
    useCallback(() => {
      setIsDirty(false);
      void (async () => {
        const latest = await refreshProfile();
        if (latest) {
          applyProfileToForm(latest, {
            setName,
            setGoal,
            setWeightKg,
            setHeightCm,
            setAge,
            setGender,
          });
        } else {
          setSnackbar("Could not refresh profile — showing last saved data");
        }
      })();
    }, [refreshProfile]),
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
      !metricEqual(profile?.weightKg ?? null, w) ||
      !metricEqual(profile?.heightCm ?? null, h) ||
      (profile?.age ?? null) !== a ||
      (profile?.gender ?? null) !== gender
    );
  }, [
    age,
    gender,
    goal,
    heightCm,
    name,
    profile?.age,
    profile?.gender,
    profile?.goal,
    profile?.heightCm,
    profile?.name,
    profile?.weightKg,
    weightKg,
  ]);

  async function handleSave() {
    if (!canSave) {
      setSnackbar("No changes to save");
      return;
    }

    setSaving(true);
    try {
      const updated = await updateProfile({
        name: name.trim() || undefined,
        goal: goal.trim() || undefined,
        weightKg: toOptionalNumber(weightKg),
        heightCm: toOptionalNumber(heightCm),
        age: toOptionalInt(age),
        gender,
      });
      setIsDirty(false);
      patchProfile(updated);
      applyProfileToForm(updated, {
        setName,
        setGoal,
        setWeightKg,
        setHeightCm,
        setAge,
        setGender,
      });
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
            onChangeText={(value) => {
              setIsDirty(true);
              setName(value);
            }}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Goal"
            value={goal}
            onChangeText={(value) => {
              setIsDirty(true);
              setGoal(value);
            }}
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
          <BodyMetricsForm
            weightKg={weightKg}
            heightCm={heightCm}
            age={age}
            gender={gender}
            onWeightKgChange={(value) => {
              setIsDirty(true);
              setWeightKg(value);
            }}
            onHeightCmChange={(value) => {
              setIsDirty(true);
              setHeightCm(value);
            }}
            onAgeChange={(value) => {
              setIsDirty(true);
              setAge(value);
            }}
            onGenderChange={(value) => {
              setIsDirty(true);
              setGender(value);
            }}
          />
          <Button mode="contained" onPress={handleSave} disabled={saving} loading={saving}>
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
