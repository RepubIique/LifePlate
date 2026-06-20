import { StyleSheet } from "react-native";
import { palette, semantic, tints } from "./palette";
import { spacing } from "./lifeplate";

export const premium = {
  cardRadius: 20,
  imageRadius: 16,
  borderColor: tints.sageLight,
  muted: semantic.textMuted,
  danger: semantic.danger,
};

export const premiumStyles = StyleSheet.create({
  card: {
    borderRadius: premium.cardRadius,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: premium.borderColor,
    padding: spacing.lg,
  },
  section: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  sectionTitle: {
    marginBottom: spacing.md,
    letterSpacing: 0.15,
  },
  empty: {
    opacity: 0.6,
    textAlign: "center",
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  mealCard: {
    marginBottom: spacing.sm,
    backgroundColor: palette.white,
    borderColor: premium.borderColor,
    borderRadius: 10,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
  },
  thumbPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: tints.sageLight,
  },
});
