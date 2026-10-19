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
	const headers = new Headers();
	for (const [name, value] of result.headers) headers.append(name, value);
	const body = result.body.buffer.slice(
		result.body.byteOffset,
		result.body.byteOffset + result.body.byteLength,
	) as ArrayBuffer;
	return new Response(body, { status: result.status, headers });
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const OPTIONS = handle;
