import { HttpException, HttpStatus } from "@nestjs/common";
import { createHash } from "crypto";

export type RateLimitRule = {
  key: string;
  limit: number;
  windowMs: number;
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const maxBuckets = 10_000;

export function rateLimitFingerprint(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

/**
 * Lightweight per-process limiter for anonymous endpoints. It keeps only
 * opaque hashes in memory and bounds its map to avoid becoming a new source
 * of memory pressure. A shared Redis implementation can replace this class
 * when RAMU runs on more than one API instance.
 */
export class RequestRateLimiter {
  private readonly buckets = new Map<string, RateLimitBucket>();

  constructor(private readonly now: () => number = () => Date.now()) {}

  assert(rule: RateLimitRule) {
    const result = this.consume(rule);
    if (result.allowed) return;

    throw new HttpException(
      {
        message: "Terlalu banyak percobaan. Silakan coba lagi beberapa saat.",
        retryAfterSeconds: result.retryAfterSeconds,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  consume(rule: RateLimitRule) {
    const timestamp = this.now();
    this.prune(timestamp);
    const bucket = this.buckets.get(rule.key);

    if (!bucket || bucket.resetAt <= timestamp) {
      this.buckets.set(rule.key, {
        count: 1,
        resetAt: timestamp + rule.windowMs,
      });
      return { allowed: true, retryAfterSeconds: 0 };
    }

    if (bucket.count >= rule.limit) {
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - timestamp) / 1000)),
      };
    }

    bucket.count += 1;
    return { allowed: true, retryAfterSeconds: 0 };
  }

  private prune(timestamp: number) {
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= timestamp) this.buckets.delete(key);
    }

    while (this.buckets.size >= maxBuckets) {
      const oldest = this.buckets.keys().next().value;
      if (!oldest) break;
      this.buckets.delete(oldest);
    }
  }
}
