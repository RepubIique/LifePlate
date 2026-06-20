import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View, type ViewProps } from "react-native";
import { premium, premiumStyles } from "@/src/theme/premium";
import { palette } from "@/src/theme/lifeplate";

type Props = ViewProps & {
  children: React.ReactNode;
  noBlur?: boolean;
};

export function PremiumCard({ children, style, noBlur, ...rest }: Props) {
  if (Platform.OS === "web" || noBlur) {
    return (
      <View style={[premiumStyles.card, styles.webCard, style]} {...rest}>
        {children}
      </View>
    );
  }

  return (
    <BlurView intensity={18} tint="light" style={[premiumStyles.card, style]} {...rest}>
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  webCard: {
    backgroundColor: palette.white,
  },
});
