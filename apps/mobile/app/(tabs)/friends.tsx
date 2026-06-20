import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { RefreshControl, StyleSheet, View } from "react-native";
import { ActivityIndicator, Text } from "react-native-paper";
import type { MealPortionMeta } from "@lifeplate/shared";
import { BottomSnackbar } from "@/components/ui/BottomSnackbar";
import { FriendCodeCard } from "@/components/friends/FriendCodeCard";
import { FriendsList } from "@/components/friends/FriendsList";
import { PendingShareCard } from "@/components/friends/PendingShareCard";
import { PremiumHeader } from "@/components/PremiumHeader";
import { Screen } from "@/components/Screen";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { useFriends } from "@/context/FriendsContext";
import { acceptMealShare, addFriendByCode, declineMealShare, removeFriend } from "@/lib/api";
import { friendlyErrorMessage } from "@/lib/apiErrors";
import { useRefreshAfterMealChange } from "@/lib/refreshAfterMealChange";
import { spacing } from "@/src/theme/lifeplate";

export default function FriendsScreen() {
  const refreshAfterMealChange = useRefreshAfterMealChange();
  const {
    friendCode,
    friends,
    pendingShares,
    loading,
    refreshing,
    hydrated,
    loadFriends,
    refreshFriends,
    patchFriends,
  } = useFriends();

  const [addCode, setAddCode] = useState("");
  const [adding, setAdding] = useState(false);
  const [shareBusyId, setShareBusyId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      void loadFriends().catch((e) => setSnackbar(friendlyErrorMessage(e)));
    }, [loadFriends]),
  );

  const handleRefresh = useCallback(async () => {
    try {
      await refreshFriends();
    } catch (e) {
      setSnackbar(friendlyErrorMessage(e));
    }
  }, [refreshFriends]);

  async function handleAddFriend() {
    const code = addCode.trim();
    if (!code) return;
    setAdding(true);
    try {
      const { friend } = await addFriendByCode(code);
      setAddCode("");
      const nextFriends = [...friends];
      if (!nextFriends.some((f) => f.id === friend.id)) {
        nextFriends.push(friend);
        nextFriends.sort((a, b) => (a.name ?? a.id).localeCompare(b.name ?? b.id));
      }
      patchFriends({ friends: nextFriends });
      setSnackbar(`Added ${friend.name?.trim() || "friend"}`);
    } catch (e) {
      setSnackbar(friendlyErrorMessage(e));
    } finally {
      setAdding(false);
    }
  }

  async function handleRemoveFriend(friendId: string) {
    try {
      await removeFriend(friendId);
      patchFriends({ friends: friends.filter((f) => f.id !== friendId) });
      setSnackbar("Friend removed");
    } catch (e) {
      setSnackbar(friendlyErrorMessage(e));
    }
  }

  async function handleAccept(shareId: string, portionMeta?: MealPortionMeta) {
    setShareBusyId(shareId);
    try {
      await acceptMealShare(shareId, portionMeta ? { portionMeta } : undefined);
      patchFriends({ pendingShares: pendingShares.filter((s) => s.id !== shareId) });
      refreshAfterMealChange();
      setSnackbar("Meal added to your log");
    } catch (e) {
      setSnackbar(friendlyErrorMessage(e));
    } finally {
      setShareBusyId(null);
    }
  }

  async function handleDecline(shareId: string) {
    setShareBusyId(shareId);
    try {
      await declineMealShare(shareId);
      patchFriends({ pendingShares: pendingShares.filter((s) => s.id !== shareId) });
      setSnackbar("Share declined");
    } catch (e) {
      setSnackbar(friendlyErrorMessage(e));
    } finally {
      setShareBusyId(null);
    }
  }

  const showInitialLoading = !hydrated || (loading && !friendCode && friends.length === 0);

  return (
    <Screen
      scroll
      padded={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => void handleRefresh()} />
      }
    >
      <PremiumHeader
        title="Friends"
        subtitle="Share meals without running AI twice"
      />

      {showInitialLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator />
        </View>
      ) : (
        <View style={styles.body}>
          <FriendCodeCard
            friendCode={friendCode || "------"}
            addCode={addCode}
            adding={adding}
            onAddCodeChange={setAddCode}
            onAddFriend={() => void handleAddFriend()}
          />

          {pendingShares.length > 0 ? (
            <>
              <SectionLabel
                title="Pending shares"
                subtitle="Meals friends logged for you — accept to add them"
              />
              <View style={styles.shareList}>
                {pendingShares.map((share) => (
                  <PendingShareCard
                    key={share.id}
                    share={share}
                    busy={shareBusyId === share.id}
                    onAccept={handleAccept}
                    onDecline={handleDecline}
                  />
                ))}
              </View>
            </>
          ) : null}

          <SectionLabel title="Your friends" subtitle="Long-press to remove" />
          <FriendsList friends={friends} onRemove={(id) => void handleRemoveFriend(id)} />
        </View>
      )}

      <BottomSnackbar visible={!!snackbar} onDismiss={() => setSnackbar(null)} duration={4000}>
        {snackbar}
      </BottomSnackbar>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  loading: {
    paddingVertical: spacing.xl,
    alignItems: "center",
  },
  shareList: { gap: spacing.sm },
});
