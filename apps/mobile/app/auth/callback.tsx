import * as Linking from "expo-linking";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { authFriendlyErrorMessage } from "@/lib/apiErrors";
import { createSessionFromUrl } from "@/lib/authRedirect";
import { spacing } from "@/src/theme/lifeplate";

export default function AuthCallbackScreen() {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleUrl(url: string) {
    setBusy(true);
    setError(null);
    try {
      await createSessionFromUrl(url);
      router.replace("/");
    } catch (err) {
      setError(authFriendlyErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      if (url) void handleUrl(url);
    });

    const sub = Linking.addEventListener("url", ({ url }) => {
      void handleUrl(url);
    });

    return () => sub.remove();
  }, []);

  return (
    <View style={styles.container}>
      <Image
        source={require("@/assets/images/logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />
      {error ? (
        <>
          <Text variant="titleMedium" style={styles.title}>
            Sign-in didn&apos;t complete
          </Text>
          <Text variant="bodyMedium" style={styles.body}>
            {error}
          </Text>
          <Button mode="contained" loading={busy} onPress={() => router.replace("/(auth)/sign-in")}>
            Back to sign in
          </Button>
          <Button mode="text" onPress={() => router.replace("/(auth)/welcome")}>
            Go to welcome
          </Button>
        </>
      ) : (
        <>
          <ActivityIndicator size="large" color="#40916C" />
          <Text variant="bodyMedium" style={styles.body}>
            Finishing sign-in…
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
    gap: spacing.md,
    backgroundColor: "#FFFFFF",
  },
  logo: { width: 72, height: 72, marginBottom: spacing.sm },
  title: { color: "#1B4332", textAlign: "center" },
  body: { opacity: 0.65, textAlign: "center", lineHeight: 22 },
});
