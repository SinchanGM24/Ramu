import { Injectable, UnauthorizedException } from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";
import * as argon2 from "argon2";
import { createHash, randomBytes } from "crypto";
import { DatabaseService } from "../database/database.service";
import type { PoolClient } from "pg";

export type Role = "SUPER_ADMIN" | "SCHOOL_ADMIN" | "TEACHER" | "PRINCIPAL";
export type AuthContext = {
  userId: string;
  schoolId: string;
  role: Role;
  email: string;
  sessionId: string;
  mustChangePassword: boolean;
};
export type PlatformAuthContext = {
  userId: string;
  email: string;
  sessionId: string;
  mustChangePassword: boolean;
};

const cookieName = () => process.env.SESSION_COOKIE_NAME || "ramu_session";
const platformCookieName = () =>
  process.env.PLATFORM_SESSION_COOKIE_NAME || "ramu_platform_session";
const hashToken = (value: string) =>
  createHash("sha256").update(value).digest("hex");
type QueryClient = Pick<PoolClient, "query">;

@Injectable()
export class AuthService {
  constructor(private readonly db: DatabaseService) {}

  async hashPassword(password: string) {
    return argon2.hash(password);
  }
  async verifyPassword(hash: string, password: string) {
    return argon2.verify(hash, password);
  }

  async createSession(userId: string, schoolId: string, reply: FastifyReply) {
    return this.createSessionWithClient(userId, schoolId, reply);
  }

  async createSessionWithClient(
    userId: string,
    schoolId: string,
    reply: FastifyReply,
    client?: QueryClient,
  ) {
    const rawToken = randomBytes(32).toString("base64url");
    const days = Number(process.env.SESSION_TTL_DAYS || 7);
    const expiresAt = new Date(Date.now() + days * 86_400_000);
    const query = client
      ? client.query.bind(client)
      : this.db.query.bind(this.db);
    await query(
      "INSERT INTO sessions (user_id, school_id, token_hash, expires_at) VALUES ($1, $2, $3, $4)",
      [userId, schoolId, hashToken(rawToken), expiresAt],
    );
    reply.setCookie(cookieName(), rawToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });
  }

  async createPlatformSession(
    userId: string,
    reply: FastifyReply,
    client?: QueryClient,
  ) {
    const rawToken = randomBytes(32).toString("base64url");
    const days = Number(process.env.SESSION_TTL_DAYS || 7);
    const expiresAt = new Date(Date.now() + days * 86_400_000);
    const query = client
      ? client.query.bind(client)
      : this.db.query.bind(this.db);
    await query(
      "INSERT INTO platform_sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
      [userId, hashToken(rawToken), expiresAt],
    );
    reply.setCookie(platformCookieName(), rawToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });
  }

  async revokeAllUserSessions(userId: string, client?: QueryClient) {
    const query = client
      ? client.query.bind(client)
      : this.db.query.bind(this.db);
    await query(
      "UPDATE sessions SET revoked_at=now() WHERE user_id=$1 AND revoked_at IS NULL",
      [userId],
    );
  }

  async revokeAllPlatformSessions(userId: string, client?: QueryClient) {
    const query = client
      ? client.query.bind(client)
      : this.db.query.bind(this.db);
    await query(
      "UPDATE platform_sessions SET revoked_at=now() WHERE user_id=$1 AND revoked_at IS NULL",
      [userId],
    );
  }

  async attach(request: FastifyRequest) {
    const rawToken = request.cookies?.[cookieName()];
    if (!rawToken) return;
    const session = await this.db.query<{
      user_id: string;
      school_id: string;
      session_id: string;
      email: string;
      must_change_password: boolean;
    }>(
      `SELECT s.user_id, s.school_id, s.id AS session_id, u.email, u.must_change_password
       FROM sessions s
       JOIN users u ON u.id=s.user_id AND u.is_active
       WHERE s.token_hash=$1 AND s.expires_at > now() AND s.revoked_at IS NULL`,
      [hashToken(rawToken)],
    );
    const row = session.rows[0];
    if (!row) return;
    await this.db.transaction(async (client) => {
      // `schools` is RLS-protected. Read it only after DatabaseService has
      // established the session's school context for this transaction.
      const school = await client.query<{ id: string }>(
        "SELECT id FROM schools WHERE id=$1 AND tenant_status='ACTIVE'",
        [row.school_id],
      );
      if (!school.rows[0]) return;
      const membership = await client.query<{ role: Role }>(
        "SELECT role FROM school_memberships WHERE user_id=$1 AND school_id=$2 AND is_active",
        [row.user_id, row.school_id],
      );
      if (membership.rows[0])
        request.auth = {
          userId: row.user_id,
          schoolId: row.school_id,
          role: membership.rows[0].role,
          email: row.email,
          sessionId: row.session_id,
          mustChangePassword: row.must_change_password,
        };
    }, row.school_id);
  }

  async attachPlatform(request: FastifyRequest) {
    const rawToken = request.cookies?.[platformCookieName()];
    if (!rawToken) return;
    const session = await this.db.query<{
      user_id: string;
      session_id: string;
      email: string;
      must_change_password: boolean;
    }>(
      `SELECT session.user_id, session.id AS session_id, account.email,
              account.must_change_password
       FROM platform_sessions session
       JOIN platform_administrators administrator ON administrator.user_id=session.user_id
       JOIN users account ON account.id=session.user_id AND account.is_active
       WHERE session.token_hash=$1 AND session.expires_at > now() AND session.revoked_at IS NULL`,
      [hashToken(rawToken)],
    );
    const row = session.rows[0];
    if (!row) return;
    request.platformAuth = {
      userId: row.user_id,
      email: row.email,
      sessionId: row.session_id,
      mustChangePassword: row.must_change_password,
    };
  }

  require(request: FastifyRequest, roles?: Role[]): AuthContext {
    if (!request.auth || (roles && !roles.includes(request.auth.role)))
      throw new UnauthorizedException("Sesi atau akses tidak valid");
    return request.auth;
  }

  requirePlatform(request: FastifyRequest): PlatformAuthContext {
    if (!request.platformAuth)
      throw new UnauthorizedException("Sesi platform tidak valid");
    return request.platformAuth;
  }

  async logout(request: FastifyRequest, reply: FastifyReply) {
    const rawToken = request.cookies?.[cookieName()];
    if (rawToken)
      await this.db.query(
        "UPDATE sessions SET revoked_at = now() WHERE token_hash = $1",
        [hashToken(rawToken)],
      );
    reply.clearCookie(cookieName(), { path: "/" });
  }

  async logoutPlatform(request: FastifyRequest, reply: FastifyReply) {
    const rawToken = request.cookies?.[platformCookieName()];
    if (rawToken)
      await this.db.query(
        "UPDATE platform_sessions SET revoked_at = now() WHERE token_hash = $1",
        [hashToken(rawToken)],
      );
    reply.clearCookie(platformCookieName(), { path: "/" });
  }
}
