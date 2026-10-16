import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { DatabaseService } from "../database/database.service";
import { AuditService } from "../audit/audit.service";
import { AuthService, Role } from "./auth.service";
import { ensureDefaultTkFramework } from "../assessment/ensure-default-tk-framework";
import {
  rateLimitFingerprint,
  RequestRateLimiter,
} from "../common/request-rate-limiter";

const fifteenMinutes = 15 * 60_000;
const oneHour = 60 * 60_000;

const registrationSchema = z.object({
  name: z.string().min(2).max(120),
  schoolName: z.string().min(2).max(160),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
const profileSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    phone: z.string().trim().max(40).optional(),
    password: z.string().min(8).max(128).optional(),
    currentPassword: z.string().min(1).max(128).optional(),
    passwordConfirmation: z.string().min(8).max(128).optional(),
  })
  .superRefine((input, context) => {
    if (!input.password) return;
    if (!input.currentPassword) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["currentPassword"],
        message: "Kata sandi saat ini wajib diisi.",
      });
    }
    if (input.passwordConfirmation !== input.password) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["passwordConfirmation"],
        message: "Konfirmasi kata sandi baru tidak sama.",
      });
    }
  });

@Controller("auth")
export class AuthController {
  constructor(
    private readonly db: DatabaseService,
    private readonly auth: AuthService,
    private readonly audit: AuditService,
    private readonly rateLimiter = new RequestRateLimiter(),
  ) {}

  @Post("register-school")
  async register(
    @Body() body: unknown,
    @Res({ passthrough: true }) reply: FastifyReply,
    @Req() request: FastifyRequest = {} as FastifyRequest,
  ) {
    const input = registrationSchema.parse(body);
    this.rateLimiter.assert({
      key: `register:${rateLimitFingerprint(request.ip ?? "unknown")}`,
      limit: 10,
      windowMs: oneHour,
    });
    const existing = await this.db.query(
      "SELECT 1 FROM users WHERE lower(email) = lower($1)",
      [input.email],
    );
    if (existing.rowCount)
      throw new ConflictException("Email sudah digunakan sebagai akun sekolah.");
    const passwordHash = await this.auth.hashPassword(input.password);
    const schoolId = crypto.randomUUID();
    const created = await this.db.transaction(async (client) => {
      const user = await client.query<{ id: string }>(
        "INSERT INTO users (name, email, password_hash) VALUES ($1, lower($2), $3) RETURNING id",
        [input.name, input.email, passwordHash],
      );
      await client.query(
        "INSERT INTO schools (id, name, slug) VALUES ($1, $2, lower(regexp_replace($2, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring($1::text, 1, 8))",
        [schoolId, input.schoolName],
      );
      await client.query(
        "INSERT INTO school_memberships (user_id, school_id, role) VALUES ($1, $2, 'SCHOOL_ADMIN')",
        [user.rows[0].id, schoolId],
      );
      await ensureDefaultTkFramework(client, schoolId);
      await client.query(
        "INSERT INTO audit_logs (school_id, actor_user_id, action, entity_type, entity_id) VALUES ($1, $2, 'school.registered', 'school', $1)",
        [schoolId, user.rows[0].id],
      );
      return { userId: user.rows[0].id, schoolId };
    }, schoolId);
    await this.auth.createSession(created.userId, created.schoolId, reply);
    return { schoolId: created.schoolId, role: "SCHOOL_ADMIN" };
  }

  @Post("login")
  @HttpCode(200)
  async login(
    @Body() body: unknown,
    @Res({ passthrough: true }) reply: FastifyReply,
    @Req() request: FastifyRequest = {} as FastifyRequest,
  ) {
    const input = loginSchema.parse(body);
    const ip = rateLimitFingerprint(request.ip ?? "unknown");
    const email = rateLimitFingerprint(input.email.trim().toLowerCase());
    this.rateLimiter.assert({
      key: `login:ip:${ip}`,
      limit: 80,
      windowMs: fifteenMinutes,
    });
    this.rateLimiter.assert({
      key: `login:identity:${ip}:${email}`,
      limit: 15,
      windowMs: fifteenMinutes,
    });
    const account = await this.db.query<{ id: string; password_hash: string }>(
      "SELECT id, password_hash FROM users WHERE lower(email)=lower($1)",
      [input.email],
    );
    const user = account.rows[0];
    if (
      !user ||
      !(await this.auth.verifyPassword(user.password_hash, input.password))
    ) {
      throw new UnauthorizedException("Email atau kata sandi salah");
    }
    const memberships = await this.db.transaction(async (client) => {
      await client.query("SELECT set_config('app.user_id', $1, true)", [
        user.id,
      ]);
      return (
        await client.query<{ school_id: string; role: Role }>(
          "SELECT school_id, role FROM school_memberships WHERE user_id=$1 AND is_active",
          [user.id],
        )
      ).rows;
    });
    if (!memberships.length)
      throw new UnauthorizedException("Email atau kata sandi salah");
    if (memberships.length > 1) {
      throw new UnauthorizedException("Email atau kata sandi salah");
    }
    const membership = memberships[0];
    await this.auth.createSession(user.id, membership.school_id, reply);
    return { schoolId: membership.school_id, role: membership.role };
  }

  @Post("logout")
  @HttpCode(204)
  async logout(
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    await this.auth.logout(request, reply);
  }

  @Get("session")
  session(@Req() request: FastifyRequest) {
    const auth = this.auth.require(request);
    return {
      userId: auth.userId,
      schoolId: auth.schoolId,
      role: auth.role,
      email: auth.email,
    };
  }

  @Get("profile")
  async profile(@Req() request: FastifyRequest) {
    const actor = this.auth.require(request);
    return (
      await this.db.query("SELECT id,name,email,phone FROM users WHERE id=$1", [
        actor.userId,
      ])
    ).rows[0];
  }

  @Patch("profile")
  async updateProfile(@Req() request: FastifyRequest, @Body() body: unknown) {
    const actor = this.auth.require(request);
    const input = profileSchema.parse(body);
    return this.db.transaction(async (client) => {
      let passwordHash: string | null = null;

      if (input.password) {
        const user = (
          await client.query<{ password_hash: string }>(
            "SELECT password_hash FROM users WHERE id=$1",
            [actor.userId],
          )
        ).rows[0];
        if (
          !user ||
          !(await this.auth.verifyPassword(
            user.password_hash,
            input.currentPassword!,
          ))
        ) {
          throw new BadRequestException("Kata sandi saat ini tidak sesuai.");
        }
        passwordHash = await this.auth.hashPassword(input.password);
      }

      const updated = (
        await client.query(
          "UPDATE users SET name=$2,phone=$3,password_hash=COALESCE($4,password_hash),updated_at=now() WHERE id=$1 RETURNING id,name,email,phone",
          [actor.userId, input.name, input.phone || null, passwordHash],
        )
      ).rows[0];
      if (input.password) {
        await this.audit.record(
          {
            schoolId: actor.schoolId,
            actorUserId: actor.userId,
            action: "auth.password_changed",
            entityType: "user",
            entityId: actor.userId,
          },
          client,
        );
      }
      return updated;
    }, actor.schoolId);
  }
}
