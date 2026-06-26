import { router, useFocusEffect } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActionSheetIOS, Alert, Platform, RefreshControl, Share, StyleSheet, View } from "react-native";
import { Button, IconButton } from "react-native-paper";
import { BottomSnackbar } from "@/components/ui/BottomSnackbar";
import type { Gender, UserProfile } from "@lifeplate/shared";
import {
  BodyMetricsForm,
  toOptionalInt,
  toOptionalNumber,
} from "@/components/BodyMetricsForm";
import { ProfileHeroCard } from "@/components/profile/ProfileHeroCard";
import { AppearanceSection } from "@/components/profile/AppearanceSection";
import { ProfileSaveBar } from "@/components/profile/ProfileSaveBar";
import { ProfileStatsRow } from "@/components/profile/ProfileStatsRow";
import { BadgeShelf } from "@/components/gamification/BadgeShelf";
import { PremiumCard } from "@/components/PremiumCard";
import { PremiumHeader } from "@/components/PremiumHeader";
import { Screen } from "@/components/Screen";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { PlusMembershipSection } from "@/components/plus/PlusMembershipSection";
import { PdfExportPreviewModal } from "@/components/pdf/PdfExportPreviewModal";
import { WidgetSetupSection } from "@/components/plus/WidgetSetupSection";
import { useAuth } from "@/context/AuthContext";
import { useFriends } from "@/context/FriendsContext";
import { useGamification } from "@/context/GamificationContext";
import {
  fetchMealsFull,
  fetchProfileAvatar,
  updateProfile,
  uploadProfileAvatar,
} from "@/lib/api";
import { getCachedAvatarUri, saveAvatarFromLocalUri } from "@/lib/avatarCache";
import { authFriendlyErrorMessage, friendlyErrorMessage, mediaPermissionMessage } from "@/lib/apiErrors";
import { exportUserData } from "@/lib/exportData";
import { prepareProfileImage } from "@/lib/imagePrep";
import { useAppColors } from "@/context/ThemeContext";
import { useThemedStyles } from "@/lib/useThemedStyles";
import { spacing } from "@/src/theme/lifeplate";
import type { AppColors } from "@/src/theme/lifeplate";
import { useGamificationStatsInput } from "@/lib/useGamificationStatsInput";

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
  const styles = useThemedStyles(createScreenStyles);
  const { semantic } = useAppColors();
  const { profile, linkProvider, patchProfile, refreshProfile, signOut } = useAuth();
  const { friendCode, loadFriends, refreshFriends } = useFriends();
  const { refreshGamification } = useGamification();
  const badgeStats = useGamificationStatsInput();
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
  const [pdfModalVisible, setPdfModalVisible] = useState(false);
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [linkingProvider, setLinkingProvider] = useState<"apple" | "google" | null>(null);

  useFocusEffect(
    useCallback(() => {
      void loadFriends().catch((e) => setSnackbar(friendlyErrorMessage(e)));
    }, [loadFriends]),
  );

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
      await refreshFriends();
      await refreshGamification();
    } catch (e) {
      setSnackbar(friendlyErrorMessage(e));
    } finally {
      setRefreshing(false);
    }
  }, [refreshProfile, profile, isDirty, resolveRemoteAvatar, refreshFriends, refreshGamification]);

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
    if (!canSave) return;

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

  async function handleExportPdf() {
    setPdfModalVisible(true);
  }

  async function pickAvatarFromSource(useCamera: boolean) {
    const permission = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      const message = mediaPermissionMessage(useCamera ? "camera" : "library", permission.canAskAgain);
      if (permission.canAskAgain === false) {
        Alert.alert("Permission needed", message, [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => void Linking.openSettings() },
        ]);
      } else {
        setSnackbar(message);
      }
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

  function handleShareFriendCode() {
    if (!friendCode) return;
    void Share.share({ message: friendCode }).then(() =>
      setSnackbar("Friend code ready to share"),
    );
  }

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/(tabs)");
  }

  async function handleLinkProvider(provider: "apple" | "google") {
    setLinkingProvider(provider);
    try {
      const linked = await linkProvider(provider);
      if (linked) {
        setSnackbar(provider === "apple" ? "Apple account linked" : "Google account linked");
      }
    } catch (e) {
      setSnackbar(authFriendlyErrorMessage(e));
    } finally {
      setLinkingProvider(null);
    }
  }

  function confirmSignOut() {
    Alert.alert("Sign out?", "You'll need to sign in again to access your meals.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: () => {
          void signOut().then(() => router.replace("/(auth)/welcome"));
        },
      },
    ]);
  }

  return (
    <Screen
      scroll
      padded={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => void handleRefresh()} />
      }
    >
      <PremiumHeader
        title="Profile"
        subtitle="Your account and preferences"
        left={
          <IconButton
            icon="arrow-left"
            size={22}
            onPress={handleBack}
            accessibilityLabel="Go back"
          />
        }
      />

      <View style={styles.body}>
        <ProfileHeroCard
          userId={profile?.id ?? null}
          hasAvatar={profile?.hasAvatar ?? false}
          remoteAvatarUrl={remoteAvatarUrl}
          name={name}
          goal={goal}
          email={profile?.email ?? null}
          isPaid={profile?.isPaid ?? false}
          friendCode={friendCode}
          avatarUploading={avatarUploading}
          avatarCacheRevision={avatarCacheRevision}
          onNameChange={(value) => {
            setIsDirty(true);
            setName(value);
          }}
          onGoalChange={(value) => {
            setIsDirty(true);
            setGoal(value);
          }}
          onAvatarPress={showAvatarPicker}
          onShareFriendCode={handleShareFriendCode}
        />

        <ProfileSaveBar
          visible={canSave}
          saving={saving}
          onSave={() => void handleSave()}
        />

        <ProfileStatsRow
          mealsLogged={profile?.mealsLogged ?? 0}
          currentStreak={profile?.currentStreak ?? 0}
          longestStreak={profile?.longestStreak ?? 0}
        />

        {badgeStats ? <BadgeShelf stats={badgeStats} /> : null}

        <SectionLabel title="Preferences" />
        <PremiumCard noBlur>
          <AppearanceSection />
        </PremiumCard>

        <SectionLabel title="Membership" />
        <PlusMembershipSection isPaid={profile?.isPaid ?? false} />

        <SectionLabel title="Widget" />
        <WidgetSetupSection isPaid={profile?.isPaid ?? false} />

        <SectionLabel title="Body" />
        <CollapsibleSection
          title="Body metrics"
          subtitle="Used for fibre and calorie targets"
          defaultExpanded={false}
        >
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
        </CollapsibleSection>

        <CollapsibleSection
          title="Linked accounts"
          subtitle="Connect Apple or Google sign-in"
          defaultExpanded={false}
        >
          <View style={styles.linkActions}>
            <Button
              mode="outlined"
              icon="apple"
              onPress={() => void handleLinkProvider("apple")}
              loading={linkingProvider === "apple"}
              disabled={linkingProvider !== null}
            >
              Link Apple
            </Button>
            <Button
              mode="outlined"
              icon="google"
              onPress={() => void handleLinkProvider("google")}
              loading={linkingProvider === "google"}
              disabled={linkingProvider !== null}
            >
              Link Google
            </Button>
          </View>
        </CollapsibleSection>

        <PremiumCard style={styles.footerCard} noBlur>
          <Button
            mode="text"
            icon="export-variant"
            onPress={() => void handleExport()}
            loading={exporting}
            disabled={exporting}
            contentStyle={styles.footerButtonContent}
          >
            Export data
          </Button>
          <View style={styles.footerDivider} />
          <Button
            mode="text"
            icon="file-pdf-box"
            onPress={() => void handleExportPdf()}
            disabled={exporting}
            contentStyle={styles.footerButtonContent}
          >
            Export PDF report
          </Button>
          <View style={styles.footerDivider} />
          <Button
            mode="text"
            icon="logout"
            textColor={semantic.danger}
            onPress={confirmSignOut}
            contentStyle={styles.footerButtonContent}
          >
            Sign out
          </Button>
        </PremiumCard>
      </View>

      <BottomSnackbar visible={!!snackbar} onDismiss={() => setSnackbar(null)} duration={4000}>
        {snackbar}
      </BottomSnackbar>

      <PdfExportPreviewModal
        visible={pdfModalVisible}
        onClose={() => setPdfModalVisible(false)}
        onExported={(message) => setSnackbar(message)}
      />
    </Screen>
  );
}

function createScreenStyles({ ui }: AppColors) {
  return StyleSheet.create({
    body: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
      gap: spacing.md,
    },
    linkActions: { gap: spacing.sm },
    footerCard: {
      gap: 0,
      paddingVertical: spacing.xs,
      marginTop: spacing.xs,
    },
    footerButtonContent: {
      justifyContent: "flex-start",
    },
    footerDivider: {
      height: 1,
      backgroundColor: ui.trackBackground,
      marginHorizontal: spacing.sm,
    },
  });
}
