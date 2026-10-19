import {
  HttpException,
  HttpStatus,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Optional,
  ServiceUnavailableException,
} from "@nestjs/common";
import { createHash } from "crypto";
import { createClient, type RedisClientType } from "redis";

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
const redisConsumeScript = `
  local count = redis.call('INCR', KEYS[1])
  if count == 1 then
    redis.call('PEXPIRE', KEYS[1], ARGV[1])
  end
  return { count, redis.call('PTTL', KEYS[1]) }
`;

export function rateLimitFingerprint(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

/**
 * A Redis URL makes this limiter shared and atomic across API instances. The
 * bounded in-memory implementation remains only for local, single-process
 * development when RATE_LIMIT_REDIS_URL is intentionally unset.
 */
@Injectable()
export class RequestRateLimiter implements OnModuleInit, OnModuleDestroy {
  private readonly buckets = new Map<string, RateLimitBucket>();
  private readonly redis?: RedisClientType;
  private now: () => number = () => Date.now();

  constructor(
    @Optional() environment: Partial<NodeJS.ProcessEnv> = process.env,
    @Optional() redisClient?: RedisClientType,
  ) {
    const redisUrl = environment.RATE_LIMIT_REDIS_URL?.trim();
    if (redisUrl) {
      this.redis = redisClient ?? createClient({ url: redisUrl });
      this.redis.on("error", () => undefined);
    }
  }

  static withClock(now: () => number) {
    const limiter = new RequestRateLimiter({});
    limiter.now = now;
    return limiter;
  }

  async onModuleInit() {
    if (!this.redis || this.redis.isOpen) return;
    try {
      await this.redis.connect();
    } catch {
      throw new Error(
        "RATE_LIMIT_REDIS_URL tidak dapat dihubungkan. Perlindungan rate limit bersama tidak tersedia.",
      );
    }
  }

  async onModuleDestroy() {
    if (this.redis?.isOpen) await this.redis.disconnect();
  }

  async assert(rule: RateLimitRule) {
    const result = await this.consume(rule);
    if (result.allowed) return;

    throw new HttpException(
      {
        message: "Terlalu banyak percobaan. Silakan coba lagi beberapa saat.",
        retryAfterSeconds: result.retryAfterSeconds,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  async consume(rule: RateLimitRule) {
    if (this.redis) return this.consumeWithRedis(rule);

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
        retryAfterSeconds: Math.max(
          1,
          Math.ceil((bucket.resetAt - timestamp) / 1000),
        ),
      };
    }

    bucket.count += 1;
    return { allowed: true, retryAfterSeconds: 0 };
  }

  private async consumeWithRedis(rule: RateLimitRule) {
    if (!this.redis?.isOpen) {
      throw new ServiceUnavailableException(
        "Layanan perlindungan permintaan sementara tidak tersedia.",
      );
    }

    try {
      const result = (await this.redis.eval(redisConsumeScript, {
        keys: [`ramu:rate-limit:${rule.key}`],
        arguments: [String(rule.windowMs)],
      })) as [number | string, number | string];
      const count = Number(result[0]);
      const ttlMs = Number(result[1]);
      if (!Number.isFinite(count) || !Number.isFinite(ttlMs)) {
        throw new Error("Respons Redis rate limit tidak valid.");
      }
      return {
        allowed: count <= rule.limit,
        retryAfterSeconds:
          count <= rule.limit ? 0 : Math.max(1, Math.ceil(ttlMs / 1000)),
      };
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      throw new ServiceUnavailableException(
        "Layanan perlindungan permintaan sementara tidak tersedia.",
      );
    }
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
