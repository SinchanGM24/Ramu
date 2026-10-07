import { Injectable, UnauthorizedException } from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";
import * as argon2 from "argon2";
import { createHash, randomBytes } from "crypto";
import { DatabaseService } from "../database/database.service";

export type Role = "SUPER_ADMIN" | "SCHOOL_ADMIN" | "TEACHER" | "PRINCIPAL";
export type AuthContext = { userId: string; schoolId: string; role: Role; email: string; sessionId: string };

const cookieName = () => process.env.SESSION_COOKIE_NAME || "ramu_session";
const hashToken = (value: string) => createHash("sha256").update(value).digest("hex");

@Injectable()
export class AuthService {
  constructor(private readonly db: DatabaseService) {}

  async hashPassword(password: string) { return argon2.hash(password); }
  async verifyPassword(hash: string, password: string) { return argon2.verify(hash, password); }

  async createSession(userId: string, schoolId: string, reply: FastifyReply) {
    const rawToken = randomBytes(32).toString("base64url");
    const days = Number(process.env.SESSION_TTL_DAYS || 7);
    const expiresAt = new Date(Date.now() + days * 86_400_000);
    await this.db.query(
      "INSERT INTO sessions (user_id, school_id, token_hash, expires_at) VALUES ($1, $2, $3, $4)",
      [userId, schoolId, hashToken(rawToken), expiresAt],
    );
    reply.setCookie(cookieName(), rawToken, {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires: expiresAt,
    });
  }

  async attach(request: FastifyRequest) {
    const rawToken = request.cookies?.[cookieName()];
    if (!rawToken) return;
    const session = await this.db.query<{ user_id: string; school_id: string; session_id: string; email: string }>(
      `SELECT s.user_id, s.school_id, s.id AS session_id, u.email FROM sessions s JOIN users u ON u.id=s.user_id
       WHERE s.token_hash=$1 AND s.expires_at > now() AND s.revoked_at IS NULL`, [hashToken(rawToken)]);
    const row = session.rows[0];
    if (!row) return;
    await this.db.transaction(async (client) => {
      const membership = await client.query<{ role: Role }>("SELECT role FROM school_memberships WHERE user_id=$1 AND school_id=$2", [row.user_id, row.school_id]);
      if (membership.rows[0]) request.auth = { userId: row.user_id, schoolId: row.school_id, role: membership.rows[0].role, email: row.email, sessionId: row.session_id };
    }, row.school_id);
  }

  require(request: FastifyRequest, roles?: Role[]): AuthContext {
    if (!request.auth || (roles && !roles.includes(request.auth.role))) throw new UnauthorizedException("Sesi atau akses tidak valid");
    return request.auth;
  }

  async logout(request: FastifyRequest, reply: FastifyReply) {
    const rawToken = request.cookies?.[cookieName()];
    if (rawToken) await this.db.query("UPDATE sessions SET revoked_at = now() WHERE token_hash = $1", [hashToken(rawToken)]);
    reply.clearCookie(cookieName(), { path: "/" });
  }
}
