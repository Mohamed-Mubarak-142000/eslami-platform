import "server-only";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { OtpPurpose } from "@/lib/supabase/database.types";
import { sendMail } from "@/lib/mail/smtp";

/**
 * The app's own 6-digit email codes. Codes are generated and emailed here; only an HMAC of the
 * code is stored (table `email_otps`), and each code is single-use with limited attempts.
 */

const CODE_TTL_MINUTES = 15;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_ATTEMPTS = 5;

export type IssueResult = { ok: true } | { ok: false; reason: "cooldown" | "send_failed" };
export type ConsumeResult = { ok: true } | { ok: false; reason: "invalid" | "expired" | "too_many" };

function hashCode(email: string, purpose: OtpPurpose, code: string): string {
  const secret = process.env.OTP_SECRET ?? process.env.SUPABASE_SECRET_KEY;
  if (!secret) throw new Error("OTP_SECRET is not configured");
  return createHmac("sha256", secret).update(`${purpose}:${email}:${code}`).digest("hex");
}

const SUBJECTS: Record<OtpPurpose, string> = {
  signup: "كود تأكيد حسابك في المنارة",
  recovery: "كود استعادة كلمة المرور",
  email: "كود الدخول إلى المنارة",
};
const LEADS: Record<OtpPurpose, string> = {
  signup: "استخدم هذا الكود لتأكيد حسابك:",
  recovery: "استخدم هذا الكود لاستعادة كلمة المرور:",
  email: "استخدم هذا الكود لتسجيل الدخول:",
};

function emailHtml(purpose: OtpPurpose, code: string): string {
  return `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;text-align:right;color:#183d34">
  <h2 style="color:#003e32">المنارة</h2>
  <p>${LEADS[purpose]}</p>
  <p style="font-size:32px;font-weight:bold;letter-spacing:6px;direction:ltr;text-align:center;color:#005544">${code}</p>
  <p>الكود صالح لمدة ${CODE_TTL_MINUTES} دقيقة. إن لم تطلبه فتجاهل هذه الرسالة.</p>
</div>`;
}

/** Creates (or replaces) the code for this email + purpose and emails it. */
export async function issueOtp(email: string, purpose: OtpPurpose): Promise<IssueResult> {
  const admin = createSupabaseAdminClient();
  const { data: existing } = await admin.from("email_otps").select("created_at").eq("email", email).eq("purpose", purpose).maybeSingle();
  if (existing && Date.now() - new Date(existing.created_at).getTime() < RESEND_COOLDOWN_SECONDS * 1000) {
    return { ok: false, reason: "cooldown" };
  }

  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  const now = new Date();
  const { error } = await admin.from("email_otps").upsert({
    email,
    purpose,
    code_hash: hashCode(email, purpose, code),
    attempts: 0,
    created_at: now.toISOString(),
    expires_at: new Date(now.getTime() + CODE_TTL_MINUTES * 60_000).toISOString(),
  });
  if (error) throw error;

  try {
    await sendMail({ to: email, subject: SUBJECTS[purpose], html: emailHtml(purpose, code) });
    return { ok: true };
  } catch (sendError) {
    console.error("OTP email failed", sendError);
    // Let the user retry right away instead of waiting out the cooldown for a mail that never left.
    await admin.from("email_otps").delete().eq("email", email).eq("purpose", purpose);
    return { ok: false, reason: "send_failed" };
  }
}

/** Checks a code; a correct code is deleted so it can't be reused. */
export async function consumeOtp(email: string, purpose: OtpPurpose, code: string): Promise<ConsumeResult> {
  const admin = createSupabaseAdminClient();
  const { data: row } = await admin
    .from("email_otps")
    .select("code_hash, attempts, expires_at")
    .eq("email", email)
    .eq("purpose", purpose)
    .maybeSingle();
  if (!row) return { ok: false, reason: "invalid" };
  if (new Date(row.expires_at).getTime() < Date.now()) return { ok: false, reason: "expired" };
  if (row.attempts >= MAX_ATTEMPTS) return { ok: false, reason: "too_many" };

  const expected = Buffer.from(row.code_hash, "hex");
  const actual = Buffer.from(hashCode(email, purpose, code), "hex");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    await admin
      .from("email_otps")
      .update({ attempts: row.attempts + 1 })
      .eq("email", email)
      .eq("purpose", purpose);
    return { ok: false, reason: row.attempts + 1 >= MAX_ATTEMPTS ? "too_many" : "invalid" };
  }

  await admin.from("email_otps").delete().eq("email", email).eq("purpose", purpose);
  return { ok: true };
}
