import { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet } from "react-native";
import { IconButton } from "react-native-paper";
import { useAuth } from "@/context/AuthContext";
import { fetchProfileAvatar } from "@/lib/api";
import { getCachedAvatarUri, useCachedAvatarUri } from "@/lib/avatarCache";

const AVATAR_SIZE = 36;

type Props = {
  onPress: () => void;
};

export function ProfileNavButton({ onPress }: Props) {
  const { profile } = useAuth();
  const [remoteAvatarUrl, setRemoteAvatarUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  const userId = profile?.id ?? null;
  const hasAvatar = profile?.hasAvatar ?? false;

  useEffect(() => {
    if (!userId || !hasAvatar) {
      setRemoteAvatarUrl(null);
      return;
    }

    let cancelled = false;
    void (async () => {
      const cached = await getCachedAvatarUri(userId);
      if (cancelled) return;
      if (cached) {
        setRemoteAvatarUrl(null);
        return;
      }

      try {
        const { avatarUrl } = await fetchProfileAvatar();
        if (!cancelled) {
          setRemoteAvatarUrl(avatarUrl);
        }
      } catch {
        if (!cancelled) {
          setRemoteAvatarUrl(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, hasAvatar]);

  const { uri: cachedUri, ready } = useCachedAvatarUri(
    userId,
    hasAvatar,
    remoteAvatarUrl,
  );
  const imageUri = cachedUri ?? (ready ? remoteAvatarUrl : null);

  useEffect(() => {
    setImageError(false);
  }, [imageUri]);

  const showImage = hasAvatar && !!imageUri && !imageError;

  if (showImage) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.hit, pressed && styles.pressed]}
        accessibilityLabel="Profile"
        accessibilityRole="button"
      >
        <Image
          source={{ uri: imageUri }}
          style={styles.avatar}
          onError={() => setImageError(true)}
        />
      </Pressable>
    );
  }

  return (
    <IconButton
      icon="account-circle-outline"
      onPress={onPress}
      accessibilityLabel="Profile"
    />
  );
}

const styles = StyleSheet.create({
  hit: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { opacity: 0.7 },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
});
