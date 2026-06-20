import type { PillarStatus, ScoreStatus } from "@lifeplate/shared";

export function scoreStatusHeadline(status: ScoreStatus): string {
  if (status === "excellent") return "On track";
  if (status === "good") return "Solid day";
  return "Room to grow";
}

export function scoreStatusSubline(status: ScoreStatus, afterDinner = false): string {
  if (afterDinner) {
    if (status === "excellent") return "Strong day — tomorrow is a fresh plate";
    if (status === "good") return "Dinner's in — small gaps can wait until tomorrow";
    return "You showed up today — focus on tomorrow's plate";
  }
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

export function pillarStatusHeadline(status: PillarStatus, afterDinner = false): string {
  if (status === "good") return "On track";
  if (status === "moderate") return afterDinner ? "Fine for today" : "Getting there";
  return afterDinner ? "For tomorrow" : "Needs attention";
}

/** Fallback when scoreStatus is unavailable — mirrors score bands on plate fill. */
export function scoreStatusFromCompleteness(completeness: number): ScoreStatus {
  if (completeness >= 85) return "excellent";
  if (completeness >= 70) return "good";
  return "needs_work";
}
