import { useEffect, useState } from "react";
import { palette, semantic, tints, ui } from "@/src/theme/lifeplate";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { Text } from "react-native-paper";
import { useCachedAvatarUri } from "@/lib/avatarCache";

type Props = {
  userId: string | null;
  hasAvatar: boolean;
  remoteAvatarUrl: string | null;
  name: string | null;
  uploading?: boolean;
  cacheRevision?: number;
  onPress: () => void;
};

function initials(name: string | null): string {
  const trimmed = name?.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return trimmed[0]!.toUpperCase();
}

export function ProfileAvatar({
  userId,
  hasAvatar,
  remoteAvatarUrl,
  name,
  uploading,
  cacheRevision,
  onPress,
}: Props) {
  const [imageError, setImageError] = useState(false);
  const { uri: cachedUri, ready } = useCachedAvatarUri(
    userId,
    hasAvatar,
    remoteAvatarUrl,
    cacheRevision,
  );
  const imageUri = cachedUri ?? (ready ? remoteAvatarUrl : null);

  useEffect(() => {
    setImageError(false);
  }, [imageUri]);

  const showImage = !!imageUri && !imageError;

  return (
    <Pressable
      onPress={onPress}
      disabled={uploading}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
      accessibilityLabel="Change profile photo"
      accessibilityRole="button"
    >
      <View style={styles.ring}>
        <View style={styles.wrap}>
          {showImage ? (
            <Image
              source={{ uri: imageUri }}
              style={styles.image}
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={styles.placeholder}>
              <Text variant="headlineLarge" style={styles.initials}>
                {initials(name)}
              </Text>
            </View>
          )}
          <View style={styles.badge}>
            <MaterialCommunityIcons name="camera-outline" size={14} color="#FFFFFF" />
          </View>
          {uploading ? (
            <View style={styles.overlay}>
              <ActivityIndicator color="#FFFFFF" />
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const AVATAR_SIZE = 112;

const styles = StyleSheet.create({
  pressable: { alignSelf: "center" },
  pressed: { opacity: 0.92, transform: [{ scale: 0.98 }] },
  ring: {
    padding: 4,
    borderRadius: (AVATAR_SIZE + 8) / 2,
    backgroundColor: "#FFFFFF",
    ...Platform.select({
      ios: {
        shadowColor: semantic.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  wrap: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    position: "relative",
    borderWidth: 2,
    borderColor: ui.selectedBackground,
  },
  image: {
    width: AVATAR_SIZE - 4,
    height: AVATAR_SIZE - 4,
    borderRadius: (AVATAR_SIZE - 4) / 2,
    margin: 1,
  },
  placeholder: {
    flex: 1,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: "#E8F5E9",
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    color: semantic.primary,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  badge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: semantic.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: "rgba(27, 67, 50, 0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
});
