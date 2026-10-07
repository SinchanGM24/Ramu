import type { AuthContext } from "../auth/auth.service";

declare module "fastify" {
  interface FastifyRequest {
    auth?: AuthContext;
  }
}
