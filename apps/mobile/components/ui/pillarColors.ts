import type { PillarStatus, ScoreStatus } from "@lifeplate/shared";
import type { SemanticColors } from "@/src/theme/palette";
import { palette } from "@/src/theme/palette";

export function pillarColor(status: PillarStatus, semantic: SemanticColors): string {
  if (status === "good") return semantic.success;
  if (status === "moderate") return semantic.warning;
  return semantic.danger;
}

export function scoreRingColor(status: ScoreStatus, semantic: SemanticColors): string {
  if (status === "excellent") return semantic.primary;
  if (status === "good") return semantic.success;
  return semantic.warning;
}

export function statusBackground(
  status: PillarStatus | "on_track" | "moderate" | "needs_improvement",
  semantic: SemanticColors,
): string {
  if (status === "good" || status === "on_track") return semantic.successBackground;
  if (status === "moderate") return semantic.warningBackground;
  return semantic.dangerBackground;
}

/** Brand accents used by nutrition visuals (scheme-agnostic). */
export { palette };
