import { useEffect, useState } from "react";
import { Image, type ImageStyle, StyleSheet, View, type StyleProp } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { resolveMealImageUri } from "@/lib/mealImages";
import { premiumStyles } from "@/src/theme/premium";

type MealImageProps = {
  mealId?: string;
  cloudUrl?: string | null;
  style?: StyleProp<ImageStyle>;
  placeholderStyle?: StyleProp<ImageStyle>;
  /** Override Plus cloud fallback (defaults to profile.isPaid). */
  cloudFallback?: boolean;
};

export function MealImage({
  mealId,
  cloudUrl,
  style,
  placeholderStyle,
  cloudFallback,
}: MealImageProps) {
  const { profile } = useAuth();
  const allowCloudFallback = cloudFallback ?? profile?.isPaid ?? false;
  const [uri, setUri] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const resolved = await resolveMealImageUri(mealId, cloudUrl, {
        cloudFallback: allowCloudFallback,
      });
      if (!cancelled) setUri(resolved);
    })();
    return () => {
      cancelled = true;
    };
  }, [mealId, cloudUrl, allowCloudFallback]);

  if (!uri) {
    return <View style={[premiumStyles.thumbPlaceholder, style, placeholderStyle]} />;
  }

  return <Image source={{ uri }} style={style} />;
}

export const mealImageStyles = StyleSheet.create({
  hero: { width: "100%", height: 220 },
});
