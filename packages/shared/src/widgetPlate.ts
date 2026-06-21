export type DigitalPlateWidgetProps = {
  isPaid: boolean;
  hasMeals: boolean;
  completeness: number;
  nutritionScore?: number;
  protein: number;
  fibre: number;
  plants: number;
  carbs: number;
};

export function clampPlateProgress(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function plateCompletenessPercent(progressValues: number[]): number {
  if (progressValues.length === 0) return 0;
  const avg =
    progressValues.reduce((sum, value) => sum + clampPlateProgress(value), 0) /
    progressValues.length;
  return Math.round(avg * 100);
}

export function buildDigitalPlateWidgetProps(input: {
  isPaid: boolean;
  protein: { progress: number };
  fibre: { progress: number };
  plants: { progress: number };
  carbs: { progress: number };
  nutritionScore?: number;
  hasMeals: boolean;
}): DigitalPlateWidgetProps {
  const protein = clampPlateProgress(input.protein.progress);
  const fibre = clampPlateProgress(input.fibre.progress);
  const plants = clampPlateProgress(input.plants.progress);
  const carbs = clampPlateProgress(input.carbs.progress);

  return {
    isPaid: input.isPaid,
    hasMeals: input.hasMeals,
    completeness: plateCompletenessPercent([protein, fibre, plants, carbs]),
    nutritionScore: input.nutritionScore,
    protein,
    fibre,
    plants,
    carbs,
  };
}

/** Widget camera quick-action — keep in sync with DigitalPlateWidget.ios.tsx Button target. */
export const WIDGET_LOG_CAMERA_TARGET = "log-camera";

export const WIDGET_LOG_CAMERA_URL = "lifeplate:///log/camera";

export const DIGITAL_PLATE_WIDGET_LOCKED: DigitalPlateWidgetProps = {
  isPaid: false,
  hasMeals: false,
  completeness: 0,
  protein: 0,
  fibre: 0,
  plants: 0,
  carbs: 0,
};
