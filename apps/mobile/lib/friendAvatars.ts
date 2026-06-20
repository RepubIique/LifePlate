import type { FriendSummary } from "@lifeplate/shared";
import { fetchFriendAvatar } from "@/lib/api";
import {
  downloadAndCacheAvatar,
  getCachedAvatarUri,
} from "@/lib/avatarCache";

const inflight = new Map<string, Promise<string | null>>();

type FriendAvatarRef = Pick<FriendSummary, "id" | "hasAvatar">;

/** Fetch and cache a friend's avatar once. Skips when no photo or already on disk. */
export async function ensureFriendAvatarCached(
  friend: FriendAvatarRef,
): Promise<string | null> {
  if (!friend.hasAvatar) return null;

  const cached = await getCachedAvatarUri(friend.id);
  if (cached) return cached;

  let pending = inflight.get(friend.id);
  if (!pending) {
    pending = (async () => {
      try {
        const { avatarUrl } = await fetchFriendAvatar(friend.id);
        if (!avatarUrl) return null;
        return await downloadAndCacheAvatar(friend.id, avatarUrl);
      } catch {
        return null;
      } finally {
        inflight.delete(friend.id);
      }
    })();
    inflight.set(friend.id, pending);
  }

  return pending;
}

/** Background prefetch for friends missing a local avatar file. */
export async function prefetchMissingFriendAvatars(
  friends: FriendSummary[],
): Promise<void> {
  const tasks: Promise<string | null>[] = [];
  for (const friend of friends) {
    if (!friend.hasAvatar) continue;
    const cached = await getCachedAvatarUri(friend.id);
    if (cached) continue;
    tasks.push(ensureFriendAvatarCached(friend));
  }
  await Promise.all(tasks);
}
