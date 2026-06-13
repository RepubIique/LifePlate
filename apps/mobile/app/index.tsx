import { Redirect, type Href } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { isOnboardingComplete } from "@lifeplate/shared";
import { useAuth } from "@/context/AuthContext";

export default function Index() {
  const { session, profile, loading, profileLoading } = useAuth();

  if (loading || (session && profileLoading && !profile)) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/welcome" />;
  }

  // Profile fetch failed and no local cache — go to app, not onboarding.
  if (!profile) {
    return <Redirect href="/(tabs)" />;
  }

  if (isOnboardingComplete(profile)) {
    return <Redirect href="/(tabs)" />;
  }

  if (!profile.goal?.trim()) {
    return <Redirect href="/onboarding/goal" />;
  }

  return <Redirect href={"/onboarding/body" as Href} />;
}
