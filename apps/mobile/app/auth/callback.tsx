import * as Linking from "expo-linking";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Text } from "react-native-paper";
import { createSessionFromUrl } from "@/lib/authRedirect";

export default function AuthCallbackScreen() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleUrl(url: string) {
      try {
        await createSessionFromUrl(url);
        router.replace("/");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Sign-in link failed");
      }
    }

    Linking.getInitialURL().then((url) => {
      if (url) void handleUrl(url);
    });

    const sub = Linking.addEventListener("url", ({ url }) => {
      void handleUrl(url);
    });

    return () => sub.remove();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
      {error ? (
        <Text variant="bodyLarge">{error}</Text>
      ) : (
        <ActivityIndicator size="large" />
      )}
    </View>
  );
}
