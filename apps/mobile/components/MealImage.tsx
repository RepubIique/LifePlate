import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useEffect, useState } from "react";
import { Image, type ImageStyle, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { resolveMealImageUri } from "@/lib/mealImages";
import { mealTypeIcon } from "@/lib/mealUtils";
import { premiumStyles } from "@/src/theme/premium";

type MealImagePlaceholderProps = {
  mealType?: string | null;
  style?: StyleProp<ViewStyle>;
  placeholderStyle?: StyleProp<ViewStyle>;
  iconSize?: number;
};

export function MealImagePlaceholder({
  mealType,
  style,
  placeholderStyle,
  iconSize = 28,
}: MealImagePlaceholderProps) {
  return (
    <View style={[premiumStyles.thumbPlaceholder, mealImageStyles.placeholder, style, placeholderStyle]}>
      <MaterialCommunityIcons
        name={mealTypeIcon(mealType)}
        size={iconSize}
        color="#40916C"
      />
    </View>
  );
}

type MealImageProps = {
  mealId?: string;
  cloudUrl?: string | null;
  mealType?: string | null;
  style?: StyleProp<ImageStyle>;
  placeholderStyle?: StyleProp<ViewStyle>;
  placeholderIconSize?: number;
  /** Override Plus cloud fallback (defaults to profile.isPaid). */
  cloudFallback?: boolean;
};

export function MealImage({
  mealId,
  cloudUrl,
  mealType,
  style,
  placeholderStyle,
  placeholderIconSize,
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
    return (
      <MealImagePlaceholder
        mealType={mealType}
        style={style}
        placeholderStyle={placeholderStyle}
        iconSize={placeholderIconSize}
      />
    );
  }

  return <Image source={{ uri }} style={style} />;
}

export const mealImageStyles = StyleSheet.create({
  hero: { width: "100%", height: 220 },
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF2F0",
  },
});
