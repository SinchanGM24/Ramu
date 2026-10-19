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

type InjectedResponse = {
  statusCode: number;
  headers: Record<string, string | string[]>;
  rawPayload: Buffer;
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
  const input = {
    method: request.method,
    url: request.url,
    headers: Object.fromEntries(request.headers),
    payload,
  };
  const response = await new Promise<InjectedResponse>((resolve, reject) => {
    fastify.inject(input as never, (error, injectedResponse) => {
      if (error) {
        reject(error);
        return;
      }
      if (!injectedResponse) {
        reject(new Error("Fastify tidak mengembalikan respons serverless."));
        return;
      }
      resolve(injectedResponse as InjectedResponse);
    });
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
