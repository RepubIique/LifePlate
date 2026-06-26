import { Redirect, type Href } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Image, StyleSheet, View } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";
import { isOnboardingComplete } from "@lifeplate/shared";
import { useAuth } from "@/context/AuthContext";
import { useAppColors } from "@/context/ThemeContext";
import { spacing } from "@/src/theme/lifeplate";

export default function Index() {
  const theme = useTheme();
  const { semantic } = useAppColors();
  const { session, profile, loading, profileLoading, loadProfile, signOut } = useAuth();
  const [retrying, setRetrying] = useState(false);

  if (loading || (session && profileLoading && !profile)) {
    return (
      <View style={[styles.boot, { backgroundColor: theme.colors.background }]}>
        <Image
          source={require("@/assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color={semantic.primary} />
        <Text variant="bodySmall" style={styles.bootHint}>
          Loading your plate…
        </Text>
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (!profile) {
    return (
      <View style={[styles.boot, { backgroundColor: theme.colors.background }]}>
        <Image
          source={require("@/assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text variant="titleMedium" style={[styles.errorTitle, { color: semantic.primary }]}>
          Couldn&apos;t load your profile
        </Text>
        <Text variant="bodyMedium" style={styles.errorBody}>
          Check your connection and try again.
        </Text>
        <Button
          mode="contained"
          loading={retrying}
          onPress={async () => {
            setRetrying(true);
            try {
              await loadProfile({ force: true });
            } finally {
              setRetrying(false);
            }
          }}
        >
          Retry
        </Button>
        <Button
          mode="text"
          onPress={async () => {
            await signOut();
          }}
        >
          Sign out
        </Button>
      </View>
    );
  }

  if (isOnboardingComplete(profile)) {
    return <Redirect href="/(tabs)" />;
  }

  if (!profile.goal?.trim()) {
    return <Redirect href="/onboarding/goal" />;
  }

  return <Redirect href={"/onboarding/body" as Href} />;
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
    gap: spacing.md,
  },
  logo: { width: 88, height: 88 },
  bootHint: { opacity: 0.5 },
  errorTitle: { textAlign: "center" },
  errorBody: { opacity: 0.65, textAlign: "center", lineHeight: 22 },
});
