import type { AuthContext, PlatformAuthContext } from "../auth/auth.service";

declare module "fastify" {
  interface FastifyRequest {
    auth?: AuthContext;
    platformAuth?: PlatformAuthContext;
  }
}
