import type { FastifyReply, FastifyRequest } from "fastify";
import { config } from "./config.js";
import { upsertUser } from "./db.js";
import { getSupabaseAdmin } from "./supabase.js";
import {
  canVerifySupabaseJwtLocally,
  verifySupabaseAccessToken,
} from "./services/jwtAuth.js";

export type AuthedRequest = FastifyRequest & {
  userId: string;
  userEmail: string;
};

const knownUsers = new Set<string>();

async function resolveUserFromToken(token: string): Promise<{
  id: string;
  email: string;
  name: string | null;
} | null> {
  if (canVerifySupabaseJwtLocally()) {
    const local = await verifySupabaseAccessToken(token);
    if (local) return local;
  }

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    return null;
  }

  const { data, error } = await getSupabaseAdmin().auth.getUser(token);
  if (error || !data.user) return null;

  const user = data.user;
  return {
    id: user.id,
    email: user.email ?? "",
    name:
      user.user_metadata?.full_name ??
      user.user_metadata?.name ??
      null,
  };
}

export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    reply.code(401).send({ error: "Unauthorized" });
    return;
  }

  const token = header.slice("Bearer ".length);

  if (
    !canVerifySupabaseJwtLocally() &&
    (!config.supabaseUrl || !config.supabaseServiceRoleKey)
  ) {
    reply.code(500).send({ error: "Auth not configured" });
    return;
  }

  const user = await resolveUserFromToken(token);
  if (!user) {
    reply.code(401).send({ error: "Invalid token" });
    return;
  }

  if (!knownUsers.has(user.id)) {
    await upsertUser(user.id, user.email, user.name);
    knownUsers.add(user.id);
  }

  (request as AuthedRequest).userId = user.id;
  (request as AuthedRequest).userEmail = user.email;
}
