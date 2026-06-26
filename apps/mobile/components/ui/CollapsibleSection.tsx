import { useState, type ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Icon, Text } from "react-native-paper";
import { PremiumCard } from "@/components/PremiumCard";
import { useThemedStyles } from "@/lib/useThemedStyles";
import { spacing } from "@/src/theme/lifeplate";
import type { AppColors } from "@/src/theme/lifeplate";

type CollapsibleSectionProps = {
  title: string;
  subtitle?: string;
  defaultExpanded?: boolean;
  children: ReactNode;
};

function createStyles({ ui }: AppColors) {
  return StyleSheet.create({
    card: { gap: 0 },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    headerCopy: { flex: 1, gap: 2 },
    title: { letterSpacing: 0.15 },
    subtitle: { opacity: 0.6, lineHeight: 18 },
    body: { marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: ui.trackBackground },
  });
}

export function CollapsibleSection({
  title,
  subtitle,
  defaultExpanded = false,
  children,
}: CollapsibleSectionProps) {
  const styles = useThemedStyles(createStyles);
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <PremiumCard style={styles.card}>
      <Pressable
        onPress={() => setExpanded((prev) => !prev)}
        style={styles.header}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <View style={styles.headerCopy}>
          <Text variant="titleMedium" style={styles.title}>
            {title}
          </Text>
          {subtitle ? (
            <Text variant="bodySmall" style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <Icon source={expanded ? "chevron-up" : "chevron-down"} size={22} />
      </Pressable>
      {expanded ? <View style={styles.body}>{children}</View> : null}
    </PremiumCard>
  );
}
