import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Platform, Share } from "react-native";
import type { MealListItem, UserProfile } from "@lifeplate/shared";
import { writeTextFile } from "@/lib/localFileOps";

export async function exportUserData(profile: UserProfile, meals: MealListItem[]) {
  const payload = {
    exportedAt: new Date().toISOString(),
    profile,
    meals,
  };
  const json = JSON.stringify(payload, null, 2);
  const filename = `lifeplate-export-${Date.now()}.json`;

  if (Platform.OS === "web") {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }

  try {
    const file = new File(Paths.cache, filename);
    writeTextFile(file, json);

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri, {
        mimeType: "application/json",
        dialogTitle: "Export LifePlate data",
      });
      return;
    }
  } catch {
    // Fall through to inline share if the cache file cannot be written.
  }

  await Share.share({ message: json, title: "LifePlate export" });
}
