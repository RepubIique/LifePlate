import { useEffect, useState } from "react";
import { Image, type ImageStyle, StyleSheet, View, type StyleProp } from "react-native";
import { resolveMealImageUri } from "@/lib/mealImages";
import { premiumStyles } from "@/src/theme/premium";

type MealImageProps = {
  mealId?: string;
  cloudUrl?: string | null;
  style?: StyleProp<ImageStyle>;
  placeholderStyle?: StyleProp<ImageStyle>;
};

export function MealImage({
  mealId,
  cloudUrl,
  style,
  placeholderStyle,
}: MealImageProps) {
  const [uri, setUri] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const resolved = await resolveMealImageUri(mealId, cloudUrl);
      if (!cancelled) setUri(resolved);
    })();
    return () => {
      cancelled = true;
    };
  }, [mealId, cloudUrl]);

  if (!uri) {
    return <View style={[premiumStyles.thumbPlaceholder, style, placeholderStyle]} />;
  }

  return <Image source={{ uri }} style={style} />;
}

export const mealImageStyles = StyleSheet.create({
  hero: { width: "100%", height: 220 },
});
