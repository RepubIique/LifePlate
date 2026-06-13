import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "@/context/AuthContext";

export default function Index() {
  const { session, profile, loading, profileLoading } = useAuth();

  // Don't route until we know whether the profile has a goal.
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

  return <Redirect href="/(tabs)" />;
}
