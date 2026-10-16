import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";

type ErrorResponse = {
  message?: string | string[];
  error?: string;
};

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const request = context.getRequest<FastifyRequest>();
    const reply = context.getResponse<FastifyReply>();
    const correlationId = String(
      request.headers["x-correlation-id"] ?? request.id ?? "unknown",
    );

    if (reply.sent) return;

    const { statusCode, message, error } = this.toErrorResponse(exception);
    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `[${correlationId}] ${request.method} ${request.url} -> ${statusCode}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(
        `[${correlationId}] ${request.method} ${request.url} -> ${statusCode}: ${message}`,
      );
    }

    reply
      .header("X-Correlation-Id", correlationId)
      .status(statusCode)
      .send({ statusCode, message, error, correlationId });
  }

  private toErrorResponse(exception: unknown) {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      const details =
        typeof response === "string"
          ? { message: response }
          : (response as ErrorResponse);
      return {
        statusCode: exception.getStatus(),
        message: Array.isArray(details.message)
          ? details.message.join(", ")
          : (details.message ?? "Permintaan tidak dapat diproses."),
        error: details.error ?? exception.name,
      };
    }

    if (exception instanceof ZodError) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: "Data yang dikirim belum valid. Periksa kembali isian Anda.",
        error: "Bad Request",
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "Terjadi gangguan pada server. Silakan coba beberapa saat lagi.",
      error: "Internal Server Error",
    };
  }
}
