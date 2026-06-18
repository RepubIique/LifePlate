import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActionSheetIOS, Alert, Platform, RefreshControl, StyleSheet, View } from "react-native";
import { Button, Snackbar, Switch, Text, TextInput } from "react-native-paper";
import type { Gender, UserProfile } from "@lifeplate/shared";
import {
  BodyMetricsForm,
  toOptionalInt,
  toOptionalNumber,
} from "@/components/BodyMetricsForm";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { ProfileStatsRow } from "@/components/profile/ProfileStatsRow";
import { PremiumCard } from "@/components/PremiumCard";
import { Screen } from "@/components/Screen";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { useAuth } from "@/context/AuthContext";
import { fetchMealsFull, fetchProfileAvatar, updateProfile, uploadProfileAvatar } from "@/lib/api";
import { getCachedAvatarUri, saveAvatarFromLocalUri } from "@/lib/avatarCache";
import { friendlyErrorMessage } from "@/lib/apiErrors";
import { exportUserData } from "@/lib/exportData";
import { prepareProfileImage } from "@/lib/imagePrep";
import { spacing } from "@/src/theme/lifeplate";

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

function metricEqual(stored: number | null, draft: number | null): boolean {
  if (stored == null && draft == null) return true;
  if (stored == null || draft == null) return false;
  return Math.abs(stored - draft) < 0.01;
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
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarCacheRevision, setAvatarCacheRevision] = useState(0);
  const [remoteAvatarUrl, setRemoteAvatarUrl] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

  const resolveRemoteAvatar = useCallback(async (latest: UserProfile) => {
    if (!latest.hasAvatar || !latest.id) {
      setRemoteAvatarUrl(null);
      return;
    }

    const cached = await getCachedAvatarUri(latest.id);
    if (cached) {
      setRemoteAvatarUrl(null);
      return;
    }

    const { avatarUrl } = await fetchProfileAvatar();
    setRemoteAvatarUrl(avatarUrl);
  }, []);

  useEffect(() => {
    if (!profile) return;
    void resolveRemoteAvatar(profile).catch((e) =>
      setSnackbar(friendlyErrorMessage(e)),
    );
  }, [profile, profile?.hasAvatar, profile?.id, resolveRemoteAvatar]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const latest = await refreshProfile();
      if (!latest) {
        if (!profile) {
          setSnackbar("Could not refresh profile — showing last saved data");
        }
        return;
      }

      if (!isDirty) {
        applyProfileToForm(latest, {
          setName,
          setGoal,
          setWeightKg,
          setHeightCm,
          setAge,
          setGender,
        });
      }

      await resolveRemoteAvatar(latest);
    } catch (e) {
      setSnackbar(friendlyErrorMessage(e));
    } finally {
      setRefreshing(false);
    }
  }, [refreshProfile, profile, isDirty, resolveRemoteAvatar]);

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
      setSnackbar("Profile updated");
    } catch (e) {
      setSnackbar(friendlyErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  async function handleCloudBackupToggle(enabled: boolean) {
    if (!profile?.isPaid) {
      setSnackbar("Cloud photo backup requires LifePlate Plus.");
      return;
    }
    try {
      const updated = await updateProfile({ cloudImageBackup: enabled });
      patchProfile(updated);
      setSnackbar(enabled ? "Cloud backup enabled" : "Cloud backup disabled");
    } catch (e) {
      setSnackbar(friendlyErrorMessage(e));
    }
  }

  async function handleExport() {
    if (!profile) return;
    setExporting(true);
    try {
      const fullMeals = await fetchMealsFull();
      await exportUserData(profile, fullMeals);
      setSnackbar("Export ready");
    } catch (e) {
      setSnackbar(friendlyErrorMessage(e));
    } finally {
      setExporting(false);
    }
  }

  async function pickAvatarFromSource(useCamera: boolean) {
    const permission = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setSnackbar("Permission required to access photos or camera.");
      return;
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({
          quality: 0.85,
          allowsEditing: true,
          aspect: [1, 1],
        })
      : await ImagePicker.launchImageLibraryAsync({
          quality: 0.85,
          allowsEditing: true,
          aspect: [1, 1],
        });

    if (result.canceled || !result.assets[0]) return;

    setAvatarUploading(true);
    try {
      const prepared = await prepareProfileImage(result.assets[0].uri);
      const { avatarUrl } = await uploadProfileAvatar(prepared);
      if (profile?.id) {
        await saveAvatarFromLocalUri(profile.id, prepared.uri);
        setAvatarCacheRevision((v) => v + 1);
      }
      setRemoteAvatarUrl(avatarUrl);
      patchProfile({ hasAvatar: true });
      setSnackbar("Profile photo updated");
    } catch (e) {
      setSnackbar(friendlyErrorMessage(e));
    } finally {
      setAvatarUploading(false);
    }
  }

  function showAvatarPicker() {
    const options = ["Take photo", "Choose from library", "Cancel"];
    const cancelIndex = 2;

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: cancelIndex,
        },
        (index) => {
          if (index === 0) void pickAvatarFromSource(true);
          if (index === 1) void pickAvatarFromSource(false);
        },
      );
      return;
    }

    Alert.alert("Profile photo", "Update your profile picture", [
      { text: "Take photo", onPress: () => void pickAvatarFromSource(true) },
      { text: "Choose from library", onPress: () => void pickAvatarFromSource(false) },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  const displayName = name.trim() || profile?.name?.trim() || "Your profile";

  return (
    <Screen
      scroll
      padded={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => void handleRefresh()} />
      }
    >
      <View style={styles.body}>
        <PremiumCard style={styles.hero}>
          <ProfileAvatar
            userId={profile?.id ?? null}
            hasAvatar={profile?.hasAvatar ?? false}
            remoteAvatarUrl={remoteAvatarUrl}
            name={displayName}
            uploading={avatarUploading}
            cacheRevision={avatarCacheRevision}
            onPress={showAvatarPicker}
          />
          <Text variant="headlineSmall" style={styles.heroName}>
            {displayName}
          </Text>
          <Text variant="bodyMedium" style={styles.heroEmail}>
            {profile?.email ?? "Your account"}
          </Text>
          <Text variant="bodySmall" style={styles.avatarHint}>
            Tap photo to update
          </Text>
        </PremiumCard>

        <ProfileStatsRow
          mealsLogged={profile?.mealsLogged ?? 0}
          currentStreak={profile?.currentStreak ?? 0}
          longestStreak={profile?.longestStreak ?? 0}
        />

        <SectionLabel title="About you" />
        <PremiumCard style={styles.formCard}>
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
            placeholder="e.g. Increase protein"
            style={styles.input}
          />
        </PremiumCard>

        <SectionLabel
          title="Body metrics"
          subtitle="Used to estimate your daily fibre and calorie targets"
        />
        <PremiumCard style={styles.formCard}>
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
          <Button
            mode="contained"
            onPress={handleSave}
            disabled={saving || !canSave}
            loading={saving}
            style={styles.saveButton}
          >
            Save changes
          </Button>
        </PremiumCard>

        <SectionLabel title="LifePlate Plus" />
        <PremiumCard style={styles.formCard} noBlur>
          <View style={styles.switchRow}>
            <View style={styles.switchCopy}>
              <Text variant="titleMedium">Cloud photo backup</Text>
              <Text variant="bodySmall" style={styles.switchHint}>
                {profile?.isPaid
                  ? "Also store meal photos in the cloud for multi-device access."
                  : "Upgrade to Plus to back up meal photos across devices."}
              </Text>
            </View>
            <Switch
              value={profile?.cloudImageBackup ?? false}
              onValueChange={handleCloudBackupToggle}
              disabled={!profile?.isPaid}
            />
          </View>
        </PremiumCard>

        <SectionLabel title="Account" />
        <PremiumCard style={styles.formCard} noBlur>
          <View style={styles.linkActions}>
            <Button mode="outlined" icon="apple" onPress={() => linkProvider("apple")}>
              Link Apple
            </Button>
            <Button mode="outlined" icon="google" onPress={() => linkProvider("google")}>
              Link Google
            </Button>
          </View>
        </PremiumCard>

        <View style={styles.actions}>
          <Button
            mode="text"
            icon="export-variant"
            onPress={handleExport}
            loading={exporting}
            disabled={exporting}
          >
            Export data
          </Button>
          <Button
            mode="outlined"
            icon="logout"
            textColor="#c0392b"
            onPress={async () => {
              await signOut();
              router.replace("/(auth)/welcome");
            }}
          >
            Sign out
          </Button>
        </View>
      </View>

      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar(null)} duration={4000}>
        {snackbar}
      </Snackbar>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  hero: {
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: "#F8FBF9",
    paddingVertical: spacing.xl,
  },
  heroName: {
    marginTop: spacing.sm,
    letterSpacing: 0.15,
    color: "#1B4332",
  },
  heroEmail: { opacity: 0.6 },
  avatarHint: { opacity: 0.45, marginTop: 2 },
  formCard: { gap: spacing.sm },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  switchCopy: { flex: 1, gap: 4 },
  switchHint: { opacity: 0.65 },
  input: { backgroundColor: "#FFFFFF" },
  saveButton: { marginTop: spacing.sm },
  linkActions: { gap: spacing.sm },
  actions: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
});
