import { Redirect, type Href } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { isOnboardingComplete } from "@lifeplate/shared";
import { useAuth } from "@/context/AuthContext";

export default function Index() {
  const { session, profile, loading, profileLoading } = useAuth();

  if (loading || (session && profileLoading)) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (!profile?.goal) {
    return <Redirect href="/onboarding/goal" />;
  }

  if (
    !profile ||
    !isOnboardingComplete(profile)
  ) {
    return <Redirect href={"/onboarding/body" as Href} />;
  }

  return <Redirect href="/(tabs)" />;
}
