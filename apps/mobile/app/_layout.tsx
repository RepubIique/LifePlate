import "react-native-gesture-handler";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { PlusPaywallProvider } from "@/context/PlusPaywallContext";
import { FriendsProvider } from "@/context/FriendsContext";
import { GamificationProvider } from "@/context/GamificationContext";
import { MealsProvider } from "@/context/MealsContext";
import { NutritionDashboardProvider } from "@/context/NutritionDashboardContext";
import { WeekInsightsProvider } from "@/context/WeekInsightsContext";
import { HydrationProvider } from "@/context/HydrationContext";
import { PendingLogDateProvider } from "@/context/PendingLogDateContext";
import { WidgetQuickActionProvider } from "@/context/WidgetQuickActionContext";
import { AlphaFeedbackBubble } from "@/components/AlphaFeedbackBubble";
import { AlphaWelcomeModal } from "@/components/AlphaWelcomeModal";
import { MealPendingSync } from "@/components/meal/PendingMealRecoveryModal";
import { DigitalPlateWidgetSync } from "@/components/plus/DigitalPlateWidgetSync";
import { WidgetInteractionHandler } from "@/components/plus/WidgetInteractionHandler";
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
      <ThemeProvider>
        <AuthProvider>
          <WidgetQuickActionProvider>
          <PlusPaywallProvider>
          <MealsProvider>
          <FriendsProvider>
          <GamificationProvider>
          <PendingLogDateProvider>
          <NutritionDashboardProvider>
          <WeekInsightsProvider>
          <HydrationProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)/welcome" />
            <Stack.Screen name="(auth)/sign-in" />
            <Stack.Screen name="auth/callback" />
            <Stack.Screen name="onboarding/goal" />
            <Stack.Screen name="onboarding/body" />
            <Stack.Screen name="profile" />
            <Stack.Screen name="log/camera" />
            <Stack.Screen name="friend/[id]" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="meal/result"
              options={{ presentation: "modal", headerShown: true, title: "Your meal" }}
            />
            <Stack.Screen
              name="meal/edit"
              options={{ presentation: "modal", headerShown: true, title: "Edit meal" }}
            />
            <Stack.Screen
              name="meal/plan"
              options={{ presentation: "modal", headerShown: true, title: "Planned meal" }}
            />
          </Stack>
          <AlphaFeedbackBubble />
          <AlphaWelcomeModal />
          <MealPendingSync />
          <DigitalPlateWidgetSync />
          <WidgetInteractionHandler />
          </HydrationProvider>
          </WeekInsightsProvider>
          </NutritionDashboardProvider>
          </PendingLogDateProvider>
          </GamificationProvider>
          </FriendsProvider>
          </MealsProvider>
          </PlusPaywallProvider>
          </WidgetQuickActionProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
