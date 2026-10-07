import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { StaffController } from "./staff.controller";
@Module({ imports: [AuthModule, AuditModule], controllers: [StaffController] }) export class StaffModule {}
