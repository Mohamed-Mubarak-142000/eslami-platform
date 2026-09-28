"use server";

import type { Route } from "next";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SITE_URL, isSupabaseConfigured } from "@/lib/supabase/env";
import { NOT_CONFIGURED, authErrorMessage } from "./errors";

export interface FormState {
  error?: string;
  fieldErrors?: Record<string, string>;
  message?: string;
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
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { full_name: parsed.data.fullName }, emailRedirectTo: `${SITE_URL}/auth/callback` },
  });
  if (error) return { error: authErrorMessage(error) };
  // Supabase returns a user with no identities when the email already exists (anti-enumeration).
  if (data.user && data.user.identities?.length === 0) return { error: authErrorMessage({ code: "user_already_exists" }) };
  redirect(verifyUrl(parsed.data.email, "signup"));
}

export async function loginAction(_: FormState | undefined, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return { error: NOT_CONFIGURED };
  const parsed = z.object({ email, password: z.string().min(1, "أدخل كلمة المرور") }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error?.code === "email_not_confirmed") {
    await supabase.auth.resend({ type: "signup", email: parsed.data.email });
    redirect(verifyUrl(parsed.data.email, "signup", safeNext(formData.get("next"))));
  }
  if (error) return { error: authErrorMessage(error) };
  redirect(safeNext(formData.get("next")));
}

export async function emailCodeLoginAction(_: FormState | undefined, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return { error: NOT_CONFIGURED };
  const parsed = z.object({ email }).safeParse({ email: formData.get("email") });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({ email: parsed.data.email, options: { shouldCreateUser: false } });
  if (error) return { error: authErrorMessage(error) };
  redirect(verifyUrl(parsed.data.email, "email", safeNext(formData.get("next"))));
}

export async function googleSignInAction(formData: FormData): Promise<void> {
  if (!isSupabaseConfigured) redirect("/login?error=not-configured");
  const next = safeNext(formData.get("next"));
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${SITE_URL}/auth/callback?next=${encodeURIComponent(next)}` },
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

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({ email: parsed.data.email, token: parsed.data.token, type: parsed.data.type });
  if (error) return { error: authErrorMessage(error) };
  redirect(parsed.data.type === "recovery" ? "/reset-password" : safeNext(formData.get("next")));
}

export async function resendOtpAction(address: string, type: OtpType): Promise<FormState> {
  if (!isSupabaseConfigured) return { error: NOT_CONFIGURED };
  const parsed = email.safeParse(address);
  if (!parsed.success) return { error: "بريد غير صحيح" };
  const supabase = await createSupabaseServerClient();
  const { error } =
    type === "signup"
      ? await supabase.auth.resend({ type: "signup", email: parsed.data })
      : type === "recovery"
        ? await supabase.auth.resetPasswordForEmail(parsed.data)
        : await supabase.auth.signInWithOtp({ email: parsed.data, options: { shouldCreateUser: false } });
  if (error) return { error: authErrorMessage(error) };
  return { message: "أرسلنا كودًا جديدًا إلى بريدك." };
}

export async function forgotPasswordAction(_: FormState | undefined, formData: FormData): Promise<FormState> {
  if (!isSupabaseConfigured) return { error: NOT_CONFIGURED };
  const parsed = z.object({ email }).safeParse({ email: formData.get("email") });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email);
  // Same response whether or not the account exists, so the form can't be used to probe emails.
  if (error && error.code !== "user_not_found") return { error: authErrorMessage(error) };
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
    await supabase.auth.signOut();
  }
  redirect("/");
}
