export type ReportTemplateId =
  | "trend"
  | "gut_health"
  | "protein"
  | "eat_out"
  | "clinical";

export type ReportTemplateDefinition = {
  id: ReportTemplateId;
  title: string;
  description: string;
  icon: string;
};

export const REPORT_TEMPLATES: readonly ReportTemplateDefinition[] = [
  {
    id: "trend",
    title: "Trend overview",
    description: "Score, pillars, comparisons, and meal log",
    icon: "chart-line",
  },
  {
    id: "gut_health",
    title: "Gut health focus",
    description: "Fermented & prebiotic foods, fibre, and gut score",
    icon: "bacteria-outline",
  },
  {
    id: "protein",
    title: "Protein & muscle",
    description: "Protein pillar, muscle support trend, high-protein meals",
    icon: "food-steak",
  },
  {
    id: "eat_out",
    title: "Eat-out audit",
    description: "Home vs eat-out split with takeaway meals highlighted",
    icon: "silverware-fork-knife",
  },
  {
    id: "clinical",
    title: "Clinical handoff",
    description: "Cover page for GP or dietitian with disclaimer",
    icon: "hospital-box-outline",
  },
] as const;

export function reportTemplateById(id: ReportTemplateId): ReportTemplateDefinition {
  return REPORT_TEMPLATES.find((t) => t.id === id) ?? REPORT_TEMPLATES[0];
}
