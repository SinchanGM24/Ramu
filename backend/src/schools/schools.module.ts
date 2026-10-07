import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { SchoolsController } from "./schools.controller";
@Module({ imports: [AuthModule, AuditModule], controllers: [SchoolsController] }) export class SchoolsModule {}
