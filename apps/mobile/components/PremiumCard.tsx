import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View, type ViewProps } from "react-native";
import { useAppColors, useColorScheme } from "@/context/ThemeContext";
import { usePremiumStyles } from "@/src/theme/premium";

type Props = ViewProps & {
  children: React.ReactNode;
  noBlur?: boolean;
};

export function PremiumCard({ children, style, noBlur, ...rest }: Props) {
  const colorScheme = useColorScheme();
  const { semantic, tints } = useAppColors();
  const premiumStyles = usePremiumStyles();
  const blurTint = colorScheme === "dark" ? "dark" : "light";
  const themedCardStyle = {
    backgroundColor: semantic.surface,
    borderColor: tints.sageLight,
  };

  if (Platform.OS === "web" || noBlur) {
    return (
      <View
        style={[
          premiumStyles.card,
          themedCardStyle,
          style,
        ]}
        {...rest}
      >
        {children}
      </View>
    );
  }

  return (
    <BlurView
      intensity={18}
      tint={blurTint}
      style={[premiumStyles.card, themedCardStyle, style]}
      {...rest}
    >
      {children}
    </BlurView>
  );
}
