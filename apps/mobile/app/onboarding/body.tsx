import { router, Redirect } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Snackbar, Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { isOnboardingComplete, type Gender } from "@lifeplate/shared";
import { PremiumCard } from "@/components/PremiumCard";
import {
  BodyMetricsForm,
  isBodyMetricsFormComplete,
  toOptionalInt,
  toOptionalNumber,
} from "@/components/BodyMetricsForm";
import { PremiumHeader } from "@/components/PremiumHeader";
import { Screen } from "@/components/Screen";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/context/AuthContext";
import { updateProfile } from "@/lib/api";
import { friendlyErrorMessage } from "@/lib/apiErrors";
import { spacing } from "@/src/theme/lifeplate";

export default function BodyMetricsOnboardingScreen() {
  const { profile, profileLoading, patchProfile, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const [weightKg, setWeightKg] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<Gender | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prefilledRef = useRef(false);

  useEffect(() => {
    if (!profile || prefilledRef.current) return;
    if (profile.weightKg != null) setWeightKg(String(profile.weightKg));
    if (profile.heightCm != null) setHeightCm(String(profile.heightCm));
    if (profile.age != null) setAge(String(profile.age));
    if (profile.gender) setGender(profile.gender);
    prefilledRef.current = true;
  }, [profile]);

  if (profile && isOnboardingComplete(profile)) {
    return <Redirect href="/(tabs)" />;
  }

  if (profile && !profile.goal?.trim()) {
    return <Redirect href="/onboarding/goal" />;
  }

  const canContinue = isBodyMetricsFormComplete(weightKg, heightCm, age, gender);

  async function handleContinue() {
    if (!gender || !canContinue) return;

    const w = toOptionalNumber(weightKg);
    const h = toOptionalNumber(heightCm);
    const a = toOptionalInt(age);
    if (w == null || h == null || a == null) return;

    setSaving(true);
    setError(null);
    try {
      const updated = await updateProfile({
        weightKg: w,
        heightCm: h,
        age: a,
        gender,
      });
      patchProfile(updated);
      router.replace("/(tabs)");
    } catch (err) {
      setError(friendlyErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen scroll padded={false}>
      <PremiumHeader
        title="About you"
        subtitle="We use this to personalise your daily fibre and nutrition targets."
      />
      <View style={[styles.body, { paddingBottom: insets.bottom + spacing.xl }]}>
        {profileLoading && !profile ? (
          <PremiumCard noBlur style={styles.skeletonCard}>
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} width="100%" height={56} borderRadius={12} />
            ))}
            <Skeleton width="40%" height={18} style={styles.skeletonLabel} />
            <View style={styles.genderRow}>
              {[0, 1, 2].map((index) => (
                <Skeleton key={index} width={88} height={40} borderRadius={999} />
              ))}
            </View>
          </PremiumCard>
        ) : (
          <BodyMetricsForm
            weightKg={weightKg}
            heightCm={heightCm}
            age={age}
            gender={gender}
            onWeightKgChange={setWeightKg}
            onHeightCmChange={setHeightCm}
            onAgeChange={setAge}
            onGenderChange={setGender}
          />
        )}
        <Text variant="bodySmall" style={styles.note}>
          You can update these anytime in Profile.
        </Text>
        <Button
          mode="contained"
          onPress={handleContinue}
          loading={saving}
          disabled={!canContinue || saving}
          style={styles.cta}
        >
          Continue
        </Button>
        <Button
          mode="text"
          onPress={async () => {
            await signOut();
            router.replace("/(auth)/welcome");
          }}
          disabled={saving}
          style={styles.signOut}
        >
          Sign out
        </Button>
      </View>
      <Snackbar visible={!!error} onDismiss={() => setError(null)} duration={6000}>
        {error}
      </Snackbar>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.lg, gap: spacing.md },
  skeletonCard: { gap: spacing.sm },
  skeletonLabel: { marginTop: spacing.sm },
  genderRow: { flexDirection: "row", gap: spacing.sm },
  note: { opacity: 0.65, lineHeight: 18 },
  cta: { marginTop: spacing.sm },
  signOut: { alignSelf: "flex-start" },
});
