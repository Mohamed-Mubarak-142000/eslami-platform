import type { ApiClient, ApiResult } from "@/lib/api";

export interface MockRoute { method: string; path: string; result: ApiResult<unknown> }
export function createMockApi(routes: readonly MockRoute[]): ApiClient {
  const resolve = async <T>(method: string, path: string): Promise<ApiResult<T>> => {
    const route = routes.find((item) => item.method === method && item.path === path);
    return (route?.result ?? { ok: false, error: { code: "MOCK_NOT_FOUND", message: "No deterministic mock route." }, requestId: "mock-request" }) as ApiResult<T>;
  };
  return { get: (path) => resolve("GET", path), mutate: (method, path) => resolve(method, path) };
}
