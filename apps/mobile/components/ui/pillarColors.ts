import type { PillarStatus, ScoreStatus } from "@lifeplate/shared";
import { palette, semantic, tints } from "@/src/theme/palette";

export function pillarColor(status: PillarStatus): string {
  if (status === "good") return semantic.success;
  if (status === "moderate") return semantic.warning;
  return semantic.danger;
}

export function scoreRingColor(status: ScoreStatus): string {
  if (status === "excellent") return semantic.primary;
  if (status === "good") return semantic.success;
  return semantic.warning;
}

export function statusBackground(
  status: PillarStatus | "on_track" | "moderate" | "needs_improvement",
): string {
  if (status === "good" || status === "on_track") return semantic.successBackground;
  if (status === "moderate") return semantic.warningBackground;
  return semantic.dangerBackground;
}

/** Re-export palette accents used by nutrition visuals. */
export { palette, semantic, tints };
