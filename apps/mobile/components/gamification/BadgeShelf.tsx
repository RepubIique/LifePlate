import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import type { GamificationStatsInput } from "@lifeplate/shared";
import { BADGE_DEFINITIONS, computeUnlockedBadges } from "@lifeplate/shared";
import { PremiumCard } from "@/components/PremiumCard";
import { palette, semantic, tints, ui, spacing } from "@/src/theme/lifeplate";

type Props = {
  stats: GamificationStatsInput;
};

export function BadgeShelf({ stats }: Props) {
  const unlocked = new Set(computeUnlockedBadges(stats));

  return (
    <PremiumCard style={styles.card} noBlur>
      <Text variant="titleMedium" style={styles.title}>
        Badges
      </Text>
      <Text variant="bodySmall" style={styles.subtitle}>
        Small wins from showing up — no pressure to collect them all.
      </Text>
      <View style={styles.grid}>
        {BADGE_DEFINITIONS.map((badge) => (
          <BadgeTile
            key={badge.id}
            badge={badge}
            unlocked={unlocked.has(badge.id)}
          />
        ))}
      </View>
    </PremiumCard>
  );
}

function BadgeTile({
  badge,
  unlocked,
}: {
  badge: (typeof BADGE_DEFINITIONS)[number];
  unlocked: boolean;
}) {
  return (
    <View style={[styles.tile, !unlocked && styles.tileLocked]}>
      <View style={[styles.iconWrap, unlocked && styles.iconWrapUnlocked]}>
        <MaterialCommunityIcons
          name={badge.icon as keyof typeof MaterialCommunityIcons.glyphMap}
          size={22}
          color={unlocked ? semantic.primary : semantic.textMuted}
        />
      </View>
      <Text variant="labelMedium" style={[styles.badgeTitle, !unlocked && styles.lockedText]}>
        {badge.title}
      </Text>
      <Text variant="bodySmall" style={styles.badgeDesc} numberOfLines={2}>
        {unlocked ? badge.description : badge.description}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm, backgroundColor: ui.cardBackground },
  title: { color: semantic.primary, letterSpacing: 0.15 },
  subtitle: { opacity: 0.55, lineHeight: 18 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  tile: {
    width: "47%",
    flexGrow: 1,
    alignItems: "center",
    gap: 4,
    padding: spacing.sm,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
  },
  tileLocked: { opacity: 0.55 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ui.trackBackground,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapUnlocked: { backgroundColor: ui.selectedBackground },
  badgeTitle: {
    color: semantic.primary,
    fontWeight: "600",
    textAlign: "center",
  },
  lockedText: { opacity: 0.7 },
  badgeDesc: {
    opacity: 0.55,
    textAlign: "center",
    fontSize: 11,
    lineHeight: 14,
  },
});
