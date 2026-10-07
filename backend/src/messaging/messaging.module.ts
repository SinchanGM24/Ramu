import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { ReportDeliveriesController } from "./report-deliveries.controller";

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [ReportDeliveriesController],
})
export class MessagingModule {}
