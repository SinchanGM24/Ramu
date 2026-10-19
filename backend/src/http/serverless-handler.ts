import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import type { FastifyInstance } from "fastify";
import { createHttpApplication } from "./app-factory";
import { ReportPublicationJobsService } from "../reports/report-publication-jobs.service";

type ServerlessRequest = {
  method: string;
  url: string;
  headers: Iterable<[string, string]>;
  arrayBuffer: () => Promise<ArrayBuffer>;
};
export type ServerlessResponse = {
  status: number;
  headers: Array<[string, string]>;
  body: Buffer;
};
let application: Promise<NestFastifyApplication> | undefined;

function getApplication() {
  application ??= createHttpApplication();
  return application;
}

export async function handleServerlessRequest(
  request: ServerlessRequest,
): Promise<ServerlessResponse> {
  const app = await getApplication();
  const payload = ["GET", "HEAD"].includes(request.method.toUpperCase())
    ? undefined
    : Buffer.from(await request.arrayBuffer());
  const fastify = app.getHttpAdapter().getInstance() as FastifyInstance;
  const inject = fastify.inject.bind(fastify) as unknown as (input: {
    method: string;
    url: string;
    headers: Record<string, string>;
    payload?: Buffer;
  }) => Promise<{
    statusCode: number;
    headers: Record<string, string | string[]>;
    rawPayload: Buffer;
  }>;
  const response = await inject({
    method: request.method,
    url: request.url,
    headers: Object.fromEntries(request.headers),
    payload,
  });
  const headers = Object.entries(response.headers).flatMap(([name, value]) =>
    Array.isArray(value)
      ? value.map((entry) => [name, entry] as [string, string])
      : [[name, String(value)] as [string, string]],
  );
  return { status: response.statusCode, headers, body: response.rawPayload };
}

export async function processNextServerlessPublication() {
  const app = await getApplication();
  return app
    .get(ReportPublicationJobsService)
    .processNext({ throwOnFailure: true });
}
