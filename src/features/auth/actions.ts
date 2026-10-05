"use server";

import type { Route } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { NOT_CONFIGURED, authErrorMessage, otpErrorMessage } from "./errors";
import { issueOtp } from "./otp";
import {
  confirmEmail,
  emailSchema as email,
  findUserId,
  otpTypeSchema,
  passwordSchema as password,
  registerAccount,
  verifyCode,
  type OtpType,
} from "./service";
import { ACTIVE_LEARNER_COOKIE } from "./session";

export interface FormState {
  error?: string;
  fieldErrors?: Record<string, string>;
  message?: string;
  /** Non-secret values echoed back so the form keeps them after React resets it on submit. */
  values?: Record<string, string>;
}

function echo(formData: FormData, ...names: string[]): Record<string, string> {
  return Object.fromEntries(names.map((name) => [name, String(formData.get(name) ?? "")]));
}

export type { OtpType };

function safeNext(value: FormDataEntryValue | null): Route {
  const next = typeof value === "string" ? value : "";
  // Only same-site paths: "//host" and "/host" are treated as external by browsers.
  return (next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/dashboard") as Route;
}

function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    result[key] ??= issue.message;
  }
  return result;
}

/** Exchanges verifyCode()'s token hash for the website's cookie session. */
async function startSession(tokenHash: string): Promise<FormState | null> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({ type: "email", token_hash: tokenHash });
  return error ? { error: authErrorMessage(error) } : null;
}

function verifyUrl(address: string, type: OtpType, next?: string): Route {
  const params = new URLSearchParams({ email: address, type });
  if (next) params.set("next", next);
  return `/verify?${params.toString()}` as Route;
}

export async function registerAction(_: FormState | undefined, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return { error: NOT_CONFIGURED };
  const parsed = z
    .object({ fullName: z.string().trim().min(2, "اكتب اسمك (حرفان على الأقل)").max(60), email, password, confirm: z.string() })
    .refine((value) => value.password === value.confirm, { path: ["confirm"], message: "كلمتا المرور غير متطابقتين" })
    .safeParse(Object.fromEntries(formData));
  const values = echo(formData, "fullName", "email");
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };

  const created = await registerAccount(parsed.data);
  if (!created.ok) return { error: created.error, values };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
  if (error) return { error: authErrorMessage(error), values };
  redirect(safeNext(formData.get("next")));
}

export async function loginAction(_: FormState | undefined, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return { error: NOT_CONFIGURED };
  const parsed = z.object({ email, password: z.string().min(1, "أدخل كلمة المرور") }).safeParse(Object.fromEntries(formData));
  const values = echo(formData, "email");
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };

  const supabase = await createSupabaseServerClient();
  let { error } = await supabase.auth.signInWithPassword(parsed.data);
  // Supabase checks the password before the confirmation, so this account's owner is proven.
  if (error?.code === "email_not_confirmed" && (await confirmEmail(parsed.data.email))) {
    ({ error } = await supabase.auth.signInWithPassword(parsed.data));
  }
  if (error) return { error: authErrorMessage(error), values };
  redirect(safeNext(formData.get("next")));
}

export async function emailCodeLoginAction(_: FormState | undefined, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return { error: NOT_CONFIGURED };
  const parsed = z.object({ email }).safeParse({ email: formData.get("email") });
  const values = echo(formData, "email");
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };
  if (!(await findUserId(parsed.data.email))) return { error: authErrorMessage({ code: "user_not_found" }), values };
  const sent = await issueOtp(parsed.data.email, "email");
  if (!sent.ok && sent.reason === "send_failed") return { error: otpErrorMessage(sent.reason), values };
  redirect(verifyUrl(parsed.data.email, "email", safeNext(formData.get("next"))));
}

export async function verifyOtpAction(_: FormState | undefined, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return { error: NOT_CONFIGURED };
  const parsed = z
    .object({
      email,
      token: z
        .string()
        .trim()
        .regex(/^\d{6}$/, "الكود ٦ أرقام"),
      type: otpTypeSchema,
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const verified = await verifyCode(parsed.data.email, parsed.data.type, parsed.data.token);
  if (!verified.ok) return { error: verified.error };
  const failed = await startSession(verified.tokenHash);
  if (failed) return failed;
  redirect(parsed.data.type === "recovery" ? "/reset-password" : safeNext(formData.get("next")));
}

export async function resendOtpAction(address: string, type: OtpType): Promise<FormState> {
  if (!isSupabaseConfigured) return { error: NOT_CONFIGURED };
  const parsed = email.safeParse(address);
  if (!parsed.success) return { error: "بريد غير صحيح" };
  // Unknown emails get the same answer, so the button can't be used to probe for accounts.
  if (await findUserId(parsed.data)) {
    const sent = await issueOtp(parsed.data, type);
    if (!sent.ok) return { error: otpErrorMessage(sent.reason) };
  }
  return { message: "أرسلنا كودًا جديدًا إلى بريدك." };
}

export async function forgotPasswordAction(_: FormState | undefined, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return { error: NOT_CONFIGURED };
  const parsed = z.object({ email }).safeParse({ email: formData.get("email") });
  const values = echo(formData, "email");
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };
  // Same response whether or not the account exists, so the form can't be used to probe emails.
  if (await findUserId(parsed.data.email)) {
    const sent = await issueOtp(parsed.data.email, "recovery");
    if (!sent.ok && sent.reason === "send_failed") return { error: otpErrorMessage(sent.reason), values };
  }
  redirect(verifyUrl(parsed.data.email, "recovery"));
}

export async function resetPasswordAction(_: FormState | undefined, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return { error: NOT_CONFIGURED };
  const parsed = z
    .object({ password, confirm: z.string() })
    .refine((value) => value.password === value.confirm, { path: ["confirm"], message: "كلمتا المرور غير متطابقتين" })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: "انتهت الجلسة، اطلب كود استعادة جديدًا." };
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: authErrorMessage(error) };
  redirect("/dashboard?password=updated");
}

/** Clears the session cookies on the server; the caller decides where to go next. */
export async function endSessionAction(): Promise<void> {
  if (isSupabaseConfigured) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut({ scope: "local" });
  }
  (await cookies()).delete(ACTIVE_LEARNER_COOKIE);
}

export async function signOutAction(): Promise<void> {
  await endSessionAction();
  redirect("/");
}
