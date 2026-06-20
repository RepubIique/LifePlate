import { dateKeyFromIso, formatLogDateLabel, loggedAtForDateKey } from "@lifeplate/shared";
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import type { MealType } from "@lifeplate/shared";
import { LogDatePickerModal } from "@/components/timeline/LogDatePickerModal";
import { spacing } from "@/src/theme/lifeplate";

type Props = {
  dateKey: string;
  mealType?: MealType;
  label?: string;
  onChange: (loggedAt: string) => void;
};

export function MealLogDateField({
  dateKey,
  mealType,
  label: fieldLabel = "Logging for",
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const dateLabel = useMemo(() => formatLogDateLabel(dateKey), [dateKey]);

  return (
    <>
      <View style={styles.wrap}>
        <View style={styles.copy}>
          <Text variant="labelLarge" style={styles.label}>
            {fieldLabel}
          </Text>
          <Text variant="bodyLarge" style={styles.value}>
            {dateLabel}
          </Text>
        </View>
        <Button mode="outlined" compact onPress={() => setOpen(true)}>
          Change
        </Button>
      </View>

      <LogDatePickerModal
        visible={open}
        selectedDateKey={dateKey}
        onSelect={(nextKey) => onChange(loggedAtForDateKey(nextKey, mealType))}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  copy: { flex: 1, gap: 2 },
  label: {
    opacity: 0.55,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  value: {
    letterSpacing: 0.1,
  },
});
