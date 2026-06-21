import { useEffect } from "react";
import {
  buildDigitalPlateWidgetProps,
  DIGITAL_PLATE_WIDGET_LOCKED,
} from "@lifeplate/shared";
import { useAuth } from "@/context/AuthContext";
import { useNutritionDashboard } from "@/context/NutritionDashboardContext";
import { syncDigitalPlateWidget } from "@/lib/widgetPlateSync";

/** Keeps the iOS home screen widget in sync with today's dashboard. */
export function DigitalPlateWidgetSync() {
  const { profile, session } = useAuth();
  const { dashboard } = useNutritionDashboard();

  useEffect(() => {
    if (!session) {
      syncDigitalPlateWidget(DIGITAL_PLATE_WIDGET_LOCKED);
      return;
    }

    const isPaid = profile?.isPaid ?? false;
    if (!isPaid) {
      syncDigitalPlateWidget(DIGITAL_PLATE_WIDGET_LOCKED);
      return;
    }

    if (!dashboard) return;

    const { essentials, score } = dashboard;
    const hasMeals =
      essentials.protein.consumed > 0 ||
      essentials.fibre.consumed > 0 ||
      essentials.plants.consumed > 0 ||
      essentials.carbs.consumed > 0 ||
      essentials.hydration.consumed > 0;

    syncDigitalPlateWidget(
      buildDigitalPlateWidgetProps({
        isPaid: true,
        protein: essentials.protein,
        fibre: essentials.fibre,
        plants: essentials.plants,
        carbs: essentials.carbs,
        nutritionScore: score,
        hasMeals,
      }),
    );
  }, [session, profile?.isPaid, dashboard]);

  return null;
}
