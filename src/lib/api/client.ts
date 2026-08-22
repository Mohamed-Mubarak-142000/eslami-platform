import type { ApiClient, ApiResult, RequestOptions } from "./contracts";
import { mapHttpError } from "../errors";

export function createApiClient(baseUrl: string, fetcher: typeof fetch = fetch): ApiClient {
  async function request<T>(method: string, path: string, body?: unknown, options: RequestOptions = {}): Promise<ApiResult<T>> {
    const response = await fetcher(new URL(path, baseUrl), { method, headers: { "content-type": "application/json", ...options.headers }, ...(options.signal ? { signal: options.signal } : {}), ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const requestId = response.headers.get("x-request-id") ?? "unknown";
    if (!response.ok) return { ok: false, error: mapHttpError(response.status), requestId };
    return { ok: true, data: await response.json() as T, requestId };
  }
  return { get: (path, options) => request("GET", path, undefined, options), mutate: (method, path, body, options) => request(method, path, body, options) };
}
