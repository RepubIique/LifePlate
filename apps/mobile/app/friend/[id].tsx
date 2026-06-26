import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, RefreshControl, StyleSheet, View } from "react-native";
import { ActivityIndicator, Button, IconButton } from "react-native-paper";
import type { FriendProfileSummary } from "@lifeplate/shared";
import { BottomSnackbar } from "@/components/ui/BottomSnackbar";
import { CoopChallengeCard } from "@/components/gamification/CoopChallengeCard";
import { FriendActivityCard } from "@/components/friends/FriendActivityCard";
import { FriendProfileHero } from "@/components/friends/FriendProfileHero";
import { FriendSharingCard } from "@/components/friends/FriendSharingCard";
import { PremiumHeader } from "@/components/PremiumHeader";
import { Screen } from "@/components/Screen";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { useFriends } from "@/context/FriendsContext";
import { useGamification } from "@/context/GamificationContext";
import {
  acceptCoopChallenge,
  declineCoopChallenge,
  fetchFriendProfile,
  inviteCoopChallenge,
  removeFriend,
} from "@/lib/api";
import { friendlyErrorMessage } from "@/lib/apiErrors";
import { useAppColors } from "@/context/ThemeContext";
import { spacing } from "@/src/theme/lifeplate";

export default function FriendProfileScreen() {
  const { semantic } = useAppColors();
  const { id, name: nameParam } = useLocalSearchParams<{ id: string; name?: string }>();
  const friendId = typeof id === "string" ? id : "";
  const { patchFriends, friends } = useFriends();
  const {
    challenges: coopChallenges,
    patchGamification,
    refreshGamification,
  } = useGamification();

  const [profile, setProfile] = useState<FriendProfileSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [coopBusy, setCoopBusy] = useState(false);
  const [inviteBusy, setInviteBusy] = useState(false);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const fallbackName = typeof nameParam === "string" ? nameParam.trim() : "";
  const displayName = profile?.name?.trim() || fallbackName || "Friend";

  const activeChallenge = useMemo(
    () =>
      coopChallenges.find(
        (c) => c.friendId === friendId && c.status !== "declined",
      ) ?? null,
    [coopChallenges, friendId],
  );

  const canInviteChallenge = !activeChallenge;

  const loadProfile = useCallback(async () => {
    if (!friendId) return;
    const data = await fetchFriendProfile(friendId);
    setProfile(data);
  }, [friendId]);

  useEffect(() => {
    if (!friendId) return;
    setLoading(true);
    void loadProfile()
      .catch((e) => setSnackbar(friendlyErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [friendId, loadProfile]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await Promise.all([loadProfile(), refreshGamification()]);
    } catch (e) {
      setSnackbar(friendlyErrorMessage(e));
    } finally {
      setRefreshing(false);
    }
  }

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/(tabs)/friends");
  }

  async function handleInviteChallenge() {
    setInviteBusy(true);
    try {
      const { challenge } = await inviteCoopChallenge({
        friendId,
        challengeType: "hydration_5_of_7",
      });
      patchGamification({
        challenges: [challenge, ...coopChallenges.filter((c) => c.id !== challenge.id)],
      });
      setSnackbar(`Challenge sent to ${displayName}`);
    } catch (e) {
      setSnackbar(friendlyErrorMessage(e));
    } finally {
      setInviteBusy(false);
    }
  }

  async function handleAcceptCoop(challengeId: string) {
    setCoopBusy(true);
    try {
      const { challenge } = await acceptCoopChallenge(challengeId);
      patchGamification({
        challenges: coopChallenges.map((c) => (c.id === challengeId ? challenge : c)),
      });
      setSnackbar("Challenge accepted — you've got this together");
    } catch (e) {
      setSnackbar(friendlyErrorMessage(e));
    } finally {
      setCoopBusy(false);
    }
  }

  async function handleDeclineCoop(challengeId: string) {
    setCoopBusy(true);
    try {
      await declineCoopChallenge(challengeId);
      patchGamification({
        challenges: coopChallenges.filter((c) => c.id !== challengeId),
      });
      setSnackbar("Challenge declined");
    } catch (e) {
      setSnackbar(friendlyErrorMessage(e));
    } finally {
      setCoopBusy(false);
    }
  }

  function confirmRemoveFriend() {
    Alert.alert("Remove friend?", `Remove ${displayName} from your friends?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          void (async () => {
            try {
              await removeFriend(friendId);
              patchFriends({ friends: friends.filter((f) => f.id !== friendId) });
              setSnackbar("Friend removed");
              handleBack();
            } catch (e) {
              setSnackbar(friendlyErrorMessage(e));
            }
          })();
        },
      },
    ]);
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
        title={displayName}
        subtitle="Friend activity"
        left={
          <IconButton
            icon="arrow-left"
            size={22}
            onPress={handleBack}
            accessibilityLabel="Go back"
          />
        }
      />

      {loading && !profile ? (
        <View style={styles.loading}>
          <ActivityIndicator />
        </View>
      ) : profile ? (
        <View style={styles.body}>
          <FriendProfileHero profile={profile} />
          <FriendActivityCard profile={profile} />
          <FriendSharingCard profile={profile} />

          {activeChallenge ? (
            <>
              <SectionLabel title="Co-op challenge" />
              <CoopChallengeCard
                challenge={activeChallenge}
                busy={coopBusy}
                onAccept={handleAcceptCoop}
                onDecline={handleDeclineCoop}
              />
            </>
          ) : canInviteChallenge ? (
            <Button
              mode="outlined"
              icon="handshake-outline"
              loading={inviteBusy}
              disabled={inviteBusy}
              onPress={() => void handleInviteChallenge()}
            >
              Invite to weekly challenge
            </Button>
          ) : null}

          <Button
            mode="text"
            textColor={semantic.danger}
            onPress={confirmRemoveFriend}
            style={styles.removeBtn}
          >
            Remove friend
          </Button>
        </View>
      ) : null}

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
  removeBtn: {
    marginTop: spacing.sm,
  },
});
