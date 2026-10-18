import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AuthModule } from "../auth/auth.module";
import { LifecycleController } from "./lifecycle.controller";

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [LifecycleController],
})
export class LifecycleModule {}
