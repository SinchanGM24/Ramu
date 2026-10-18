import { HttpException, HttpStatus, Injectable } from "@nestjs/common";

export type UploadConcurrencyConfig = {
  globalLimit: number;
  perSchoolLimit: number;
};

function boundedEnvironmentNumber(
  value: string | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.trunc(parsed), minimum), maximum);
}

export function getUploadConcurrencyConfig(
  environment: NodeJS.ProcessEnv = process.env,
): UploadConcurrencyConfig {
  const globalLimit = boundedEnvironmentNumber(
    environment.UPLOAD_CONCURRENCY_LIMIT,
    8,
    1,
    32,
  );
  return {
    globalLimit,
    perSchoolLimit: Math.min(
      boundedEnvironmentNumber(
        environment.UPLOAD_CONCURRENCY_PER_SCHOOL_LIMIT,
        3,
        1,
        16,
      ),
      globalLimit,
    ),
  };
}

@Injectable()
export class UploadConcurrencyLimiter {
  private readonly config = getUploadConcurrencyConfig();
  private active = 0;
  private readonly activeBySchool = new Map<string, number>();

  async run<T>(schoolId: string, operation: () => Promise<T>) {
    const activeForSchool = this.activeBySchool.get(schoolId) ?? 0;
    if (
      this.active >= this.config.globalLimit ||
      activeForSchool >= this.config.perSchoolLimit
    ) {
      throw new HttpException(
        "Terlalu banyak unggahan sedang diproses. Tunggu sebentar lalu coba lagi.",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    this.active += 1;
    this.activeBySchool.set(schoolId, activeForSchool + 1);
    try {
      return await operation();
    } finally {
      this.active -= 1;
      const remaining = (this.activeBySchool.get(schoolId) ?? 1) - 1;
      if (remaining > 0) this.activeBySchool.set(schoolId, remaining);
      else this.activeBySchool.delete(schoolId);
    }
  }
}
