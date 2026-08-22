export interface ApiSuccess<T> { ok: true; data: T; requestId: string }
export interface ApiFailure { ok: false; error: { code: string; message: string; fieldErrors?: Readonly<Record<string, readonly string[]>> }; requestId: string }
export type ApiResult<T> = ApiSuccess<T> | ApiFailure;
export interface Page<T> { items: readonly T[]; nextCursor: string | null }
export interface RequestOptions { signal?: AbortSignal; headers?: Readonly<Record<string, string>> }
export interface ApiClient { get<T>(path: string, options?: RequestOptions): Promise<ApiResult<T>>; mutate<TBody, TResult>(method: "POST" | "PUT" | "PATCH" | "DELETE", path: string, body?: TBody, options?: RequestOptions): Promise<ApiResult<TResult>> }
