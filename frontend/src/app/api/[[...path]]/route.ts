import { NextResponse } from "next/server";
import { handleServerlessRequest } from "../../../../../backend/src/http/serverless-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function handle(request: Request) {
	const url = new URL(request.url);
	const result = await handleServerlessRequest({
		method: request.method,
		url: `${url.pathname}${url.search}`,
		headers: request.headers.entries(),
		arrayBuffer: () => request.arrayBuffer(),
	});
	const body = result.body.buffer.slice(
		result.body.byteOffset,
		result.body.byteOffset + result.body.byteLength,
	) as ArrayBuffer;
	const response = new NextResponse(body, { status: result.status });
	for (const [name, value] of result.headers) response.headers.append(name, value);
	return response;
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const OPTIONS = handle;
