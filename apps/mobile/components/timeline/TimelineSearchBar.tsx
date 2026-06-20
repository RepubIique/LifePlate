import { StyleSheet, View } from "react-native";
import { TextInput } from "react-native-paper";
import { spacing, ui } from "@/src/theme/lifeplate";

type Props = {
  value: string;
  onChangeText: (value: string) => void;
};

export function TimelineSearchBar({ value, onChangeText }: Props) {
  return (
    <View style={styles.wrap}>
      <TextInput
        mode="outlined"
        placeholder="Search meals or days"
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
        accessibilityLabel="Search meals or days"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: ui.cardBackground,
  },
  outline: {
    borderRadius: 12,
  },
});
