import "server-only";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { NOT_CONFIGURED, authErrorMessage, otpErrorMessage } from "./errors";
import { consumeOtp, issueOtp } from "./otp";

/**
 * Account flows shared by the website's Server Actions (src/features/auth/actions.ts) and the mobile
 * app's /api/v1/auth routes. Nothing here touches cookies or redirects; callers decide that.
 */

export const emailSchema = z.string().trim().toLowerCase().email("أدخل بريدًا إلكترونيًا صحيحًا");
export const passwordSchema = z.string().min(8, "كلمة المرور ٨ أحرف على الأقل").max(72, "كلمة المرور طويلة جدًا");
export const otpTypeSchema = z.enum(["signup", "recovery", "email"]);
export type OtpType = z.infer<typeof otpTypeSchema>;

export type ServiceResult<T extends object = object> = ({ ok: true } & T) | { ok: false; error: string };

export async function findUserId(address: string): Promise<string | null> {
  const { data } = await createSupabaseAdminClient().from("profiles").select("id").eq("email", address).maybeSingle();
  return data?.id ?? null;
}

/** Creates the account unconfirmed (no Supabase mailer) and emails our own signup code. */
export async function registerAccount(input: { fullName: string; email: string; password: string }): Promise<ServiceResult> {
  if (!isSupabaseConfigured) return { ok: false, error: NOT_CONFIGURED };
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: false,
    user_metadata: { full_name: input.fullName },
  });
  if (error) return { ok: false, error: authErrorMessage(error) };
  const sent = await issueOtp(input.email, "signup");
  if (!sent.ok && sent.reason === "send_failed") {
    // Undo the account: otherwise the retry fails with "already registered" and no code ever arrives.
    await admin.auth.admin.deleteUser(data.user.id);
    return { ok: false, error: otpErrorMessage(sent.reason) };
  }
  return { ok: true };
}

/**
 * Sends (or re-sends) a code. Unknown emails get the same success answer, so this can't be used to
 * probe which addresses have accounts.
 */
export async function requestCode(address: string, type: OtpType): Promise<ServiceResult> {
  if (!isSupabaseConfigured) return { ok: false, error: NOT_CONFIGURED };
  if (!(await findUserId(address))) return { ok: true };
  const sent = await issueOtp(address, type);
  return sent.ok ? { ok: true } : { ok: false, error: otpErrorMessage(sent.reason) };
}

/**
 * Checks a code and, when it is right, returns a single-use token hash that the caller exchanges for
 * a session with `supabase.auth.verifyOtp({ type: "email", token_hash })` — on the server for the
 * website, on the device for the mobile app. A signup code also confirms the email.
 */
export async function verifyCode(address: string, type: OtpType, code: string): Promise<ServiceResult<{ tokenHash: string }>> {
  if (!isSupabaseConfigured) return { ok: false, error: NOT_CONFIGURED };
  const checked = await consumeOtp(address, type, code);
  if (!checked.ok) return { ok: false, error: otpErrorMessage(checked.reason) };
  const userId = await findUserId(address);
  if (!userId) return { ok: false, error: otpErrorMessage("invalid") };

  const admin = createSupabaseAdminClient();
  if (type === "signup") {
    const { error } = await admin.auth.admin.updateUserById(userId, { email_confirm: true });
    if (error) return { ok: false, error: authErrorMessage(error) };
  }
  // A server-generated magic-link token, never emailed: our own code check above is the proof.
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email: address });
  const tokenHash = data.properties?.hashed_token;
  if (error || !tokenHash) return { ok: false, error: authErrorMessage(error) };
  return { ok: true, tokenHash };
}
