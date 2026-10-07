import { Body, Controller, Get, HttpCode, Post, Req, Res } from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { DatabaseService } from "../database/database.service";
import { AuthService } from "./auth.service";

const registrationSchema = z.object({
  name: z.string().min(2).max(120), schoolName: z.string().min(2).max(160), email: z.string().email(), password: z.string().min(8).max(128),
});
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

@Controller("auth")
export class AuthController {
  constructor(private readonly db: DatabaseService, private readonly auth: AuthService) {}

  @Post("register-school")
  async register(@Body() body: unknown, @Res({ passthrough: true }) reply: FastifyReply) {
    const input = registrationSchema.parse(body);
    const existing = await this.db.query("SELECT 1 FROM users WHERE lower(email) = lower($1)", [input.email]);
    if (existing.rowCount) return { message: "Email sudah digunakan" };
    const passwordHash = await this.auth.hashPassword(input.password);
    const schoolId = crypto.randomUUID();
    const created = await this.db.transaction(async (client) => {
      const user = await client.query<{ id: string }>("INSERT INTO users (name, email, password_hash) VALUES ($1, lower($2), $3) RETURNING id", [input.name, input.email, passwordHash]);
      await client.query("INSERT INTO schools (id, name, slug) VALUES ($1, $2, lower(regexp_replace($2, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring($1::text, 1, 8))", [schoolId, input.schoolName]);
      await client.query("INSERT INTO school_memberships (user_id, school_id, role) VALUES ($1, $2, 'SCHOOL_ADMIN')", [user.rows[0].id, schoolId]);
      await client.query("INSERT INTO audit_logs (school_id, actor_user_id, action, entity_type, entity_id) VALUES ($1, $2, 'school.registered', 'school', $1)", [schoolId, user.rows[0].id]);
      return { userId: user.rows[0].id, schoolId };
    }, schoolId);
    await this.auth.createSession(created.userId, created.schoolId, reply);
    return { schoolId: created.schoolId, role: "SCHOOL_ADMIN" };
  }

  @Post("login")
  @HttpCode(200)
  async login(@Body() body: unknown, @Res({ passthrough: true }) reply: FastifyReply) {
    const input = loginSchema.parse(body);
    const account = await this.db.query<{ id: string; password_hash: string }>("SELECT id, password_hash FROM users WHERE lower(email)=lower($1)", [input.email]);
    const user = account.rows[0];
    if (!user || !(await this.auth.verifyPassword(user.password_hash, input.password))) return { message: "Email atau kata sandi salah" };
    const membership = await this.db.transaction(async (client) => {
      await client.query("SELECT set_config('app.user_id', $1, true)", [user.id]);
      return (await client.query<{ school_id: string; role: string }>("SELECT school_id, role FROM school_memberships WHERE user_id=$1 AND is_active ORDER BY created_at LIMIT 1", [user.id])).rows[0];
    });
    if (!membership) return { message: "Akun tidak memiliki akses sekolah" };
    await this.auth.createSession(user.id, membership.school_id, reply);
    return { schoolId: membership.school_id, role: membership.role };
  }

  @Post("logout")
  @HttpCode(204)
  async logout(@Req() request: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) { await this.auth.logout(request, reply); }

  @Get("session")
  session(@Req() request: FastifyRequest) {
    const auth = this.auth.require(request);
    return { userId: auth.userId, schoolId: auth.schoolId, role: auth.role, email: auth.email };
  }
}
