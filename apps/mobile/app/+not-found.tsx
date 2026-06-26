import { router, Stack } from "expo-router";
import { Image, StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { Screen } from "@/components/Screen";
import { useThemedStyles } from "@/lib/useThemedStyles";
import { spacing } from "@/src/theme/lifeplate";
import type { AppColors } from "@/src/theme/lifeplate";

function createStyles({ semantic }: AppColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.md,
      padding: spacing.xl,
    },
    logo: { width: 72, height: 72 },
    title: { color: semantic.primary, textAlign: "center" },
    subtitle: { opacity: 0.65, textAlign: "center", lineHeight: 22 },
  });
}

export default function NotFoundScreen() {
  const styles = useThemedStyles(createStyles);

  return (
    <>
      <Stack.Screen options={{ title: "Not found" }} />
      <Screen>
        <View style={styles.container}>
          <Image
            source={require("@/assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text variant="headlineSmall" style={styles.title}>
            This screen doesn&apos;t exist
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            The link may be outdated or the page was moved.
          </Text>
          <Button mode="contained" onPress={() => router.replace("/(tabs)")}>
            Go to home
          </Button>
        </View>
      </Screen>
    </>
  );
}
