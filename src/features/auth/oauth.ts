import "server-only";
import type { NextRequest } from "next/server";

export const OAUTH_PROVIDERS = ["google", "facebook"] as const;
export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

export function isOAuthProvider(value: string | null): value is OAuthProvider {
  return (OAUTH_PROVIDERS as readonly (string | null)[]).includes(value);
}

/**
 * The origin the visitor is actually on (Vercel sets x-forwarded-host/proto). Used for OAuth
 * return links so a wrong NEXT_PUBLIC_SITE_URL can't send people to another host, where the PKCE
 * cookie set here doesn't exist. Supabase still only honors origins in its Redirect URLs allow-list.
 */
export function requestOrigin(request: NextRequest): string {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) return request.nextUrl.origin;
  const proto = request.headers.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** Only same-site paths: "//host" and "/\host" are treated as external by browsers. */
export function safeNextPath(value: string | null): string {
  return value && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\") ? value : "/dashboard";
}

export function loginNoticeUrl(origin: string, notice: string, next: string): string {
  const params = new URLSearchParams({ error: notice });
  if (next !== "/dashboard") params.set("next", next);
  return `${origin}/login?${params.toString()}`;
}
