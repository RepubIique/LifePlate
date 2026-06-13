import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Divider, Text, TextInput } from "react-native-paper";
import { PremiumCard } from "@/components/PremiumCard";
import { PremiumHeader } from "@/components/PremiumHeader";
import { Screen } from "@/components/Screen";
import { useAuth } from "@/context/AuthContext";
import { premium } from "@/src/theme/premium";
import { spacing } from "@/src/theme/lifeplate";

export default function SignInScreen() {
  const { signInWithEmail, signUpWithEmail, signInWithProvider } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      if (mode === "signin") {
        await signInWithEmail(email.trim(), password);
      } else {
        await signUpWithEmail(email.trim(), password);
      }
      router.replace("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleProvider(provider: "apple" | "google") {
    setLoading(true);
    setError(null);
    try {
      await signInWithProvider(provider);
      router.replace("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen scroll padded={false}>
      <PremiumHeader
        title={mode === "signin" ? "Sign in" : "Create account"}
        subtitle="Continue with Apple or Google, or use email."
      />
      <View style={styles.body}>
        <PremiumCard>
          <View style={styles.actions}>
            <Button mode="contained" onPress={() => handleProvider("apple")} disabled={loading}>
              Continue with Apple
            </Button>
            <Button mode="outlined" onPress={() => handleProvider("google")} disabled={loading}>
              Continue with Google
            </Button>

            <Divider style={styles.divider} />

            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              mode="outlined"
            />
            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              mode="outlined"
            />
            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              disabled={!email || !password}
            >
              {mode === "signin" ? "Sign in" : "Sign up"}
            </Button>
            <Button
              mode="text"
              onPress={() => setMode((m) => (m === "signin" ? "signup" : "signin"))}
            >
              {mode === "signin" ? "Create an account" : "I already have an account"}
            </Button>
            {error ? (
              <Text variant="bodySmall" style={styles.error}>
                {error}
              </Text>
            ) : null}
          </View>
        </PremiumCard>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  actions: { gap: spacing.sm },
  divider: { marginVertical: spacing.sm },
  error: { color: premium.danger, marginTop: spacing.xs },
});
