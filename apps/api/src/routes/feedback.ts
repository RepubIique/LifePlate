import type { FastifyInstance } from "fastify";
import type { AlphaFeedbackMessage, AlphaFeedbackMessagesResponse } from "@lifeplate/shared";
import type { AuthedRequest } from "../auth.js";
import { requireAuth } from "../auth.js";
import { pool } from "../db.js";

const MAX_MESSAGE_LENGTH = 2000;
const DEFAULT_LIMIT = 100;

type MessageRow = {
  id: string;
  user_id: string;
  author_name: string;
  message: string;
  created_at: Date;
};

function toMessage(row: MessageRow): AlphaFeedbackMessage {
  return {
    id: row.id,
    userId: row.user_id,
    authorName: row.author_name,
    message: row.message,
    createdAt: row.created_at.toISOString(),
  };
}

async function resolveAuthorName(userId: string, userEmail: string): Promise<string> {
  const { rows } = await pool.query<{ name: string | null }>(
    `SELECT name FROM users WHERE id = $1`,
    [userId],
  );
  const name = rows[0]?.name?.trim();
  if (name) return name;
  const localPart = userEmail.split("@")[0]?.trim();
  return localPart || "Alpha tester";
}

export async function feedbackRoutes(app: FastifyInstance) {
  app.get(
    "/api/feedback/messages",
    { preHandler: requireAuth },
    async (request) => {
      const query = request.query as { before?: string; limit?: string };
      const limit = Math.min(
        DEFAULT_LIMIT,
        Math.max(1, Number.parseInt(query.limit ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT),
      );
      const before = query.before?.trim();

      const { rows } = before
        ? await pool.query<MessageRow>(
            `SELECT id, user_id, author_name, message, created_at
             FROM alpha_feedback_messages
             WHERE created_at < $1
             ORDER BY created_at DESC
             LIMIT $2`,
            [before, limit],
          )
        : await pool.query<MessageRow>(
            `SELECT id, user_id, author_name, message, created_at
             FROM alpha_feedback_messages
             ORDER BY created_at DESC
             LIMIT $1`,
            [limit],
          );

      const messages = rows.map(toMessage).reverse();
      return { messages } satisfies AlphaFeedbackMessagesResponse;
    },
  );

  app.post(
    "/api/feedback/messages",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { userId, userEmail } = request as AuthedRequest;
      const body = request.body as { message?: string };
      const message = body.message?.trim() ?? "";

      if (!message) {
        return reply.code(400).send({ error: "Message is required" });
      }
      if (message.length > MAX_MESSAGE_LENGTH) {
        return reply.code(400).send({
          error: `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer`,
        });
      }

      const authorName = await resolveAuthorName(userId, userEmail);
      const { rows } = await pool.query<MessageRow>(
        `INSERT INTO alpha_feedback_messages (user_id, author_name, message)
         VALUES ($1, $2, $3)
         RETURNING id, user_id, author_name, message, created_at`,
        [userId, authorName, message],
      );

      return toMessage(rows[0]!);
    },
  );
}
