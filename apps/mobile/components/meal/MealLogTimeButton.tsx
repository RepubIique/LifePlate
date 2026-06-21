import { clampLoggedAtToNow } from "@lifeplate/shared";
import { useState } from "react";
import { IconButton } from "react-native-paper";
import { LogTimePickerModal } from "@/components/meal/LogTimePickerModal";
import { semantic } from "@/src/theme/lifeplate";

type Props = {
  loggedAt: string;
  onChange: (loggedAt: string) => void;
  /** Overlay style for compact photo toolbar; defaults to contained white pill. */
  variant?: "overlay" | "inline";
  accessibilityLabel?: string;
};

export function MealLogTimeButton({
  loggedAt,
  onChange,
  variant = "overlay",
  accessibilityLabel = "Change meal time",
}: Props) {
  const [open, setOpen] = useState(false);

  function handleTimeChange(nextLoggedAt: string) {
    onChange(clampLoggedAtToNow(nextLoggedAt));
  }

  const button =
    variant === "overlay" ? (
      <IconButton
        icon="clock-outline"
        mode="contained"
        containerColor="rgba(255,255,255,0.92)"
        iconColor={semantic.primary}
        size={18}
        onPress={() => setOpen(true)}
        accessibilityLabel={accessibilityLabel}
      />
    ) : (
      <IconButton
        icon="clock-outline"
        size={20}
        iconColor={semantic.primary}
        onPress={() => setOpen(true)}
        accessibilityLabel={accessibilityLabel}
      />
    );

  return (
    <>
      {button}
      <LogTimePickerModal
        visible={open}
        loggedAt={loggedAt}
        onChange={handleTimeChange}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

export type MealLogTimeButtonProps = Props;
