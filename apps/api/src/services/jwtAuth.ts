import {
  createRemoteJWKSet,
  decodeProtectedHeader,
  jwtVerify,
  type JWTPayload,
} from "jose";
import { config } from "../config.js";

export type VerifiedSupabaseUser = {
  id: string;
  email: string;
  name: string | null;
};

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function supabaseAuthBaseUrl(): string | null {
  const url = config.supabaseUrl.trim().replace(/\/$/, "");
  return url || null;
}

function getJwks() {
  const base = supabaseAuthBaseUrl();
  if (!base) return null;
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`${base}/auth/v1/.well-known/jwks.json`));
  }
  return jwks;
}

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

function payloadToUser(payload: JWTPayload): VerifiedSupabaseUser | null {
  if (typeof payload.sub !== "string" || !payload.sub) return null;
  const email = typeof payload.email === "string" ? payload.email : "";
  return {
    id: payload.sub,
    email,
    name: readName(payload),
  };
}

async function verifyWithJwks(token: string): Promise<VerifiedSupabaseUser | null> {
  const keys = getJwks();
  const base = supabaseAuthBaseUrl();
  if (!keys || !base) return null;

  try {
    const { payload } = await jwtVerify(token, keys, {
      issuer: `${base}/auth/v1`,
    });
    return payloadToUser(payload);
  } catch {
    return null;
  }
}

async function verifyWithSecret(token: string): Promise<VerifiedSupabaseUser | null> {
  const secret = config.supabaseJwtSecret.trim();
  if (!secret) return null;

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
      algorithms: ["HS256"],
    });
    return payloadToUser(payload);
  } catch {
    return null;
  }
}

export async function verifySupabaseAccessToken(
  token: string,
): Promise<VerifiedSupabaseUser | null> {
  try {
    const header = decodeProtectedHeader(token);
    if (header.alg === "HS256") {
      const fromSecret = await verifyWithSecret(token);
      if (fromSecret) return fromSecret;
    } else {
      const fromJwks = await verifyWithJwks(token);
      if (fromJwks) return fromJwks;
    }
  } catch {
    // Fall through to trying both strategies.
  }

  const fromJwks = await verifyWithJwks(token);
  if (fromJwks) return fromJwks;

  return verifyWithSecret(token);
}

export function canVerifySupabaseJwtLocally(): boolean {
  return config.supabaseJwtSecret.trim().length > 0 || supabaseAuthBaseUrl() != null;
}
