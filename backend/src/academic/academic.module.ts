import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { AcademicController } from "./academic.controller";
@Module({ imports: [AuthModule, AuditModule], controllers: [AcademicController] }) export class AcademicModule {}
