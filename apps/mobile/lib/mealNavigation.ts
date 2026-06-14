import { router } from "expo-router";

export type MealEditReturnTo = "home" | "timeline";

export function openMealEdit(id: string, returnTo: MealEditReturnTo) {
  router.push({
    pathname: "/meal/edit",
    params: { id, returnTo },
  });
}

export function leaveMealEditScreen(returnTo?: string) {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace(returnTo === "home" ? "/(tabs)" : "/(tabs)/timeline");
}
