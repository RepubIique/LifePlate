import type { PillarStatus, ScoreStatus } from "@lifeplate/shared";

export function scoreStatusHeadline(status: ScoreStatus): string {
  if (status === "excellent") return "On track";
  if (status === "good") return "Solid day";
  return "Room to grow";
}

export function scoreStatusSubline(status: ScoreStatus): string {
  if (status === "excellent") return "You're hitting your nutrition targets";
  if (status === "good") return "A few small gaps left today";
  return "Tap a section below to see what helps";
}

/** Maps daily score band to pillar-style badge colors. */
export function scoreStatusAsPillarStatus(status: ScoreStatus): PillarStatus {
  if (status === "excellent") return "good";
  if (status === "good") return "moderate";
  return "low";
}

export function pillarStatusHeadline(status: PillarStatus): string {
  if (status === "good") return "On track";
  if (status === "moderate") return "Getting there";
  return "Needs attention";
}

/** Fallback when scoreStatus is unavailable — mirrors score bands on plate fill. */
export function scoreStatusFromCompleteness(completeness: number): ScoreStatus {
  if (completeness >= 85) return "excellent";
  if (completeness >= 70) return "good";
  return "needs_work";
}
