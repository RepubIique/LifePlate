import { useFocusEffect, useNavigation } from "expo-router";
import { useCallback, useLayoutEffect, useState } from "react";
import { RefreshControl, StyleSheet, View } from "react-native";
import { ActivityIndicator, Text } from "react-native-paper";
import type { FriendSummary, MealPortionMeta, MealShareRequestSummary } from "@lifeplate/shared";
import { BottomSnackbar } from "@/components/ui/BottomSnackbar";
import { FriendCodeCard } from "@/components/friends/FriendCodeCard";
import { FriendsList } from "@/components/friends/FriendsList";
import { PendingShareCard } from "@/components/friends/PendingShareCard";
import { PremiumHeader } from "@/components/PremiumHeader";
import { Screen } from "@/components/Screen";
import { SectionLabel } from "@/components/ui/SectionLabel";
import {
  acceptMealShare,
  addFriendByCode,
  declineMealShare,
  fetchFriends,
  fetchIncomingMealShares,
  fetchIncomingMealShareCount,
  removeFriend,
} from "@/lib/api";
import { friendlyErrorMessage } from "@/lib/apiErrors";
import { useRefreshAfterMealChange } from "@/lib/refreshAfterMealChange";
import { spacing } from "@/src/theme/lifeplate";

export default function FriendsScreen() {
  const navigation = useNavigation();
  const refreshAfterMealChange = useRefreshAfterMealChange();

  const [friendCode, setFriendCode] = useState("");
  const [friends, setFriends] = useState<FriendSummary[]>([]);
  const [pendingShares, setPendingShares] = useState<MealShareRequestSummary[]>([]);
  const [addCode, setAddCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [shareBusyId, setShareBusyId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const [friendsData, shares, count] = await Promise.all([
      fetchFriends(),
      fetchIncomingMealShares(),
      fetchIncomingMealShareCount(),
    ]);
    setFriendCode(friendsData.friendCode);
    setFriends(friendsData.friends);
    setPendingShares(shares);
    navigation.setOptions({
      tabBarBadge: count > 0 ? count : undefined,
    });
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void loadData()
        .catch((e) => setSnackbar(friendlyErrorMessage(e)))
        .finally(() => setLoading(false));
    }, [loadData]),
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      tabBarBadge: pendingShares.length > 0 ? pendingShares.length : undefined,
    });
  }, [navigation, pendingShares.length]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadData();
    } catch (e) {
      setSnackbar(friendlyErrorMessage(e));
    } finally {
      setRefreshing(false);
    }
  }, [loadData]);

  async function handleAddFriend() {
    const code = addCode.trim();
    if (!code) return;
    setAdding(true);
    try {
      const { friend } = await addFriendByCode(code);
      setAddCode("");
      setFriends((prev) => {
        if (prev.some((f) => f.id === friend.id)) return prev;
        return [...prev, friend].sort((a, b) =>
          (a.name ?? a.id).localeCompare(b.name ?? b.id),
        );
      });
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
      setFriends((prev) => prev.filter((f) => f.id !== friendId));
      setSnackbar("Friend removed");
    } catch (e) {
      setSnackbar(friendlyErrorMessage(e));
    }
  }

  async function handleAccept(shareId: string, portionMeta?: MealPortionMeta) {
    setShareBusyId(shareId);
    try {
      await acceptMealShare(shareId, portionMeta ? { portionMeta } : undefined);
      setPendingShares((prev) => prev.filter((s) => s.id !== shareId));
      refreshAfterMealChange();
      setSnackbar("Meal added to your log");
      const count = await fetchIncomingMealShareCount();
      navigation.setOptions({ tabBarBadge: count > 0 ? count : undefined });
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
      setPendingShares((prev) => prev.filter((s) => s.id !== shareId));
      const count = await fetchIncomingMealShareCount();
      navigation.setOptions({ tabBarBadge: count > 0 ? count : undefined });
      setSnackbar("Share declined");
    } catch (e) {
      setSnackbar(friendlyErrorMessage(e));
    } finally {
      setShareBusyId(null);
    }
  }

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

      {loading ? (
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
