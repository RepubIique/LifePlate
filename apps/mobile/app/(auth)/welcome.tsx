import { router } from "expo-router";
import { Image, StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { PremiumCard } from "@/components/PremiumCard";
import { Screen } from "@/components/Screen";
import { spacing } from "@/src/theme/lifeplate";

export default function WelcomeScreen() {
  return (
    <Screen>
      <View style={styles.hero}>
        <Image source={require("@/assets/images/logo.png")} style={styles.logo} resizeMode="contain" />
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
  hero: { flex: 1, justifyContent: "center", alignItems: "center", gap: spacing.lg },
  logo: { width: 96, height: 96 },
  title: { letterSpacing: 0.3, marginBottom: spacing.md },
  subtitle: { opacity: 0.8, lineHeight: 26 },
  actions: { gap: spacing.sm },
});
