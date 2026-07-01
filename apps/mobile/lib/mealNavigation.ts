import { router } from "expo-router";

export type MealEditReturnTo = "home" | "timeline" | "plan";

export function openMealEdit(id: string, returnTo: MealEditReturnTo) {
  router.push({
    pathname: "/meal/edit",
    params: { id, returnTo },
  });
}

export function openPlannedMeal(id: string, returnTo: MealEditReturnTo = "plan") {
  router.push({
    pathname: "/meal/plan",
    params: { id, returnTo },
  });
}

export function leaveMealEditScreen(returnTo?: string) {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  if (returnTo === "plan") {
    router.replace("/(tabs)/plan");
    return;
  }

  router.replace(returnTo === "home" ? "/(tabs)" : "/(tabs)/timeline");
}
