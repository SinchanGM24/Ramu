import { Module } from "@nestjs/common";
import { AcademicModule } from "./academic/academic.module";
import { AssessmentModule } from "./assessment/assessment.module";
import { AuditModule } from "./audit/audit.module";
import { AuthModule } from "./auth/auth.module";
import { DatabaseModule } from "./database/database.module";
import { HealthModule } from "./health/health.module";
import { FilesModule } from "./files/files.module";
import { MessagingModule } from "./messaging/messaging.module";
import { SchoolsModule } from "./schools/schools.module";
import { StudentsModule } from "./students/students.module";
import { ReportsModule } from "./reports/reports.module";
import { StaffModule } from "./staff/staff.module";

@Module({ imports: [DatabaseModule, AuditModule, AuthModule, HealthModule, FilesModule, SchoolsModule, AcademicModule, StudentsModule, AssessmentModule, ReportsModule, MessagingModule, StaffModule] })
export class AppModule {}
