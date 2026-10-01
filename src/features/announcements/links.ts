import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { headers } from "next/headers";
import { SITE_URL } from "@/lib/supabase/env";

function secret(): string {
  const value = process.env.OTP_SECRET ?? process.env.SUPABASE_SECRET_KEY;
  if (!value) throw new Error("OTP_SECRET is not configured");
  return value;
}

/** Which emails a link turns off: feature announcements, or the special-day reminders. */
export type MailingList = "updates" | "reminders";

export const parseMailingList = (value: unknown): MailingList => (value === "reminders" ? "reminders" : "updates");

/**
 * A per-user signature, so an unsubscribe link only ever works for the account it was sent to.
 * "updates" keeps the original payload so links in already-sent announcements stay valid.
 */
export function unsubscribeToken(userId: string, list: MailingList = "updates"): string {
  const payload = list === "updates" ? `unsubscribe:${userId}` : `unsubscribe:${list}:${userId}`;
  return createHmac("sha256", secret()).update(payload).digest("base64url").slice(0, 32);
}

export function isValidUnsubscribeToken(userId: string, token: string, list: MailingList = "updates"): boolean {
  const expected = Buffer.from(unsubscribeToken(userId, list));
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

function unsubscribeQuery(userId: string, list: MailingList) {
  return new URLSearchParams({ u: userId, t: unsubscribeToken(userId, list), ...(list === "reminders" && { list }) });
}

export function unsubscribeUrl(origin: string, userId: string, list: MailingList = "updates"): string {
  return `${origin}/unsubscribe?${unsubscribeQuery(userId, list)}`;
}

/** Where Gmail POSTs its own "Unsubscribe" button (List-Unsubscribe-Post, RFC 8058). */
export function oneClickUnsubscribeUrl(origin: string, userId: string, list: MailingList = "updates"): string {
  return `${origin}/unsubscribe/one-click?${unsubscribeQuery(userId, list)}`;
}
