import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { StudentsController } from "./students.controller";
@Module({ imports:[AuthModule,AuditModule],controllers:[StudentsController]}) export class StudentsModule {}
