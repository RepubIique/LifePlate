import type { FastifyInstance, FastifyServerOptions } from "fastify";

const QUIET_PATHS = new Set(["/health"]);

export function shouldLogRequest(url: string, method: string): boolean {
  const path = url.split("?")[0] ?? url;
  if (QUIET_PATHS.has(path)) return false;
  if (method === "OPTIONS") return false;
  return true;
}

export function requestLogLevel(statusCode: number): "error" | "warn" | null {
  if (statusCode >= 500) return "error";
  if (statusCode >= 400) return "warn";
  return null;
}

export function fastifyServerOptions(): FastifyServerOptions {
  return {
    logger: {
      level: process.env.LOG_LEVEL ?? "info",
    },
    disableRequestLogging: true,
    bodyLimit: 25 * 1024 * 1024,
  };
}

export function registerRequestLogging(app: FastifyInstance) {
  app.addHook("onResponse", async (request, reply) => {
    if (!shouldLogRequest(request.url, request.method)) return;

    const payload = {
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      responseTimeMs: Math.round(reply.elapsedTime),
    };

    const level = requestLogLevel(reply.statusCode);
    if (!level) return;

    if (level === "error") {
      request.log.error(payload, "request failed");
      return;
    }
    request.log.warn(payload, "request");
  });
}
