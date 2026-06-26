import { StyleSheet, View } from "react-native";
import { TextInput } from "react-native-paper";
import { useThemedStyles } from "@/lib/useThemedStyles";
import { spacing } from "@/src/theme/lifeplate";
import type { AppColors } from "@/src/theme/lifeplate";

type Props = {
  value: string;
  onChangeText: (value: string) => void;
};

function createStyles({ semantic, ui }: AppColors) {
  return StyleSheet.create({
    wrap: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
      backgroundColor: semantic.background,
      zIndex: 1,
    },
    input: {
      backgroundColor: ui.cardBackground,
    },
    outline: {
      borderRadius: 12,
    },
  });
}

export function TimelineSearchBar({ value, onChangeText }: Props) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.wrap}>
      <TextInput
        mode="outlined"
        placeholder="Search meals, days, or source"
        value={value}
        onChangeText={onChangeText}
        dense
        style={styles.input}
        outlineStyle={styles.outline}
        left={<TextInput.Icon icon="magnify" />}
        right={
          value.length > 0 ? (
            <TextInput.Icon icon="close" onPress={() => onChangeText("")} accessibilityLabel="Clear search" />
          ) : undefined
        }
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        accessibilityLabel="Search meals, days, or source"
      />
    </View>
  );
}
