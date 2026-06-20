import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Divider, Text, TextInput } from "react-native-paper";
import { PremiumCard } from "@/components/PremiumCard";
import { PremiumHeader } from "@/components/PremiumHeader";
import { Screen } from "@/components/Screen";
import { useAuth } from "@/context/AuthContext";
import { authFriendlyErrorMessage } from "@/lib/apiErrors";
import { supabase } from "@/lib/supabase";
import { premium } from "@/src/theme/premium";
import { spacing } from "@/src/theme/lifeplate";

export default function SignInScreen() {
  const { signInWithEmail, signUpWithEmail, signInWithProvider } = useAuth();
  const { mode: modeParam } = useLocalSearchParams<{ mode?: string }>();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (modeParam === "signup") {
      setMode("signup");
    }
  }, [modeParam]);

  const canSubmit = email.trim().length > 0 && password.length > 0;

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      if (mode === "signin") {
        await signInWithEmail(email.trim(), password);
        router.replace("/");
        return;
      }

      await signUpWithEmail(email.trim(), password);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setInfo("Check your email to confirm your account, then sign in.");
        setMode("signin");
        return;
      }
      router.replace("/");
    } catch (e) {
      setError(authFriendlyErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleProvider(provider: "apple" | "google") {
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const completed = await signInWithProvider(provider);
      if (!completed) return;
      router.replace("/");
    } catch (e) {
      setError(authFriendlyErrorMessage(e));
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
            <Button
              mode="contained"
              icon="apple"
              onPress={() => handleProvider("apple")}
              disabled={loading}
            >
              Continue with Apple
            </Button>
            <Button
              mode="outlined"
              icon="google"
              onPress={() => handleProvider("google")}
              disabled={loading}
            >
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
              disabled={loading}
            />
            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              mode="outlined"
              disabled={loading}
            />
            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              disabled={!canSubmit || loading}
            >
              {mode === "signin" ? "Sign in" : "Sign up"}
            </Button>
            {!canSubmit ? (
              <Text variant="bodySmall" style={styles.hint}>
                Enter your email and password to continue.
              </Text>
            ) : null}
            <Button
              mode="text"
              onPress={() => {
                setMode((m) => (m === "signin" ? "signup" : "signin"));
                setError(null);
                setInfo(null);
              }}
              disabled={loading}
            >
              {mode === "signin" ? "Create an account" : "I already have an account"}
            </Button>
            {info ? (
              <Text variant="bodySmall" style={styles.info}>
                {info}
              </Text>
            ) : null}
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
  hint: { opacity: 0.55, textAlign: "center" },
  info: { color: "#1B4332", marginTop: spacing.xs, lineHeight: 20 },
  error: { color: premium.danger, marginTop: spacing.xs },
});
