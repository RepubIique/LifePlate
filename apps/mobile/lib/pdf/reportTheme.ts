import { PILLAR_COLORS } from "@/lib/pillarTheme";
import { palette, semantic, tints } from "@/src/theme/palette";

export const REPORT_CSS = `
  :root {
    --forest: ${palette.forest};
    --sage: ${palette.sage};
    --cream: ${palette.cream};
    --cream-light: ${tints.creamLight};
    --teal-light: ${tints.tealLight};
    --sage-light: ${tints.sageLight};
    --charcoal: ${palette.charcoal};
    --slate: ${palette.slateBlue};
    --coral: ${palette.coral};
    --terracotta: ${palette.terracotta};
    --soft-orange: ${palette.softOrange};
    --teal: ${palette.teal};
    --protein: ${PILLAR_COLORS.protein};
    --fibre: ${PILLAR_COLORS.fibre};
    --plants: ${PILLAR_COLORS.plants};
    --carbs: ${PILLAR_COLORS.carbs};
    --fat: ${PILLAR_COLORS.fat};
    --hydration: ${PILLAR_COLORS.hydration};
    --primary: ${semantic.primary};
    --text-muted: ${semantic.textMuted};
    --success: ${semantic.success};
    --danger: ${semantic.danger};
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: var(--charcoal);
    background: var(--cream-light);
    font-size: 13px;
    line-height: 1.45;
  }

  .page {
    padding: 32px 28px;
    min-height: 100vh;
    page-break-after: always;
  }

  .page:last-child { page-break-after: auto; }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 2px solid var(--sage-light);
  }

  .brand {
    font-size: 22px;
    font-weight: 700;
    color: var(--forest);
    letter-spacing: 0.3px;
  }

  .brand-sub {
    font-size: 11px;
    color: var(--slate);
    margin-top: 4px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }

  .meta {
    text-align: right;
    font-size: 12px;
    color: var(--slate);
  }

  .meta strong {
    display: block;
    color: var(--charcoal);
    font-size: 14px;
    margin-bottom: 2px;
  }

  .section-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--slate);
    opacity: 0.75;
    margin-bottom: 10px;
  }

  .hero {
    background: var(--teal-light);
    border-radius: 16px;
    padding: 24px;
    text-align: center;
    margin-bottom: 20px;
  }

  .hero-score {
    font-size: 52px;
    font-weight: 700;
    color: var(--forest);
    line-height: 1;
  }

  .hero-label {
    font-size: 12px;
    color: var(--slate);
    margin-top: 6px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }

  .badge {
    display: inline-block;
    margin-top: 10px;
    padding: 4px 12px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.3px;
  }

  .badge-excellent, .badge-good {
    background: var(--sage-light);
    color: var(--forest);
  }

  .badge-needs_work {
    background: #FFF4E0;
    color: var(--terracotta);
  }

  .stat-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 20px;
  }

  .stat-card {
    background: white;
    border: 1px solid var(--sage-light);
    border-radius: 14px;
    padding: 14px 16px;
  }

  .stat-card-label {
    font-size: 11px;
    color: var(--slate);
    opacity: 0.8;
    margin-bottom: 4px;
  }

  .stat-card-value {
    font-size: 20px;
    font-weight: 700;
    color: var(--forest);
  }

  .stat-card-value.positive { color: var(--forest); }
  .stat-card-value.negative { color: var(--coral); }
  .stat-card-value.neutral { color: var(--slate); }

  .insight-box {
    background: white;
    border: 1px solid var(--sage-light);
    border-radius: 14px;
    padding: 16px 18px;
    margin-bottom: 20px;
  }

  .insight-text {
    font-size: 13px;
    line-height: 1.55;
    color: var(--charcoal);
  }

  .footer {
    margin-top: 28px;
    padding-top: 16px;
    border-top: 1px solid var(--sage-light);
    font-size: 11px;
    color: var(--slate);
    text-align: center;
  }

  .footer-cta {
    margin-top: 8px;
    color: var(--forest);
    font-weight: 600;
  }

  .comparison-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
    font-size: 12px;
  }

  .comparison-table th,
  .comparison-table td {
    padding: 8px 10px;
    text-align: left;
    border-bottom: 1px solid var(--sage-light);
  }

  .comparison-table th {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: var(--slate);
    font-weight: 600;
  }

  .comparison-table td.num { text-align: right; }

  .delta-positive { color: var(--forest); font-weight: 600; }
  .delta-negative { color: var(--coral); font-weight: 600; }
  .delta-neutral { color: var(--slate); }

  .pillar-row {
    margin-bottom: 12px;
  }

  .pillar-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 4px;
    font-size: 12px;
  }

  .pillar-label { font-weight: 600; }

  .pillar-bar-track {
    height: 8px;
    background: var(--sage-light);
    border-radius: 999px;
    overflow: hidden;
  }

  .pillar-bar-fill {
    height: 100%;
    border-radius: 999px;
  }

  .trend-list { margin-bottom: 20px; }

  .trend-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid var(--sage-light);
    font-size: 13px;
  }

  .trend-badge {
    font-size: 10px;
    font-weight: 600;
    padding: 3px 10px;
    border-radius: 999px;
  }

  .trend-on_track { background: var(--sage-light); color: var(--forest); }
  .trend-moderate { background: #FFF4E0; color: var(--terracotta); }
  .trend-needs_improvement { background: #FDE8E6; color: var(--coral); }

  .recommendations { margin-bottom: 20px; }

  .recommendation-item {
    padding: 8px 0;
    border-bottom: 1px solid var(--sage-light);
    font-size: 13px;
  }

  .meal-day {
    margin-bottom: 16px;
  }

  .meal-day-label {
    font-size: 12px;
    font-weight: 700;
    color: var(--forest);
    margin-bottom: 8px;
  }

  .meal-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 11px;
  }

  .meal-table th,
  .meal-table td {
    padding: 6px 8px;
    text-align: left;
    border-bottom: 1px solid var(--sage-light);
  }

  .meal-table th {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--slate);
  }

  .meal-table tr:nth-child(even) td {
    background: var(--teal-light);
  }

  .profile-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 20px;
  }

  .profile-item {
    background: white;
    border: 1px solid var(--sage-light);
    border-radius: 12px;
    padding: 10px 12px;
  }

  .profile-item-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--slate);
    margin-bottom: 2px;
  }

  .profile-item-value {
    font-size: 14px;
    font-weight: 600;
    color: var(--forest);
  }

  .score-compare {
    display: flex;
    justify-content: center;
    gap: 32px;
    margin-top: 16px;
  }

  .score-col { text-align: center; }

  .score-col-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--slate);
    margin-bottom: 4px;
  }

  .score-col-value {
    font-size: 28px;
    font-weight: 700;
    color: var(--forest);
  }

  .score-col-value.muted {
    opacity: 0.45;
  }

  .sparkline {
    display: flex;
    align-items: flex-end;
    gap: 6px;
    height: 88px;
    margin-bottom: 20px;
    padding: 12px 14px;
    background: white;
    border: 1px solid var(--sage-light);
    border-radius: 14px;
  }

  .spark-bar-wrap {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
    justify-content: flex-end;
  }

  .spark-bar {
    width: 100%;
    max-width: 18px;
    background: var(--forest);
    border-radius: 4px 4px 2px 2px;
    min-height: 4px;
  }

  .spark-bar-empty {
    background: var(--sage-light);
  }

  .spark-label {
    font-size: 8px;
    color: var(--slate);
    margin-top: 4px;
  }

  .clinical-cover {
    background: white;
    border-bottom: 4px solid var(--forest);
  }

  .clinical-badge {
    display: inline-block;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    color: var(--forest);
    background: var(--sage-light);
    padding: 6px 12px;
    border-radius: 999px;
    margin-bottom: 16px;
  }

  .clinical-title {
    font-size: 26px;
    color: var(--forest);
    margin-bottom: 20px;
    font-weight: 700;
  }

  .clinical-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    margin-bottom: 20px;
    font-size: 14px;
  }

  .clinical-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    color: var(--slate);
  }

  .clinical-summary {
    background: var(--teal-light);
    border-radius: 14px;
    padding: 16px;
    margin-bottom: 16px;
    font-size: 13px;
    line-height: 1.55;
  }

  .clinical-disclaimer,
  .clinical-future-note {
    font-size: 11px;
    color: var(--slate);
    line-height: 1.5;
    margin-top: 10px;
  }

  .food-list {
    font-size: 12px;
    margin-bottom: 8px;
    line-height: 1.45;
  }

  .meal-note {
    font-size: 10px;
    color: var(--slate);
    margin-top: 2px;
    font-style: italic;
  }

  .meal-thumb {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    object-fit: cover;
    display: block;
    margin-bottom: 4px;
  }
`;
