"use server";

import type { Route } from "next";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SITE_URL, isSupabaseConfigured } from "@/lib/supabase/env";
import { NOT_CONFIGURED, authErrorMessage, otpErrorMessage } from "./errors";
import { consumeOtp, issueOtp } from "./otp";
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

const email = z.string().trim().toLowerCase().email("أدخل بريدًا إلكترونيًا صحيحًا");
const password = z.string().min(8, "كلمة المرور ٨ أحرف على الأقل").max(72, "كلمة المرور طويلة جدًا");
export type OtpType = "signup" | "recovery" | "email";

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

async function findUserId(address: string): Promise<string | null> {
  const { data } = await createSupabaseAdminClient().from("profiles").select("id").eq("email", address).maybeSingle();
  return data?.id ?? null;
}

/** Signs the user in after our own code check: a server-generated magic-link token, never emailed. */
async function startSession(address: string): Promise<FormState | null> {
  const { data, error } = await createSupabaseAdminClient().auth.admin.generateLink({ type: "magiclink", email: address });
  if (error || !data.properties?.hashed_token) return { error: authErrorMessage(error) };
  const supabase = await createSupabaseServerClient();
  const { error: sessionError } = await supabase.auth.verifyOtp({ type: "email", token_hash: data.properties.hashed_token });
  return sessionError ? { error: authErrorMessage(sessionError) } : null;
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

  // Created unconfirmed and without Supabase's mailer; our own code confirms it in verifyOtpAction.
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: false,
    user_metadata: { full_name: parsed.data.fullName },
  });
  if (error) return { error: authErrorMessage(error), values };
  const sent = await issueOtp(parsed.data.email, "signup");
  if (!sent.ok && sent.reason === "send_failed") {
    // Undo the account: otherwise the retry fails with "already registered" and no code ever arrives.
    await admin.auth.admin.deleteUser(data.user.id);
    return { error: otpErrorMessage(sent.reason), values };
  }
  redirect(verifyUrl(parsed.data.email, "signup"));
}

export async function loginAction(_: FormState | undefined, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return { error: NOT_CONFIGURED };
  const parsed = z.object({ email, password: z.string().min(1, "أدخل كلمة المرور") }).safeParse(Object.fromEntries(formData));
  const values = echo(formData, "email");
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error?.code === "email_not_confirmed") {
    await issueOtp(parsed.data.email, "signup");
    redirect(verifyUrl(parsed.data.email, "signup", safeNext(formData.get("next"))));
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

/**
 * The origin the visitor is actually on (Vercel sets x-forwarded-host/proto). Used for OAuth
 * return links so a wrong NEXT_PUBLIC_SITE_URL can't send people to another host; Supabase still
 * only honors origins in its Redirect URLs allow-list.
 */
async function requestOrigin(): Promise<string> {
  const list = await headers();
  const host = list.get("x-forwarded-host") ?? list.get("host");
  if (!host) return SITE_URL;
  const proto = list.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function googleSignInAction(formData: FormData): Promise<void> {
  if (!isSupabaseConfigured) redirect("/login?error=not-configured");
  const next = safeNext(formData.get("next"));
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${await requestOrigin()}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error || !data.url) redirect("/login?error=google");
  redirect(data.url as Route);
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
      type: z.enum(["signup", "recovery", "email"]),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const checked = await consumeOtp(parsed.data.email, parsed.data.type, parsed.data.token);
  if (!checked.ok) return { error: otpErrorMessage(checked.reason) };
  const userId = await findUserId(parsed.data.email);
  if (!userId) return { error: otpErrorMessage("invalid") };
  if (parsed.data.type === "signup") {
    const { error } = await createSupabaseAdminClient().auth.admin.updateUserById(userId, { email_confirm: true });
    if (error) return { error: authErrorMessage(error) };
  }
  const failed = await startSession(parsed.data.email);
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

export async function signOutAction(): Promise<void> {
  if (isSupabaseConfigured) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut({ scope: "local" });
  }
  (await cookies()).delete(ACTIVE_LEARNER_COOKIE);
  redirect("/");
}
