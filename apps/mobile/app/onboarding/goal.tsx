import { router, Redirect, type Href } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { BottomSnackbar } from "@/components/ui/BottomSnackbar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GOALS, isOnboardingComplete, type UserGoal } from "@lifeplate/shared";
import { PremiumCard } from "@/components/PremiumCard";
import { PremiumHeader } from "@/components/PremiumHeader";
import { Screen } from "@/components/Screen";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/context/AuthContext";
import { updateGoal } from "@/lib/api";
import { friendlyErrorMessage } from "@/lib/apiErrors";
import { spacing } from "@/src/theme/lifeplate";

export default function GoalScreen() {
  const { profile, profileLoading, patchProfile, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const [goal, setGoal] = useState<UserGoal>(GOALS[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (profile && isOnboardingComplete(profile)) {
    return <Redirect href="/(tabs)" />;
  }

  if (profile?.goal?.trim()) {
    return <Redirect href={"/onboarding/body" as Href} />;
  }

  async function handleContinue() {
    setSaving(true);
    setError(null);
    try {
      const updated = await updateGoal(goal);
      patchProfile(updated);
      const nextProfile = profile ? { ...profile, ...updated } : null;
      if (nextProfile && isOnboardingComplete(nextProfile)) {
        router.replace("/(tabs)");
      } else {
        router.replace("/onboarding/body" as Href);
      }
    } catch (err) {
      setError(friendlyErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen scroll padded={false}>
      <PremiumHeader
        title="What is your goal?"
        subtitle="We’ll tailor your experience. You can change this later."
      />
      <View style={[styles.body, { paddingBottom: insets.bottom + spacing.xl }]}>
        {profileLoading && !profile ? (
          <>
            {[0, 1, 2].map((index) => (
              <PremiumCard key={index} noBlur style={styles.goalCard}>
                <Skeleton width="70%" height={22} />
              </PremiumCard>
            ))}
          </>
        ) : (
          GOALS.map((g) => {
          const selected = goal === g;
          return (
            <Pressable key={g} onPress={() => setGoal(g)}>
              <PremiumCard
                noBlur
                style={[styles.goalCard, selected && styles.goalCardSelected]}
              >
                <Text variant="bodyLarge" style={selected ? styles.goalTextSelected : undefined}>
                  {g}
                </Text>
              </PremiumCard>
            </Pressable>
          );
        })
        )}
        <Button mode="contained" onPress={handleContinue} loading={saving} style={styles.cta}>
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
      <BottomSnackbar visible={!!error} onDismiss={() => setError(null)} duration={6000}>
        {error}
      </BottomSnackbar>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  goalCard: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xs,
  },
  goalCardSelected: {
    borderColor: "#1B4332",
    backgroundColor: "#F8FBF9",
  },
  goalTextSelected: { color: "#1B4332" },
  cta: { marginTop: spacing.lg },
  signOut: { alignSelf: "flex-start" },
});
