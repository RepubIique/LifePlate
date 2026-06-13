import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "lifeplate:lastPhotoSource";

export type PhotoSource = "camera" | "library";

export async function getLastPhotoSource(): Promise<PhotoSource | null> {
  const v = await AsyncStorage.getItem(KEY);
  return v === "camera" || v === "library" ? v : null;
}

export async function setLastPhotoSource(source: PhotoSource) {
  await AsyncStorage.setItem(KEY, source);
}
