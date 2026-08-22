import type { Session } from "@/domain";

export interface AuthGateway { getSession(signal?: AbortSignal): Promise<Session>; signOut(): Promise<void> }
export function safeReturnPath(value: string | null, fallback = "/"): string { return value?.startsWith("/") && !value.startsWith("//") ? value : fallback; }
