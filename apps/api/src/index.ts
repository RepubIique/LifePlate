import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import { assertRuntimeConfig, config } from "./config.js";
import { runMigrations } from "./db.js";
import { mealRoutes } from "./routes/meals.js";
import { insightRoutes } from "./routes/insights.js";
import { userRoutes } from "./routes/users.js";

assertRuntimeConfig();

const app = Fastify({
  logger: true,
  bodyLimit: 25 * 1024 * 1024,
});

await app.register(cors, { origin: config.corsOrigin });
await app.register(multipart, {
  limits: { fileSize: 25 * 1024 * 1024 },
});

app.get("/health", async () => ({ ok: true }));

await app.register(mealRoutes);
await app.register(insightRoutes);
await app.register(userRoutes);

try {
  await runMigrations();
} catch (err) {
  app.log.error({ err }, "Database migration failed — profile and meal fields may not persist");
}

await app.listen({ port: config.port, host: "0.0.0.0" });
console.log(`API listening on http://localhost:${config.port}`);
