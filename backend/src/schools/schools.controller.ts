import { Body, Controller, Get, Patch, Req } from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { z } from "zod";
import { AuditService } from "../audit/audit.service";
import { AuthService } from "../auth/auth.service";
import { DatabaseService } from "../database/database.service";

@Controller("schools/current")
export class SchoolsController {
  constructor(private readonly auth: AuthService, private readonly db: DatabaseService, private readonly audit: AuditService) {}
  @Get() async current(@Req() request: FastifyRequest) {
    const session = this.auth.require(request);
    return this.db.transaction(async (client) => (await client.query("SELECT id, name, slug, address, phone, updated_at FROM schools WHERE id = $1", [session.schoolId])).rows[0], session.schoolId);
  }
  @Patch() async update(@Req() request: FastifyRequest, @Body() body: unknown) {
    const session = this.auth.require(request, ["SCHOOL_ADMIN"]);
    const input = z.object({ name: z.string().min(2).max(160), address: z.string().max(500).optional(), phone: z.string().max(40).optional() }).parse(body);
    return this.db.transaction(async (client) => {
      const { rows } = await client.query("UPDATE schools SET name=$1, address=$2, phone=$3, updated_at=now() WHERE id=$4 RETURNING id,name,slug,address,phone", [input.name, input.address ?? null, input.phone ?? null, session.schoolId]);
      await this.audit.record({ schoolId: session.schoolId, actorUserId: session.userId, action: "school.updated", entityType: "school", entityId: session.schoolId }, client);
      return rows[0];
    }, session.schoolId);
  }
}
