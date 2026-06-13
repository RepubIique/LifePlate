import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Snackbar, Text, TextInput } from "react-native-paper";
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

export default function ProfileScreen() {
  const { profile, linkProvider, refreshProfile, signOut } = useAuth();
  const [name, setName] = useState(profile?.name ?? "");
  const [goal, setGoal] = useState(profile?.goal ?? "");
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  useEffect(() => {
    setName(profile?.name ?? "");
    setGoal(profile?.goal ?? "");
  }, [profile?.goal, profile?.name]);

  const canSave = useMemo(() => {
    const n = name.trim();
    const g = goal.trim();
    return (profile?.name ?? "") !== n || (profile?.goal ?? "") !== g;
  }, [goal, name, profile?.goal, profile?.name]);

  async function handleSave() {
    setSaving(true);
    try {
      await updateProfile({ name: name.trim() || undefined, goal: goal.trim() || undefined });
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
          <Button mode="contained" onPress={handleSave} disabled={!canSave} loading={saving}>
            Save
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
