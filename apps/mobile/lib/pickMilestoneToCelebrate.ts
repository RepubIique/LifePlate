import type { MilestoneId } from "@lifeplate/shared";

export function pickMilestoneToCelebrate(
  eligible: MilestoneId[],
  seen: ReadonlySet<MilestoneId>,
): { celebrate: MilestoneId; markSeen: MilestoneId[] } | null {
  const unseen = eligible.filter((id) => !seen.has(id));
  if (unseen.length === 0) return null;

  return {
    celebrate: unseen[unseen.length - 1]!,
    markSeen: unseen,
  };
}
