const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export class ApiError extends Error { constructor(message: string, public status: number) { super(message); } }

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (demoMode) {
    const { demoResponse } = await import("./demo-api");
    return demoResponse(path, options) as T;
  }
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const response = await fetch(`${API_URL}/api${path}`, { ...options, credentials: "include", headers });
  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: "Terjadi kesalahan" }));
    throw new ApiError(Array.isArray(body.message) ? body.message.join(", ") : body.message || "Terjadi kesalahan", response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
