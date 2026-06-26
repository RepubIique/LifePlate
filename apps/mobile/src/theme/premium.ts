import { useMemo } from "react";
import { StyleSheet } from "react-native";
import { useAppColors } from "@/context/ThemeContext";
import {
  palette,
  semanticLight,
  tintsLight,
  uiLight,
  type AppColors,
} from "./palette";
import { spacing } from "./lifeplate";

export function createPremiumTokens({ semantic, tints }: AppColors) {
  return {
    cardRadius: 20,
    imageRadius: 16,
    borderColor: tints.sageLight,
    muted: semantic.textMuted,
    danger: semantic.danger,
  };
}

export function createPremiumStyles(colors: AppColors) {
  const premium = createPremiumTokens(colors);
  return StyleSheet.create({
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
      backgroundColor: colors.semantic.surface,
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
      backgroundColor: colors.tints.sageLight,
    },
  });
}

/** @deprecated Use `usePremiumTokens()` for theme-aware tokens. */
export const premium = createPremiumTokens({
  palette,
  semantic: semanticLight,
  tints: tintsLight,
  ui: uiLight,
});

/** @deprecated Use `usePremiumStyles()` for theme-aware styles. */
export const premiumStyles = createPremiumStyles({
  palette,
  semantic: semanticLight,
  tints: tintsLight,
  ui: uiLight,
});

export function usePremiumTokens() {
  const colors = useAppColors();
  return useMemo(() => createPremiumTokens(colors), [colors]);
}

export function usePremiumStyles() {
  const colors = useAppColors();
  return useMemo(() => createPremiumStyles(colors), [colors]);
}
