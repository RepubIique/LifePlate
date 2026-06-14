import { useEffect, useState } from "react";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import {
  ActivityIndicator,
  Image,
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
          <MaterialCommunityIcons name="camera" size={15} color="#FFFFFF" />
        </View>
        {uploading ? (
          <View style={styles.overlay}>
            <ActivityIndicator color="#FFFFFF" />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const AVATAR_SIZE = 108;

const styles = StyleSheet.create({
  pressable: { alignSelf: "center" },
  pressed: { opacity: 0.9 },
  wrap: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    position: "relative",
  },
  image: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  placeholder: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: "#D8F3DC",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#40916C",
  },
  initials: {
    color: "#1B4332",
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  badge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1B4332",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
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
