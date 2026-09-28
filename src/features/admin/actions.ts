"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/features/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { FormState } from "@/features/auth/actions";
import type { AppRole } from "@/lib/supabase/database.types";

const FAILED = "تعذّر تنفيذ العملية.";

export async function setUserDisabledAction(userId: string, disabled: boolean): Promise<FormState> {
  const session = await requireAdmin();
  if (userId === session.userId) return { error: "لا يمكنك إيقاف حسابك." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("profiles").update({ disabled }).eq("id", userId);
  if (error) return { error: FAILED };
  // Also ban at the auth level so existing sessions can't refresh and new sign-ins fail.
  await createSupabaseAdminClient().auth.admin.updateUserById(userId, { ban_duration: disabled ? "876000h" : "none" });
  revalidatePath("/admin/users", "layout");
  return { message: disabled ? "أُوقف الحساب." : "أُعيد تفعيل الحساب." };
}

/**
 * Permanently deletes an account: the auth user, and through cascades its profile, children,
 * progress, exam attempts and certificates. Admins must be demoted first, so one click can't
 * remove another administrator.
 */
export async function deleteUserAction(userId: string): Promise<FormState> {
  const session = await requireAdmin();
  if (!z.string().uuid().safeParse(userId).success) return { error: FAILED };
  if (userId === session.userId) return { error: "لا يمكنك حذف حسابك من هنا." };
  const supabase = await createSupabaseServerClient();
  const { data: target } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  if (!target) return { error: "الحساب غير موجود." };
  if (target.role === "admin") return { error: "أزِل صلاحية الإدارة أولًا ثم احذف الحساب." };
  const { error } = await createSupabaseAdminClient().auth.admin.deleteUser(userId);
  if (error) return { error: FAILED };
  revalidatePath("/admin", "layout");
  redirect("/admin/users");
}

export async function setUserRoleAction(userId: string, role: AppRole): Promise<FormState> {
  const session = await requireAdmin();
  if (userId === session.userId) return { error: "لا يمكنك تغيير دورك بنفسك." };
  if (role !== "user" && role !== "admin") return { error: FAILED };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) return { error: FAILED };
  revalidatePath("/admin/users", "layout");
  return { message: role === "admin" ? "أصبح مديرًا." : "أصبح مستخدمًا عاديًا." };
}

export async function setCertificateRevokedAction(certificateId: string, revoked: boolean): Promise<FormState> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("certificates")
    .update({ revoked_at: revoked ? new Date().toISOString() : null })
    .eq("id", certificateId);
  if (error) return { error: FAILED };
  revalidatePath("/admin/certificates");
  return { message: revoked ? "أُلغيت الشهادة." : "أُعيدت الشهادة." };
}

const settingsSchema = z.object({
  exam_question_count: z.coerce.number().int().min(5, "٥ أسئلة على الأقل").max(60, "٦٠ سؤالًا بحد أقصى"),
  exam_pass_percent: z.coerce.number().int().min(50, "٥٠٪ على الأقل").max(100, "١٠٠٪ بحد أقصى"),
  exam_minutes: z.coerce.number().int().min(5, "٥ دقائق على الأقل").max(180, "١٨٠ دقيقة بحد أقصى"),
  retry_cooldown_hours: z.coerce.number().int().min(0, "لا يقل عن صفر").max(720, "٧٢٠ ساعة بحد أقصى"),
});

export async function updateExamSettingsAction(_: FormState | undefined, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { fieldErrors };
  }
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("app_settings")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", true);
  if (error) return { error: FAILED };
  revalidatePath("/admin");
  return { message: "حُفظت إعدادات الاختبارات." };
}
