import type { FastifyReply, FastifyRequest } from "fastify";
import { config } from "./config.js";
import { upsertUser } from "./db.js";
import { getSupabaseAdmin } from "./supabase.js";

export type AuthedRequest = FastifyRequest & {
  userId: string;
  userEmail: string;
};

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

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    reply.code(500).send({ error: "Auth not configured" });
    return;
  }

  const { data, error } = await getSupabaseAdmin().auth.getUser(token);
  if (error || !data.user) {
    reply.code(401).send({ error: "Invalid token" });
    return;
  }

  const user = data.user;
  await upsertUser(
    user.id,
    user.email ?? "",
    user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
  );

  (request as AuthedRequest).userId = user.id;
  (request as AuthedRequest).userEmail = user.email ?? "";
}
