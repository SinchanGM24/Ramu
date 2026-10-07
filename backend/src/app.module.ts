import { Module } from "@nestjs/common";
import { AcademicModule } from "./academic/academic.module";
import { AssessmentModule } from "./assessment/assessment.module";
import { AuditModule } from "./audit/audit.module";
import { AuthModule } from "./auth/auth.module";
import { DatabaseModule } from "./database/database.module";
import { HealthModule } from "./health/health.module";
import { MessagingModule } from "./messaging/messaging.module";
import { SchoolsModule } from "./schools/schools.module";
import { StudentsModule } from "./students/students.module";
import { ReportsModule } from "./reports/reports.module";

@Module({ imports: [DatabaseModule, AuditModule, AuthModule, HealthModule, SchoolsModule, AcademicModule, StudentsModule, AssessmentModule, ReportsModule, MessagingModule] })
export class AppModule {}
