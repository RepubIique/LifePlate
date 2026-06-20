import type { PillarStatus } from "@lifeplate/shared";

export function pillarStatusHeadline(status: PillarStatus): string {
  if (status === "good") return "On track";
  if (status === "moderate") return "Getting there";
  return "Needs attention";
}
