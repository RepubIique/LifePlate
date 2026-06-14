import * as ImageManipulator from "expo-image-manipulator";

const MAX_WIDTH = 1280;
const JPEG_QUALITY = 0.75;

export async function prepareMealImage(uri: string): Promise<{
  uri: string;
  mimeType: string;
  fileName: string;
}> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: MAX_WIDTH } }],
    { compress: JPEG_QUALITY, format: ImageManipulator.SaveFormat.JPEG },
  );

  return {
    uri: result.uri,
    mimeType: "image/jpeg",
    fileName: "meal.jpg",
  };
}

const PROFILE_MAX_WIDTH = 512;
const PROFILE_JPEG_QUALITY = 0.82;

export async function prepareProfileImage(uri: string): Promise<{
  uri: string;
  mimeType: string;
  fileName: string;
}> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: PROFILE_MAX_WIDTH } }],
    { compress: PROFILE_JPEG_QUALITY, format: ImageManipulator.SaveFormat.JPEG },
  );

  return {
    uri: result.uri,
    mimeType: "image/jpeg",
    fileName: "avatar.jpg",
  };
}
