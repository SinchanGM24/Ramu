import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import { randomUUID } from "crypto";
import { AppModule } from "../app.module";
import { AuthService } from "../auth/auth.service";
import { ApiExceptionFilter } from "../common/api-exception.filter";
import {
  getTrustedOrigins,
  validateCookieMutationOrigin,
} from "../common/origin-policy";

export async function createHttpApplication() {
  const trustedOrigins = getTrustedOrigins();
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: process.env.NODE_ENV === "production",
      trustProxy: process.env.TRUST_PROXY === "true",
    }),
  );
  await app.register(cookie);
  await app.register(multipart, {
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  });
  await app.register(cors, {
    origin: trustedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });
  app.setGlobalPrefix("api");
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new ApiExceptionFilter());

  const fastify = app.getHttpAdapter().getInstance();
  fastify.addHook("onRequest", async (request, reply) => {
    const suppliedId = request.headers["x-correlation-id"];
    const correlationId =
      typeof suppliedId === "string" &&
      /^[a-zA-Z0-9_-]{8,128}$/.test(suppliedId)
        ? suppliedId
        : randomUUID();
    request.headers["x-correlation-id"] = correlationId;
    reply.header("X-Correlation-Id", correlationId);
  });
  fastify.addHook("onRequest", async (request, reply) => {
    const message = validateCookieMutationOrigin({
      method: request.method,
      cookies: request.cookies,
      origin: request.headers.origin,
      referer: request.headers.referer,
      trustedOrigins,
    });
    if (!message) return;
    return reply
      .status(403)
      .send({
        statusCode: 403,
        message,
        error: "Forbidden",
        correlationId: request.headers["x-correlation-id"],
      });
  });
  fastify.addHook("onSend", async (_request, reply) => {
    reply.header("X-Content-Type-Options", "nosniff");
    reply.header("X-Frame-Options", "DENY");
    reply.header("Referrer-Policy", "strict-origin-when-cross-origin");
    reply.header(
      "Content-Security-Policy",
      "default-src 'self'; frame-ancestors 'none'; base-uri 'self'",
    );
  });

  const auth = app.get(AuthService);
  fastify.addHook("preHandler", async (request) => auth.attach(request));
  fastify.addHook("preHandler", async (request) =>
    auth.attachPlatform(request),
  );
  fastify.addHook("preHandler", async (request, reply) => {
    if (!request.auth?.mustChangePassword) return;
    const allowed = new Set([
      "/api/auth/session",
      "/api/auth/profile",
      "/api/auth/logout",
    ]);
    if (allowed.has(request.url.split("?")[0])) return;
    return reply
      .status(403)
      .send({
        statusCode: 403,
        message: "Ganti kata sandi sementara Anda sebelum melanjutkan.",
        error: "Forbidden",
        correlationId: request.headers["x-correlation-id"],
      });
  });
  await app.init();
  return app;
}
