import { Global, Module } from "@nestjs/common";
import { DataRetentionService } from "./data-retention.service";
import { RequestRateLimiter } from "./request-rate-limiter";

@Global()
@Module({
  providers: [DataRetentionService, RequestRateLimiter],
  exports: [DataRetentionService, RequestRateLimiter],
})
export class CommonModule {}
