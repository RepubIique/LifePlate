import { ActionSheetIOS, Alert, Platform, Pressable } from "react-native";
import { Text } from "react-native-paper";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useThemePreference } from "@/context/ThemeContext";
import {
  themePreferenceLabel,
  type ThemePreference,
} from "@/lib/themePrefs";
import { ProfileSettingRow } from "@/components/profile/ProfileSettingRow";

const OPTIONS: ThemePreference[] = ["system", "light", "dark"];

function showThemePicker(
  current: ThemePreference,
  onSelect: (preference: ThemePreference) => void,
) {
  const labels = OPTIONS.map(themePreferenceLabel);

  if (Platform.OS === "ios") {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: "Appearance",
        options: [...labels, "Cancel"],
        cancelButtonIndex: labels.length,
      },
      (index) => {
        if (index >= 0 && index < OPTIONS.length) {
          onSelect(OPTIONS[index]);
        }
      },
    );
    return;
  }

  Alert.alert(
    "Appearance",
    undefined,
    [
      ...OPTIONS.map((option) => ({
        text: themePreferenceLabel(option),
        onPress: () => onSelect(option),
        style: option === current ? ("default" as const) : ("default" as const),
      })),
      { text: "Cancel", style: "cancel" },
    ],
  );
}

export function AppearanceSection() {
  const { preference, setPreference } = useThemePreference();

  return (
    <Pressable
      onPress={() => showThemePicker(preference, setPreference)}
      accessibilityRole="button"
      accessibilityLabel="Appearance"
      accessibilityHint="Choose light, dark, or system theme"
    >
      <ProfileSettingRow
        icon="theme-light-dark"
        title="Appearance"
        subtitle="Light, dark, or match your device"
        trailing={
          <>
            <Text variant="bodyMedium">{themePreferenceLabel(preference)}</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} />
          </>
        }
      />
    </Pressable>
  );
}
