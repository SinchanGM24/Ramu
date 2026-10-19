import {
  Body,
  ConflictException,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { ensureDefaultTkFramework } from "../assessment/ensure-default-tk-framework";
import { AuthService } from "../auth/auth.service";
import { DatabaseService } from "../database/database.service";
import {
  rateLimitFingerprint,
  RequestRateLimiter,
} from "../common/request-rate-limiter";

const pageSize = 15;
const loginWindowMs = 15 * 60_000;

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
const createTenantSchema = z.object({
  schoolName: z.string().trim().min(2).max(160),
  address: z.string().trim().max(1_000).optional(),
  phone: z.string().trim().max(40).optional(),
  adminName: z.string().trim().min(2).max(120),
  adminEmail: z.string().trim().email().max(320),
});
const pagingSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  query: z.string().trim().max(160).optional().default(""),
  status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
  schoolId: z.string().uuid().optional(),
  role: z.enum(["SCHOOL_ADMIN", "TEACHER", "PRINCIPAL"]).optional(),
});

const temporaryPassword = () => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const values = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(values, (value) => alphabet[value % alphabet.length]).join(
    "",
  );
};

@Controller("platform")
export class PlatformController {
  constructor(
    private readonly db: DatabaseService,
    private readonly auth: AuthService,
    private readonly rateLimiter: RequestRateLimiter = new RequestRateLimiter(),
  ) {}

  @Post("auth/login")
  @HttpCode(200)
  async login(
    @Body() body: unknown,
    @Res({ passthrough: true }) reply: FastifyReply,
    @Req() request: FastifyRequest = {} as FastifyRequest,
  ) {
    const input = loginSchema.parse(body);
    const fingerprint = rateLimitFingerprint(request.ip ?? "unknown");
    await this.rateLimiter.assert({
      key: `platform-login:${fingerprint}`,
      limit: 10,
      windowMs: loginWindowMs,
    });
    const account = await this.db.query<{
      id: string;
      password_hash: string;
      is_active: boolean;
    }>(
      `SELECT account.id, account.password_hash, account.is_active
       FROM users account
       JOIN platform_administrators administrator ON administrator.user_id=account.id
       WHERE lower(account.email)=lower($1)`,
      [input.email],
    );
    const user = account.rows[0];
    if (
      !user ||
      !user.is_active ||
      !(await this.auth.verifyPassword(user.password_hash, input.password))
    )
      throw new UnauthorizedException("Email atau kata sandi platform salah");
    await this.auth.createPlatformSession(user.id, reply);
    return { ok: true };
  }

  @Post("auth/logout")
  @HttpCode(204)
  async logout(
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    await this.auth.logoutPlatform(request, reply);
  }

  @Get("auth/session")
  session(@Req() request: FastifyRequest) {
    const actor = this.auth.requirePlatform(request);
    return {
      userId: actor.userId,
      email: actor.email,
      role: "SUPER_ADMIN" as const,
    };
  }

  @Get("overview")
  async overview(@Req() request: FastifyRequest) {
    const actor = this.auth.requirePlatform(request);
    const result = await this.db.query<{ overview: unknown }>(
      "SELECT platform_overview($1) AS overview",
      [actor.userId],
    );
    return result.rows[0]?.overview;
  }

  @Get("tenants")
  async tenants(@Req() request: FastifyRequest, @Query() query: unknown) {
    const actor = this.auth.requirePlatform(request);
    const input = pagingSchema.parse(query);
    const rows = await this.db.query<PlatformTenantRow>(
      "SELECT * FROM platform_list_tenants($1,$2,$3,$4,$5)",
      [
        actor.userId,
        input.query,
        input.status ?? "",
        pageSize,
        (input.page - 1) * pageSize,
      ],
    );
    return paginated(rows.rows, input.page);
  }

  @Get("tenants/:id")
  async tenant(@Req() request: FastifyRequest, @Param("id") id: string) {
    const actor = this.auth.requirePlatform(request);
    const parsedId = z.string().uuid().parse(id);
    const result = await this.db.query<{ tenant: unknown }>(
      "SELECT platform_tenant_detail($1,$2) AS tenant",
      [actor.userId, parsedId],
    );
    if (!result.rows[0]?.tenant)
      throw new NotFoundException("Tenant tidak ditemukan");
    return result.rows[0].tenant;
  }

  @Post("tenants")
  async createTenant(@Req() request: FastifyRequest, @Body() body: unknown) {
    const actor = this.auth.requirePlatform(request);
    const input = createTenantSchema.parse(body);
    const password = temporaryPassword();
    const passwordHash = await this.auth.hashPassword(password);
    try {
      return await this.db.transaction(async (client) => {
        const created = await client.query<{
          school_id: string;
          admin_user_id: string;
        }>("SELECT * FROM platform_create_tenant($1,$2,$3,$4,$5,$6,$7)", [
          actor.userId,
          input.schoolName,
          input.adminName,
          input.adminEmail,
          passwordHash,
          input.address ?? "",
          input.phone ?? "",
        ]);
        const tenant = created.rows[0];
        if (!tenant) throw new Error("Tenant tidak dapat dibuat");
        await client.query("SELECT set_config('app.school_id', $1, true)", [
          tenant.school_id,
        ]);
        await ensureDefaultTkFramework(client, tenant.school_id);
        return {
          schoolId: tenant.school_id,
          adminUserId: tenant.admin_user_id,
          temporaryPassword: password,
        };
      });
    } catch (error) {
      if (error instanceof Error && /Email sudah digunakan/.test(error.message))
        throw new ConflictException("Email sudah digunakan oleh akun lain");
      throw error;
    }
  }

  @Patch("tenants/:id/status")
  @HttpCode(204)
  async tenantStatus(
    @Req() request: FastifyRequest,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    const actor = this.auth.requirePlatform(request);
    const input = z
      .object({ status: z.enum(["ACTIVE", "SUSPENDED"]) })
      .parse(body);
    await this.db.query("SELECT platform_set_tenant_status($1,$2,$3)", [
      actor.userId,
      z.string().uuid().parse(id),
      input.status,
    ]);
  }

  @Get("accounts")
  async accounts(@Req() request: FastifyRequest, @Query() query: unknown) {
    const actor = this.auth.requirePlatform(request);
    const input = pagingSchema.parse(query);
    const rows = await this.db.query<PlatformAccountRow>(
      "SELECT * FROM platform_list_accounts($1,$2,$3,$4,$5,$6,$7)",
      [
        actor.userId,
        input.query,
        input.status ?? "",
        input.schoolId ?? null,
        input.role ?? "",
        pageSize,
        (input.page - 1) * pageSize,
      ],
    );
    return paginated(rows.rows, input.page);
  }

  @Patch("accounts/:id/status")
  @HttpCode(204)
  async accountStatus(
    @Req() request: FastifyRequest,
    @Param("id") id: string,
    @Body() body: unknown,
  ) {
    const actor = this.auth.requirePlatform(request);
    const input = z.object({ isActive: z.boolean() }).parse(body);
    await this.db.query("SELECT platform_set_account_status($1,$2,$3)", [
      actor.userId,
      z.string().uuid().parse(id),
      input.isActive,
    ]);
  }

  @Post("accounts/:id/revoke-sessions")
  @HttpCode(204)
  async revokeSessions(
    @Req() request: FastifyRequest,
    @Param("id") id: string,
  ) {
    const actor = this.auth.requirePlatform(request);
    await this.db.query("SELECT platform_revoke_account_sessions($1,$2)", [
      actor.userId,
      z.string().uuid().parse(id),
    ]);
  }
}

type PlatformTenantRow = {
  id: string;
  name: string;
  slug: string;
  tenant_status: "ACTIVE" | "SUSPENDED";
  created_at: string;
  admin_name: string | null;
  admin_email: string | null;
  student_count: number;
  account_count: number;
  subscription_plan: string | null;
  subscription_status: string | null;
  total_count: number;
};
type PlatformAccountRow = {
  id: string;
  name: string;
  email: string;
  school_id: string;
  school_name: string;
  role: "SCHOOL_ADMIN" | "TEACHER" | "PRINCIPAL";
  is_active: boolean;
  created_at: string;
  total_count: number;
};
function paginated<T extends { total_count: number }>(rows: T[], page: number) {
  return {
    data: rows.map(({ total_count: _totalCount, ...row }) => row),
    total: rows[0]?.total_count ?? 0,
    page,
    pageSize,
  };
}
