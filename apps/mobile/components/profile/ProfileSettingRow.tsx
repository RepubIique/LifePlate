import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { palette, semantic, tints, ui, spacing } from "@/src/theme/lifeplate";

type Props = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
};

export function ProfileSettingRow({ icon, title, subtitle, trailing }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons name={icon} size={20} color={semantic.primary} />
      </View>
      <View style={styles.copy}>
        <Text variant="titleMedium" style={styles.title}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="bodySmall" style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: tints.tealLight,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: { flex: 1, gap: 2 },
  title: { color: semantic.primary, letterSpacing: 0.1 },
  subtitle: { opacity: 0.65, lineHeight: 18 },
  trailing: { alignItems: "center", justifyContent: "center" },
});
