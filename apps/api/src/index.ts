import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import multipart from "@fastify/multipart";
import { assertRuntimeConfig, config } from "./config.js";
import { runMigrations, pool } from "./db.js";
import { pruneStaleRateLimitRows } from "./services/uploadRateLimit.js";
import { fastifyServerOptions, registerRequestLogging } from "./logger.js";
import { MealGuardrailError } from "./services/mealGuardrails.js";
import { RateLimitError } from "./services/uploadRateLimit.js";
import { FreeTierError } from "./services/freeTier.js";
import { mealRoutes } from "./routes/meals.js";
import { insightRoutes } from "./routes/insights.js";
import { nutritionRoutes } from "./routes/nutrition.js";
import { userRoutes } from "./routes/users.js";
import { feedbackRoutes } from "./routes/feedback.js";
import { friendRoutes } from "./routes/friends.js";
import { gamificationRoutes } from "./routes/gamification.js";
import { mealShareRoutes } from "./routes/mealShares.js";
import { subscriptionRoutes } from "./routes/subscription.js";

assertRuntimeConfig();

const app = Fastify({
  ...fastifyServerOptions(),
  trustProxy: true,
});

registerRequestLogging(app);

app.setErrorHandler((err, request, reply) => {
  if (err instanceof MealGuardrailError || err instanceof RateLimitError || err instanceof FreeTierError) {
    request.log.warn({ err, code: err.code }, "request rejected");
    return reply.status(err.status).send({ error: err.message, code: err.code });
  }

  request.log.error({ err }, "unhandled error");
  const status =
    typeof err === "object" &&
    err !== null &&
    "statusCode" in err &&
    typeof (err as { statusCode?: unknown }).statusCode === "number"
      ? (err as { statusCode: number }).statusCode
      : 500;
  const message =
    status >= 500
      ? "Internal server error"
      : err instanceof Error
        ? err.message
        : "Request failed";
  return reply.status(status).send({ error: message });
});

await app.register(helmet);
await app.register(rateLimit, { max: 120, timeWindow: "1 minute" });
await app.register(cors, { origin: config.corsOrigin });
await app.register(multipart, {
  limits: { fileSize: 25 * 1024 * 1024 },
});

if (config.runMigrations) {
  try {
    await runMigrations();
    await pruneStaleRateLimitRows();
    app.log.info("Database migrations applied");
  } catch (err) {
    app.log.error(
      { err },
      "Database migration failed — refusing to start (check DATABASE_URL uses Supabase session or direct connection, not transaction pooler)",
    );
    process.exit(1);
  }
}

app.get("/health", async (_request, reply) => {
  try {
    await pool.query("SELECT 1");
    return { ok: true };
  } catch (err) {
    app.log.error({ err }, "health check failed");
    return reply.code(503).send({ ok: false, error: "database unavailable" });
  }
});

await app.register(mealRoutes);
await app.register(insightRoutes);
await app.register(nutritionRoutes);
await app.register(userRoutes);
await app.register(feedbackRoutes);
await app.register(friendRoutes);
await app.register(gamificationRoutes);
await app.register(mealShareRoutes);
await app.register(subscriptionRoutes);

async function shutdown(signal: string) {
  app.log.info({ signal }, "shutting down");
  try {
    await app.close();
    await pool.end();
    process.exit(0);
  } catch (err) {
    app.log.error({ err }, "shutdown error");
    process.exit(1);
  }
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

await app.listen({ port: config.port, host: "0.0.0.0" });
app.log.info({ port: config.port }, "API listening");
