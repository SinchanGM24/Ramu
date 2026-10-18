import { Global, Module } from "@nestjs/common";
import { DataRetentionService } from "./data-retention.service";
import { RequestRateLimiter } from "./request-rate-limiter";
import { UploadConcurrencyLimiter } from "./upload-concurrency-limiter";

@Global()
@Module({
  providers: [
    DataRetentionService,
    RequestRateLimiter,
    UploadConcurrencyLimiter,
  ],
  exports: [DataRetentionService, RequestRateLimiter, UploadConcurrencyLimiter],
})
export class CommonModule {}
