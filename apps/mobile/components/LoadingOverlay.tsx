import { StyleSheet, View } from "react-native";
import { ActivityIndicator, useTheme } from "react-native-paper";

type Props = {
  visible: boolean;
};

export function LoadingOverlay({ visible }: Props) {
  const theme = useTheme();

  if (!visible) return null;

  return (
    <View
      style={[styles.overlay, { backgroundColor: `${theme.colors.background}B3` }]}
      pointerEvents="auto"
    >
      <ActivityIndicator />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
    elevation: 100,
  },
});
