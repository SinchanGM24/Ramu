const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export class ApiError extends Error { constructor(message: string, public status: number) { super(message); } }

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}/api${path}`, { ...options, credentials: "include", headers: { "Content-Type": "application/json", ...options.headers } });
  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: "Terjadi kesalahan" }));
    throw new ApiError(Array.isArray(body.message) ? body.message.join(", ") : body.message || "Terjadi kesalahan", response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
