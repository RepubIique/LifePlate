import { useEffect, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import type { FriendSummary } from "@lifeplate/shared";
import { ensureFriendAvatarCached } from "@/lib/friendAvatars";
import { getCachedAvatarUri } from "@/lib/avatarCache";
import { useThemedStyles } from "@/lib/useThemedStyles";
import type { AppColors } from "@/src/theme/lifeplate";

const SIZE = 44;

function friendInitials(name: string | null): string {
  const trimmed = name?.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return trimmed[0]!.toUpperCase();
}

function createStyles({ semantic, ui }: AppColors) {
  return StyleSheet.create({
    image: {
      width: SIZE,
      height: SIZE,
      borderRadius: SIZE / 2,
    },
    placeholder: {
      width: SIZE,
      height: SIZE,
      borderRadius: SIZE / 2,
      backgroundColor: ui.selectedBackground,
      alignItems: "center",
      justifyContent: "center",
    },
    initials: { color: semantic.primary, fontWeight: "600" },
  });
}

type Props = Pick<FriendSummary, "id" | "name" | "hasAvatar">;

export function FriendAvatar({ id, name, hasAvatar }: Props) {
  const styles = useThemedStyles(createStyles);
  const [uri, setUri] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setImageError(false);
      if (!hasAvatar) {
        setUri(null);
        return;
      }

      const cached = await getCachedAvatarUri(id);
      if (cancelled) return;
      if (cached) {
        setUri(cached);
        return;
      }

      const local = await ensureFriendAvatarCached({ id, hasAvatar });
      if (!cancelled) {
        setUri(local);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, hasAvatar]);

  const showImage = !!uri && !imageError;

  if (showImage) {
    return (
      <Image
        source={{ uri }}
        style={styles.image}
        onError={() => setImageError(true)}
      />
    );
  }

  return (
    <View style={styles.placeholder}>
      <Text variant="titleMedium" style={styles.initials}>
        {friendInitials(name)}
      </Text>
    </View>
  );
}
