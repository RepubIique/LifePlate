/**
 * Best-effort save of a local image URI to the device photo library.
 * Uses a dynamic import so the native module is not loaded at app startup.
 */
export async function saveToCameraRoll(uri: string): Promise<void> {
  try {
    const { Asset, requestPermissionsAsync } = await import("expo-media-library");
    const { status } = await requestPermissionsAsync(true);
    if (status !== "granted") return;
    await Asset.create(uri);
  } catch {
    // Never block meal upload if saving to camera roll fails.
  }
}
