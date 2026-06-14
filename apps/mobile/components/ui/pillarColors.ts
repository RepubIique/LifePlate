import type { PillarStatus, ScoreStatus } from "@lifeplate/shared";

export function pillarColor(status: PillarStatus): string {
  if (status === "good") return "#40916C";
  if (status === "moderate") return "#E9C46A";
  return "#E76F51";
}

export function scoreRingColor(status: ScoreStatus): string {
  if (status === "excellent") return "#1B4332";
  if (status === "good") return "#40916C";
  return "#E9C46A";
}

export function statusBackground(status: PillarStatus | "on_track" | "moderate" | "needs_improvement"): string {
  if (status === "good" || status === "on_track") return "#D8F3DC";
  if (status === "moderate") return "#FEF3C7";
  return "#FEE2E2";
}
