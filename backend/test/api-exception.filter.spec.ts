import {
  ConflictException,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { ApiExceptionFilter } from "../src/common/api-exception.filter";

function invoke(exception: unknown, correlationId = "request-test-123") {
  const sent: Array<{ statusCode: number; body: unknown }> = [];
  const reply = {
    sent: false,
    header: () => reply,
    status: (statusCode: number) => ({
      send: (body: unknown) => sent.push({ statusCode, body }),
    }),
  };
  const host = {
    switchToHttp: () => ({
      getRequest: () => ({
        id: correlationId,
        headers: { "x-correlation-id": correlationId },
        method: "POST",
        url: "/api/reports/report-1/workspace/submit",
      }),
      getResponse: () => reply,
    }),
  };

  new ApiExceptionFilter().catch(exception, host as never);
  return sent[0];
}

describe("ApiExceptionFilter", () => {
  beforeEach(() => {
    vi.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);
    vi.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("preserves a business exception as a safe HTTP response", () => {
    const response = invoke(
      new ConflictException("Hanya raport draf yang dapat dikirim"),
    );

    expect(response).toEqual({
      statusCode: HttpStatus.CONFLICT,
      body: {
        statusCode: HttpStatus.CONFLICT,
        message: "Hanya raport draf yang dapat dikirim",
        error: "Conflict",
        correlationId: "request-test-123",
      },
    });
  });

  it("maps schema validation failures to HTTP 400", () => {
    const schemaError = z.object({ pin: z.string().length(6) }).safeParse({
      pin: "12",
    }).error;
    const response = invoke(schemaError);

    expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(response.body).toMatchObject({
      message: "Data yang dikirim belum valid. Periksa kembali isian Anda.",
      correlationId: "request-test-123",
    });
  });

  it("does not expose unexpected server errors", () => {
    const response = invoke(new Error("database password should never leak"));

    expect(response.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.body).toEqual({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "Terjadi gangguan pada server. Silakan coba beberapa saat lagi.",
      error: "Internal Server Error",
      correlationId: "request-test-123",
    });
  });

  it("keeps not-found responses distinct from validation errors", () => {
    expect(
      invoke(new NotFoundException("Raport tidak ditemukan")).statusCode,
    ).toBe(HttpStatus.NOT_FOUND);
  });

  it("keeps a retry delay from a rate-limit response", () => {
    const response = invoke(
      new HttpException(
        {
          message: "Terlalu banyak percobaan. Silakan coba lagi beberapa saat.",
          retryAfterSeconds: 45,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      ),
    );

    expect(response.body).toMatchObject({ retryAfterSeconds: 45 });
  });
});
