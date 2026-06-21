export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export function parseApiError(body: string, status: number): ApiError {
  try {
    const json = JSON.parse(body) as {
      error?: string;
      message?: string;
      code?: string;
    };
    const msg = json.message ?? json.error ?? body;
    return new ApiError(msg, status, json.code);
  } catch {
    return new ApiError(body || `Request failed (${status})`, status);
  }
}

export function authFriendlyErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();

  if (lower.includes("invalid login") || lower.includes("invalid credentials")) {
    return "Email or password doesn't match. Check and try again.";
  }
  if (lower.includes("user already registered") || lower.includes("already been registered")) {
    return "An account with this email already exists. Sign in instead.";
  }
  if (lower.includes("password") && lower.includes("least")) {
    return "Password must be at least 6 characters.";
  }
  if (lower.includes("email") && (lower.includes("invalid") || lower.includes("valid"))) {
    return "Enter a valid email address.";
  }
  if (lower.includes("signup") && lower.includes("disabled")) {
    return "Email sign-up isn't available right now. Try Apple or Google instead.";
  }
  if (lower.includes("email not confirmed")) {
    return "Confirm your email first, then sign in.";
  }

  return msg || "Couldn't sign you in. Try again.";
}

export function mediaPermissionMessage(
  kind: "camera" | "library" | "either",
  canAskAgain?: boolean,
): string {
  const what =
    kind === "camera" ? "camera" : kind === "library" ? "photo library" : "camera or photos";
  if (canAskAgain === false) {
    return `LifePlate needs ${what} access. Open Settings to enable it.`;
  }
  return `Allow ${what} access to log meals with photos.`;
}

export function isRetryableError(err: unknown): boolean {
  if (err instanceof ApiError) {
    if (err.status === 401 || err.status === 413) return false;
    if (
      err.code === "NOT_FOOD" ||
      err.code === "UNCLEAR_PHOTO" ||
      err.code === "INVALID_IMAGE" ||
      err.code === "REANALYZE_LIMIT"
    ) {
      return false;
    }
    if (err.status === 429 || err.code === "RATE_LIMITED") return false;
    if (err.status >= 500 || err.status === 408) return true;
    if (
      err.message.includes("Failed to fetch") ||
      err.message.includes("Network request failed")
    ) {
      return true;
    }
    return false;
  }
  if (err instanceof Error) {
    const lower = err.message.toLowerCase();
    return (
      lower.includes("network") ||
      lower.includes("fetch") ||
      lower.includes("timeout") ||
      lower.includes("abort")
    );
  }
  return false;
}

export type MealFlowContext = "upload" | "analyze-text" | "confirm";

export function mealFlowErrorMessage(err: unknown, context: MealFlowContext): string {
  if (!isRetryableError(err)) {
    return friendlyErrorMessage(err);
  }
  if (context === "confirm") {
    return "Couldn't save your meal yet. It's still on this screen — tap Save again when you're back online.";
  }
  if (context === "analyze-text") {
    return "Couldn't estimate your meal right now. Check your connection and tap Retry.";
  }
  return "Couldn't analyze your photo right now. Your photo is still here — tap Retry.";
}

export function hydrationSyncErrorMessage(): string {
  return "Couldn't sync hydration. Tap Retry when you're back online.";
}

export function isLoggingLockedError(err: unknown): err is ApiError {
  return err instanceof ApiError && err.code === "LOGGING_LOCKED";
}

export function friendlyErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return "Session expired. Please sign in again.";
    if (err.status === 413) return "Photo is too large. Try a smaller image or crop.";
    if (err.status >= 500) {
      return "Couldn't upload your meal right now. Check your connection and try again.";
    }
    if (err.code === "REANALYZE_LIMIT") {
      return err.message || "You've used all AI re-analyses for this meal.";
    }
    if (err.status === 429 || err.code === "RATE_LIMITED") {
      return err.message || "You've reached the limit for this hour. Try again in a bit.";
    }
    if (err.code === "NOT_FOOD") {
      return err.message.includes("doesn't sound like food")
        ? err.message
        : "LifePlate works with food photos. Try again with your meal on the plate.";
    }
    if (err.code === "UNCLEAR_PHOTO") {
      return err.message.includes("description")
        ? err.message
        : "We couldn't see the food clearly. Try brighter light or move closer.";
    }
    if (err.code === "PLUS_REQUIRED") {
      return "Cloud photo backup requires LifePlate Plus.";
    }
    if (err.code === "LOGGING_LOCKED") {
      return err.message || "Your free week has ended. Upgrade to LifePlate Plus to keep logging meals.";
    }
    if (err.code === "INVALID_IMAGE") {
      return "Please upload a photo of your meal (JPEG or PNG).";
    }
    if (err.code === "NOT_SHAREABLE") {
      return "Only meals you logged yourself can be shared with friends.";
    }
    if (err.code === "ALREADY_PENDING") {
      return err.message || "This meal is already waiting for those friends to accept.";
    }
    if (err.code === "NOT_FRIEND") {
      return "You can only share meals with friends.";
    }
    if (err.code === "ALREADY_EXISTS") {
      return err.message || "A challenge with this friend already exists this week.";
    }
    if (err.message.includes("Failed to fetch") || err.message.includes("Network request failed")) {
      return "Cannot reach the server. Wait a moment and try again — the API may be waking up.";
    }
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return "Something went wrong.";
}
