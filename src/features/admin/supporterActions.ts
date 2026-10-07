"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/features/auth/session";
import type { FormState } from "@/features/auth/actions";
import { siteOrigin } from "@/features/announcements/links";
import { isMailConfigured, sendMail } from "@/lib/mail/smtp";
import { renderSupporterThanks } from "@/lib/mail/supporterEmail";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SUPPORTERS_TAG } from "@/features/support/supportInfo";

const FAILED = "تعذّر تنفيذ العملية.";
/** The private bucket the app uploads transfer screenshots to (supabase/migrations/20261007000001_supporters.sql). */
const RECEIPT_BUCKET = "donation_receipts";

const reasonSchema = z.string().trim().max(200, "السبب ٢٠٠ حرف بحد أقصى");

function revalidateSupporters() {
  revalidatePath("/admin/supporters");
  updateTag(SUPPORTERS_TAG);
}

async function facebookUrl(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("app_settings").select("facebook_url").eq("id", true).maybeSingle();
  return data?.facebook_url ?? null;
}

/** Sends the thank-you email; false when mail isn't set up or the send failed (the approval stands). */
async function thank(supporter: { id: string; user_id: string; display_name: string; amount: number }): Promise<boolean> {
  if (!isMailConfigured()) return false;
  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin.from("profiles").select("email, full_name").eq("id", supporter.user_id).maybeSingle();
  if (!profile?.email) return false;
  try {
    const [origin, facebook] = await Promise.all([siteOrigin(), facebookUrl()]);
    const mail = renderSupporterThanks({
      siteUrl: origin,
      recipientName: profile.full_name || supporter.display_name,
      amount: supporter.amount,
      facebookUrl: facebook,
    });
    await sendMail({ to: profile.email, ...mail });
    await admin.from("supporters").update({ thanked_at: new Date().toISOString() }).eq("id", supporter.id);
    return true;
  } catch (error) {
    console.error("Supporter thank-you email failed", error);
    return false;
  }
}

/** Confirms the transfer: the supporter shows on the app's home screen and gets a thank-you email. */
export async function approveSupporterAction(supporterId: string): Promise<FormState> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("supporters")
    .update({ status: "approved", reviewed_at: new Date().toISOString(), reject_reason: null })
    .eq("id", supporterId)
    .select("id, user_id, display_name, amount, thanked_at")
    .maybeSingle();
  if (error || !data) return { error: FAILED };
  revalidateSupporters();
  if (data.thanked_at) return { message: "تم القبول." };
  const sent = await thank(data);
  return sent ? { message: "تم القبول وأُرسلت رسالة الشكر." } : { error: "تم القبول، لكن تعذّر إرسال رسالة الشكر (راجع إعدادات البريد)." };
}

/** The transfer didn't arrive or doesn't match; the user sees the reason in the app and can send again. */
export async function rejectSupporterAction(supporterId: string, reason: string): Promise<FormState> {
  await requireAdmin();
  const parsed = reasonSchema.safeParse(reason);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? FAILED };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("supporters")
    .update({ status: "rejected", reviewed_at: new Date().toISOString(), reject_reason: parsed.data || null })
    .eq("id", supporterId);
  if (error) return { error: FAILED };
  revalidateSupporters();
  return { message: "تم الرفض." };
}

/** Removes the request and its screenshot. */
export async function deleteSupporterAction(supporterId: string): Promise<FormState> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("supporters").delete().eq("id", supporterId).select("receipt_path").maybeSingle();
  if (error) return { error: FAILED };
  if (data?.receipt_path) await createSupabaseAdminClient().storage.from(RECEIPT_BUCKET).remove([data.receipt_path]);
  revalidateSupporters();
  return { message: "حُذف الطلب." };
}
