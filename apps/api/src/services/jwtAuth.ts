import { jwtVerify, type JWTPayload } from "jose";
import { config } from "../config.js";

export type VerifiedSupabaseUser = {
  id: string;
  email: string;
  name: string | null;
};

function readName(payload: JWTPayload): string | null {
  const metadata = payload.user_metadata;
  if (!metadata || typeof metadata !== "object") return null;
  const record = metadata as Record<string, unknown>;
  if (typeof record.full_name === "string" && record.full_name.trim()) {
    return record.full_name.trim();
  }
  if (typeof record.name === "string" && record.name.trim()) {
    return record.name.trim();
  }
  return null;
}

export async function verifySupabaseAccessToken(
  token: string,
): Promise<VerifiedSupabaseUser | null> {
  const secret = config.supabaseJwtSecret.trim();
  if (!secret) return null;

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
      algorithms: ["HS256"],
    });

    if (typeof payload.sub !== "string" || !payload.sub) return null;

    const email = typeof payload.email === "string" ? payload.email : "";

    return {
      id: payload.sub,
      email,
      name: readName(payload),
    };
  } catch {
    return null;
  }
}

export function canVerifySupabaseJwtLocally(): boolean {
  return config.supabaseJwtSecret.trim().length > 0;
}
