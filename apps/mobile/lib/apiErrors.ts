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

export function friendlyErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return "Session expired. Please sign in again.";
    if (err.status === 413) return "Photo is too large. Try a smaller image or crop.";
    if (err.message.includes("Failed to fetch") || err.message.includes("Network request failed")) {
      return "Cannot reach the server. Wait a moment and try again — the API may be waking up.";
    }
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return "Something went wrong.";
}
