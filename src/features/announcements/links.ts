import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { headers } from "next/headers";
import { SITE_URL } from "@/lib/supabase/env";

function secret(): string {
  const value = process.env.OTP_SECRET ?? process.env.SUPABASE_SECRET_KEY;
  if (!value) throw new Error("OTP_SECRET is not configured");
  return value;
}

/** A per-user signature, so an unsubscribe link only ever works for the account it was sent to. */
export function unsubscribeToken(userId: string): string {
  return createHmac("sha256", secret()).update(`unsubscribe:${userId}`).digest("base64url").slice(0, 32);
}

export function isValidUnsubscribeToken(userId: string, token: string): boolean {
  const expected = Buffer.from(unsubscribeToken(userId));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/**
 * The origin the admin is on (Vercel sets x-forwarded-host), so links in the email point at the
 * live site even when NEXT_PUBLIC_SITE_URL still says localhost.
 */
export async function siteOrigin(): Promise<string> {
  const list = await headers();
  const host = list.get("x-forwarded-host") ?? list.get("host");
  if (!host) return SITE_URL;
  const proto = list.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export function unsubscribeUrl(origin: string, userId: string): string {
  return `${origin}/unsubscribe?${new URLSearchParams({ u: userId, t: unsubscribeToken(userId) })}`;
}

/** Where Gmail POSTs its own "Unsubscribe" button (List-Unsubscribe-Post, RFC 8058). */
export function oneClickUnsubscribeUrl(origin: string, userId: string): string {
  return `${origin}/unsubscribe/one-click?${new URLSearchParams({ u: userId, t: unsubscribeToken(userId) })}`;
}
