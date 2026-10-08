import "reflect-metadata";
import "dotenv/config";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import { AppModule } from "./app.module";
import { AuthService } from "./auth/auth.service";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter({ logger: process.env.NODE_ENV === "production" }));
  await app.register(cookie);
  await app.register(multipart, { limits: { fileSize: 5 * 1024 * 1024, files: 1 } });
  await app.register(cors, { origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000", credentials: true, methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"] });
  app.setGlobalPrefix("api");
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.getHttpAdapter().getInstance().addHook("onSend", async (_request: unknown, reply: import("fastify").FastifyReply) => {
    reply.header("X-Content-Type-Options", "nosniff");
    reply.header("X-Frame-Options", "DENY");
    reply.header("Referrer-Policy", "strict-origin-when-cross-origin");
    reply.header("Content-Security-Policy", "default-src 'self'; frame-ancestors 'none'; base-uri 'self'");
  });
  const auth = app.get(AuthService);
  app.getHttpAdapter().getInstance().addHook("preHandler", async (request: import("fastify").FastifyRequest) => auth.attach(request));
  await app.listen(Number(process.env.PORT || 4000), "0.0.0.0");
}
bootstrap();
