"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ACTIVE_LEARNER_COOKIE, requireSession } from "@/features/auth/session";
import { authErrorMessage } from "@/features/auth/errors";
import type { FormState } from "@/features/auth/actions";

const MAX_CHILDREN = 8;
const GENERIC_ERROR = "تعذّر حفظ التغييرات، حاول مرة أخرى.";

function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    result[key] ??= issue.message;
  }
  return result;
}

const nameSchema = z.string().trim().min(2, "الاسم قصير جدًا").max(60, "الاسم طويل جدًا");
const birthYearSchema = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : Number(value)))
  .refine(
    (value) => value === null || (Number.isInteger(value) && value >= 1990 && value <= new Date().getFullYear()),
    "سنة الميلاد غير صحيحة",
  );

const profileSchema = z.object({ fullName: nameSchema, certificateName: nameSchema });

export async function updateProfileAction(_: FormState | undefined, formData: FormData): Promise<FormState> {
  const session = await requireSession("/account");
  const parsed = profileSchema.safeParse({ fullName: formData.get("fullName"), certificateName: formData.get("certificateName") });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.fullName, certificate_name: parsed.data.certificateName })
    .eq("id", session.userId);
  if (error) return { error: GENERIC_ERROR };
  revalidatePath("/", "layout");
  return { message: "تم حفظ بياناتك." };
}

const passwordSchema = z
  .object({ password: z.string().min(8, "كلمة المرور ٨ أحرف على الأقل").max(72, "كلمة المرور طويلة جدًا"), confirm: z.string() })
  .refine((value) => value.password === value.confirm, { message: "كلمتا المرور غير متطابقتين", path: ["confirm"] });

export async function changePasswordAction(_: FormState | undefined, formData: FormData): Promise<FormState> {
  await requireSession("/account");
  const parsed = passwordSchema.safeParse({ password: formData.get("password"), confirm: formData.get("confirm") });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: authErrorMessage(error) };
  return { message: "تم تغيير كلمة المرور." };
}

const childSchema = z.object({ displayName: nameSchema, birthYear: birthYearSchema });

export async function addChildAction(_: FormState | undefined, formData: FormData): Promise<FormState> {
  const session = await requireSession("/account");
  const parsed = childSchema.safeParse({ displayName: formData.get("displayName"), birthYear: formData.get("birthYear") ?? "" });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  if (session.learners.filter((learner) => learner.kind === "child").length >= MAX_CHILDREN) {
    return { error: `يمكن إضافة ${MAX_CHILDREN} أطفال بحدّ أقصى.` };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("learners")
    .insert({ owner_id: session.userId, kind: "child", display_name: parsed.data.displayName, birth_year: parsed.data.birthYear });
  if (error) return { error: GENERIC_ERROR };
  revalidatePath("/", "layout");
  return { message: `أُضيف ${parsed.data.displayName} إلى حسابك.` };
}

export async function updateChildAction(_: FormState | undefined, formData: FormData): Promise<FormState> {
  const session = await requireSession("/account");
  const learnerId = String(formData.get("learnerId") ?? "");
  const child = session.learners.find((learner) => learner.id === learnerId && learner.kind === "child");
  if (!child) return { error: GENERIC_ERROR };
  const parsed = childSchema.safeParse({ displayName: formData.get("displayName"), birthYear: formData.get("birthYear") ?? "" });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("learners")
    .update({ display_name: parsed.data.displayName, birth_year: parsed.data.birthYear })
    .eq("id", child.id);
  if (error) return { error: GENERIC_ERROR };
  revalidatePath("/", "layout");
  return { message: "تم الحفظ." };
}

export async function removeChildAction(learnerId: string): Promise<FormState> {
  const session = await requireSession("/account");
  const child = session.learners.find((learner) => learner.id === learnerId && learner.kind === "child");
  if (!child) return { error: GENERIC_ERROR };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("learners").delete().eq("id", child.id);
  if (error) return { error: GENERIC_ERROR };

  const store = await cookies();
  if (store.get(ACTIVE_LEARNER_COOKIE)?.value === child.id) store.delete(ACTIVE_LEARNER_COOKIE);
  revalidatePath("/", "layout");
  return { message: `حُذف ملف ${child.display_name} وكل تقدّمه.` };
}

const DELETE_CONFIRMATION = "حذف";

export async function deleteAccountAction(_: FormState | undefined, formData: FormData): Promise<FormState> {
  const session = await requireSession("/account");
  if (String(formData.get("confirm") ?? "").trim() !== DELETE_CONFIRMATION) {
    return { fieldErrors: { confirm: `اكتب "${DELETE_CONFIRMATION}" للتأكيد` } };
  }

  // Deleting the auth user cascades to the profile, learners and every progress row.
  const { error } = await createSupabaseAdminClient().auth.admin.deleteUser(session.userId);
  if (error) return { error: GENERIC_ERROR };

  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  (await cookies()).delete(ACTIVE_LEARNER_COOKIE);
  redirect("/?account=deleted");
}
