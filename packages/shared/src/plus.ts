export type PlusFeatureId = "unlimited_logging" | "cloud_backup" | "digital_plate_widget" | "pdf_export";

export type PlusFeatureDefinition = {
  id: PlusFeatureId;
  title: string;
  description: string;
  /** MaterialCommunityIcons glyph name — used by mobile UI only. */
  icon: string;
};

export const PLUS_PLAN = {
  name: "LifePlate Plus",
  tagline: "Keep building your health story.",
  priceLabel: "$4.99 / month",
  priceNote: "Free includes 7 days of meal logging. Cancel anytime.",
} as const;

export const PLUS_FEATURES: readonly PlusFeatureDefinition[] = [
  {
    id: "unlimited_logging",
    title: "Unlimited meal logging",
    description: "Keep photographing meals and building your timeline after your free week ends.",
    icon: "calendar-check-outline",
  },
  {
    id: "cloud_backup",
    title: "Cloud photo backup",
    description:
      "Meal photos are stored in the cloud so your timeline survives a new phone or reinstall.",
    icon: "cloud-upload-outline",
  },
  {
    id: "digital_plate_widget",
    title: "Digital Plate widget",
    description:
      "Pin today's plate to your home screen — protein, fibre, plants, and carbs at a glance.",
    icon: "view-grid-outline",
  },
  {
    id: "pdf_export",
    title: "Full PDF trend reports",
    description:
      "Export multi-page reports with pillar breakdowns, comparisons, and meal logs to share or print.",
    icon: "file-pdf-box",
  },
] as const;

/** Shown on paywall — clarifies what stays free during trial. */
export const PLUS_FREE_TIER_NOTE =
  "Your first 7 days include full logging, AI analysis, the Digital Plate, insights, and friends.";

export function plusFeatureById(id: PlusFeatureId): PlusFeatureDefinition | undefined {
  return PLUS_FEATURES.find((feature) => feature.id === id);
}
