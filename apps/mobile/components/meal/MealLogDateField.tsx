import {
  clampLoggedAtToNow,
  dateKeyFromIso,
  formatLogDateLabel,
  loggedAtForDateKey,
  mergeLoggedAtDateKey,
  type MealType,
} from "@lifeplate/shared";
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, IconButton, Text } from "react-native-paper";
import { LogDatePickerModal } from "@/components/timeline/LogDatePickerModal";
import { LogTimePickerModal } from "@/components/meal/LogTimePickerModal";
import { formatMealTime } from "@/lib/mealUtils";
import { useAppColors } from "@/context/ThemeContext";
import { spacing } from "@/src/theme/lifeplate";

type Props = {
  loggedAt: string;
  label?: string;
  variant?: "default" | "compact";
  showTime?: boolean;
  onChange: (loggedAt: string) => void;
};

export function MealLogDateField({
  loggedAt,
  label: fieldLabel = "Logging for",
  variant = "default",
  showTime = true,
  onChange,
}: Props) {
  const { semantic } = useAppColors();
  const [dateOpen, setDateOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const compact = variant === "compact";
  const dateKey = useMemo(() => dateKeyFromIso(loggedAt), [loggedAt]);
  const dateLabel = useMemo(() => formatLogDateLabel(dateKey), [dateKey]);
  const timeLabel = useMemo(() => formatMealTime(loggedAt), [loggedAt]);
  const valueLabel = compact && showTime ? `${dateLabel} · ${timeLabel}` : dateLabel;

  function handleDateSelect(nextKey: string) {
    onChange(clampLoggedAtToNow(mergeLoggedAtDateKey(nextKey, loggedAt)));
  }

  function handleTimeChange(nextLoggedAt: string) {
    onChange(clampLoggedAtToNow(nextLoggedAt));
  }

  return (
    <>
      <View style={styles.wrap}>
        <View style={styles.copy}>
          <Text variant="labelLarge" style={styles.label}>
            {fieldLabel}
          </Text>
          <Text variant="bodyLarge" style={styles.value}>
            {valueLabel}
          </Text>
        </View>
        {compact ? (
          <IconButton
            icon="calendar"
            size={20}
            iconColor={semantic.primary}
            onPress={() => setDateOpen(true)}
            accessibilityLabel="Change meal date"
          />
        ) : (
          <Button mode="outlined" compact onPress={() => setDateOpen(true)}>
            Change
          </Button>
        )}
      </View>

      {showTime && !compact ? (
        <View style={styles.wrap}>
          <View style={styles.copy}>
            <Text variant="labelLarge" style={styles.label}>
              Time
            </Text>
            <Text variant="bodyLarge" style={styles.value}>
              {timeLabel}
            </Text>
          </View>
          <Button mode="outlined" compact onPress={() => setTimeOpen(true)}>
            Change
          </Button>
        </View>
      ) : null}

      <LogDatePickerModal
        visible={dateOpen}
        selectedDateKey={dateKey}
        onSelect={handleDateSelect}
        onClose={() => setDateOpen(false)}
      />
      {showTime && !compact ? (
        <LogTimePickerModal
          visible={timeOpen}
          loggedAt={loggedAt}
          onChange={handleTimeChange}
          onClose={() => setTimeOpen(false)}
        />
      ) : null}
    </>
  );
}

/** Resolve loggedAt when only a calendar date is known (e.g. home upload picker). */
export function loggedAtFromDateKey(dateKey: string, mealType?: MealType): string {
  return loggedAtForDateKey(dateKey, mealType);
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
