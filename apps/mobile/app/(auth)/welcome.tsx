import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { PremiumCard } from "@/components/PremiumCard";
import { Screen } from "@/components/Screen";
import { spacing } from "@/src/theme/lifeplate";

export default function WelcomeScreen() {
  return (
    <Screen>
      <View style={styles.hero}>
        <PremiumCard>
          <Text variant="headlineLarge" style={styles.title}>
            Welcome to LifePlate
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Take photos of your meals.{"\n"}
            Build your health story.{"\n"}
            Understand what you&apos;re feeding your future.
          </Text>
        </PremiumCard>
      </View>
      <View style={styles.actions}>
        <Button mode="contained" onPress={() => router.push("/(auth)/sign-in")}>
          Get Started
        </Button>
        <Button mode="outlined" onPress={() => router.push("/(auth)/sign-in")}>
          Sign In
        </Button>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { flex: 1, justifyContent: "center" },
  title: { letterSpacing: 0.3, marginBottom: spacing.md },
  subtitle: { opacity: 0.8, lineHeight: 26 },
  actions: { gap: spacing.sm },
});
