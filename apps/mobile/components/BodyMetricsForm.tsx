import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text, TextInput } from "react-native-paper";
import {
  GENDER_OPTIONS,
  computeNutritionTargets,
  type Gender,
} from "@lifeplate/shared";
import { PremiumCard } from "@/components/PremiumCard";
import { palette, semantic, tints, ui, spacing } from "@/src/theme/lifeplate";

export function toOptionalNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function toOptionalInt(value: string): number | null {
  const n = toOptionalNumber(value);
  return n == null ? null : Math.round(n);
}

type BodyMetricsFormProps = {
  weightKg: string;
  heightCm: string;
  age: string;
  gender: Gender | null;
  onWeightKgChange: (value: string) => void;
  onHeightCmChange: (value: string) => void;
  onAgeChange: (value: string) => void;
  onGenderChange: (value: Gender) => void;
  showTargets?: boolean;
};

function TargetRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.targetRow}>
      <Text variant="bodyMedium" style={styles.targetLabel}>
        {label}
      </Text>
      <Text variant="bodyLarge">{value}</Text>
    </View>
  );
}

export function BodyMetricsForm({
  weightKg,
  heightCm,
  age,
  gender,
  onWeightKgChange,
  onHeightCmChange,
  onAgeChange,
  onGenderChange,
  showTargets = true,
}: BodyMetricsFormProps) {
  const targets = useMemo(
    () =>
      computeNutritionTargets({
        weightKg: toOptionalNumber(weightKg),
        heightCm: toOptionalNumber(heightCm),
        age: toOptionalInt(age),
        gender,
      }),
    [age, gender, heightCm, weightKg],
  );

  return (
    <View style={styles.form}>
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Gender
      </Text>
      <View style={styles.genderList}>
        {GENDER_OPTIONS.map((option) => {
          const selected = gender === option.value;
          return (
            <Pressable key={option.value} onPress={() => onGenderChange(option.value)}>
              <PremiumCard
                noBlur
                style={[styles.genderCard, selected && styles.genderCardSelected]}
              >
                <Text
                  variant="bodyLarge"
                  style={selected ? styles.genderTextSelected : undefined}
                >
                  {option.label}
                </Text>
              </PremiumCard>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.metricsGrid}>
        <TextInput
          label="Weight (kg)"
          value={weightKg}
          onChangeText={onWeightKgChange}
          keyboardType="decimal-pad"
          mode="outlined"
          style={styles.metricInput}
        />
        <TextInput
          label="Height (cm)"
          value={heightCm}
          onChangeText={onHeightCmChange}
          keyboardType="decimal-pad"
          mode="outlined"
          style={styles.metricInput}
        />
        <TextInput
          label="Age"
          value={age}
          onChangeText={onAgeChange}
          keyboardType="number-pad"
          mode="outlined"
          style={styles.metricInput}
        />
      </View>

      {showTargets ? (
        targets ? (
          <View style={styles.targetsBox}>
            <TargetRow
              label="Recommended fibre / day"
              value={`${targets.dailyFibreG}g`}
            />
            <TargetRow
              label="Estimated calories / day"
              value={`${targets.dailyCalories} kcal`}
            />
          </View>
        ) : (
          <Text variant="bodySmall" style={styles.hint}>
            Fill in all fields to see your personalised daily targets.
          </Text>
        )
      ) : null}
    </View>
  );
}

export function isBodyMetricsFormComplete(
  weightKg: string,
  heightCm: string,
  age: string,
  gender: Gender | null,
): boolean {
  return (
    computeNutritionTargets({
      weightKg: toOptionalNumber(weightKg),
      heightCm: toOptionalNumber(heightCm),
      age: toOptionalInt(age),
      gender,
    }) != null
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.sm },
  sectionTitle: { letterSpacing: 0.15 },
  genderList: { gap: spacing.xs },
  genderCard: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  genderCardSelected: {
    borderColor: semantic.primary,
    backgroundColor: ui.cardBackground,
  },
  genderTextSelected: { color: semantic.primary },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  metricInput: { flexBasis: "48%", flexGrow: 1 },
  targetsBox: { gap: spacing.xs, marginTop: spacing.xs },
  targetRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: ui.trackBackground,
  },
  targetLabel: { opacity: 0.65, marginBottom: 2 },
  hint: { opacity: 0.65, lineHeight: 18 },
});
