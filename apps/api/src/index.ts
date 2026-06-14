import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import { assertRuntimeConfig, config } from "./config.js";
import { runMigrations, pool } from "./db.js";
import { backfillAllUserMealStats } from "./services/userMealStats.js";
import { fastifyServerOptions, registerRequestLogging } from "./logger.js";
import { mealRoutes } from "./routes/meals.js";
import { insightRoutes } from "./routes/insights.js";
import { nutritionRoutes } from "./routes/nutrition.js";
import { userRoutes } from "./routes/users.js";
import { feedbackRoutes } from "./routes/feedback.js";

assertRuntimeConfig();

const app = Fastify(fastifyServerOptions());

registerRequestLogging(app);

await app.register(cors, { origin: config.corsOrigin });
await app.register(multipart, {
  limits: { fileSize: 25 * 1024 * 1024 },
});

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

try {
  await runMigrations();
  await backfillAllUserMealStats();
  app.log.info("Database migrations applied");
} catch (err) {
  app.log.error(
    { err },
    "Database migration failed — refusing to start (check DATABASE_URL uses Supabase session or direct connection, not transaction pooler)",
  );
  process.exit(1);
}

await app.listen({ port: config.port, host: "0.0.0.0" });
app.log.info({ port: config.port }, "API listening");
