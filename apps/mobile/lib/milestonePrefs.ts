import type { MilestoneId } from "@lifeplate/shared";
import {
  readSecureStoreJson,
  removeSecureStoreEntry,
  writeSecureStoreJson,
} from "@/lib/secureStoreCache";

type MilestonePrefsPayload = {
  seen: MilestoneId[];
};

function cacheKey(userId: string) {
  return `lifeplate:milestones:${userId}`;
}

export async function loadSeenMilestones(userId: string): Promise<Set<MilestoneId>> {
  const cached = await readSecureStoreJson<MilestonePrefsPayload>(cacheKey(userId));
  return new Set(cached?.seen ?? []);
}

export async function markMilestoneSeen(userId: string, id: MilestoneId): Promise<void> {
  const seen = await loadSeenMilestones(userId);
  if (seen.has(id)) return;
  seen.add(id);
  await writeSecureStoreJson(cacheKey(userId), { seen: [...seen] });
}

export async function clearSeenMilestones(userId: string): Promise<void> {
  await removeSecureStoreEntry(cacheKey(userId));
}
