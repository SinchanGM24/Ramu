import { Global, Module } from "@nestjs/common";
import { RequestRateLimiter } from "./request-rate-limiter";

@Global()
@Module({
  providers: [RequestRateLimiter],
  exports: [RequestRateLimiter],
})
export class CommonModule {}
