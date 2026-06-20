import * as ImagePicker from "expo-image-picker";
import { useCallback, useState } from "react";
import type { ImagePickerAsset } from "expo-image-picker";
import { friendlyErrorMessage } from "@/lib/apiErrors";
import { prepareMealImage } from "@/lib/imagePrep";
import { saveToCameraRoll } from "@/lib/saveToCameraRoll";
import { setLastPhotoSource } from "@/lib/uploadPrefs";

type AttachPhotoFn = (prepared: {
  uri: string;
  mimeType: string;
  fileName: string;
}) => Promise<void>;

export function useMealPhotoAttach(attachPhoto: AttachPhotoFn) {
  const [attaching, setAttaching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processAsset = useCallback(
    async (asset: ImagePickerAsset, useCamera: boolean) => {
      setError(null);
      setAttaching(true);
      try {
        if (useCamera) {
          await saveToCameraRoll(asset.uri);
        }
        const prepared = await prepareMealImage(asset.uri);
        await attachPhoto(prepared);
      } catch (e) {
        setError(friendlyErrorMessage(e));
        throw e;
      } finally {
        setAttaching(false);
      }
    },
    [attachPhoto],
  );

  const pickPhoto = useCallback(
    async (useCamera: boolean) => {
      const permission = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError("Permission required to access photos or camera.");
        return;
      }

      await setLastPhotoSource(useCamera ? "camera" : "library");

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            quality: 0.85,
            allowsEditing: true,
            aspect: [4, 3],
          })
        : await ImagePicker.launchImageLibraryAsync({
            quality: 0.85,
            allowsEditing: true,
            aspect: [4, 3],
          });

      if (result.canceled || !result.assets[0]) return;
      await processAsset(result.assets[0], useCamera);
    },
    [processAsset],
  );

  return {
    attaching,
    error,
    setError,
    pickPhoto,
  };
}
