import "react-native-gesture-handler";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PaperProvider } from "react-native-paper";
import { AuthProvider } from "@/context/AuthContext";
import { lifeplateTheme } from "@/src/theme/lifeplate";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={lifeplateTheme}>
        <AuthProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)/welcome" />
            <Stack.Screen name="(auth)/sign-in" />
            <Stack.Screen name="auth/callback" />
            <Stack.Screen name="onboarding/goal" />
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
        </AuthProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
