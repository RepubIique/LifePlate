import "react-native-gesture-handler";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaperProvider } from "react-native-paper";
import { AuthProvider } from "@/context/AuthContext";
import { MealsProvider } from "@/context/MealsContext";
import { NutritionDashboardProvider } from "@/context/NutritionDashboardContext";
import { HydrationProvider } from "@/context/HydrationContext";
import { PendingLogDateProvider } from "@/context/PendingLogDateContext";
import { AlphaFeedbackBubble } from "@/components/AlphaFeedbackBubble";
import { lifeplateTheme } from "@/src/theme/lifeplate";
import { assertMobileEnv } from "@/lib/env";

assertMobileEnv();

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    ...MaterialCommunityIcons.font,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={lifeplateTheme}>
        <AuthProvider>
          <MealsProvider>
          <PendingLogDateProvider>
          <NutritionDashboardProvider>
          <HydrationProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)/welcome" />
            <Stack.Screen name="(auth)/sign-in" />
            <Stack.Screen name="auth/callback" />
            <Stack.Screen name="onboarding/goal" />
            <Stack.Screen name="onboarding/body" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="meal/result"
              options={{ presentation: "modal", headerShown: true, title: "Your meal" }}
            />
            <Stack.Screen
              name="meal/edit"
              options={{ presentation: "modal", headerShown: true, title: "Edit meal" }}
            />
          </Stack>
          <AlphaFeedbackBubble />
          </HydrationProvider>
          </NutritionDashboardProvider>
          </PendingLogDateProvider>
          </MealsProvider>
        </AuthProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
