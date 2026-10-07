"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { SupporterRow } from "@/lib/supabase/database.types";

/**
 * InstaPay donations (supabase/migrations/20261007000001_supporters.sql), sent the same way as from the
 * mobile app: the screenshot goes to the private donation_receipts bucket under the user's own folder,
 * then a pending row is added. RLS lets users add and read only their own.
 */

const RECEIPT_BUCKET = "donation_receipts";
const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;
const FAILED = "تعذّر إرسال طلبك الآن، حاول مرة أخرى بعد قليل.";
const EXTENSIONS: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/heic": "heic" };
export const RECEIPT_TYPES = Object.keys(EXTENSIONS).join(",");

export type MyDonation = Pick<SupporterRow, "id" | "status" | "reject_reason" | "amount" | "created_at">;

export interface NewDonation {
  amount: number;
  sender: string;
  displayName: string;
  message: string;
  showName: boolean;
  receipt: File | null;
}

/** Field problems in Arabic, or null when the form can be sent. Same rules as the table's checks. */
export function donationProblem(input: NewDonation): string | null {
  if (!Number.isInteger(input.amount) || input.amount < 1) return "اكتب المبلغ الذي حوّلته";
  if (input.amount > 1_000_000) return "المبلغ كبير جدًا";
  if (input.displayName.trim().length < 2) return "اكتب اسمك";
  if (input.displayName.trim().length > 60) return "الاسم طويل جدًا";
  if (input.sender.trim().length < 2) return "اكتب اسم أو رقم المحوِّل في إنستاباي";
  if (input.sender.trim().length > 60) return "اسم المحوِّل طويل جدًا";
  const message = input.message.trim();
  if (message.length === 1 || message.length > 140) return "الرسالة من حرفين إلى ١٤٠ حرفًا";
  if (!input.receipt) return "ارفع صورة التحويل";
  if (!EXTENSIONS[input.receipt.type]) return "اختر صورة بصيغة JPG أو PNG أو WEBP";
  if (input.receipt.size > MAX_RECEIPT_BYTES) return "حجم الصورة كبير، اختر صورة أصغر من ٥ ميجابايت.";
  return null;
}

export async function submitDonation(input: NewDonation): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase || !input.receipt) return { ok: false, error: FAILED };
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return { ok: false, error: "سجّل الدخول أولًا لإرسال دعمك." };

  const contentType = input.receipt.type;
  const path = `${userId}/${crypto.randomUUID()}.${EXTENSIONS[contentType]}`;
  const upload = await supabase.storage.from(RECEIPT_BUCKET).upload(path, input.receipt, { contentType, upsert: false });
  if (upload.error) return { ok: false, error: FAILED };

  const message = input.message.trim();
  const { error } = await supabase.from("supporters").insert({
    display_name: input.displayName.trim(),
    message: message || null,
    show_name: input.showName,
    amount: input.amount,
    sender: input.sender.trim(),
    receipt_path: path,
  });
  if (error) {
    // The user can't delete from the bucket; an orphaned screenshot in their own folder is harmless.
    return { ok: false, error: error.code === "23505" ? "لديك طلب قيد المراجعة بالفعل." : FAILED };
  }
  return { ok: true };
}

/** The signed-in user's latest request, and whether any of theirs was ever approved. */
export async function loadMyDonation(): Promise<{ latest: MyDonation | null; supporter: boolean }> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { latest: null, supporter: false };
  const [latest, approved] = await Promise.all([
    supabase
      .from("supporters")
      .select("id, status, reject_reason, amount, created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("supporters").select("id", { count: "exact", head: true }).eq("status", "approved"),
  ]);
  return { latest: latest.data ?? null, supporter: !approved.error && (approved.count ?? 0) > 0 };
}
