"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/features/auth/session";
import type { FormState } from "@/features/auth/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const FAILED = "تعذّر تنفيذ العملية.";
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "اختر التاريخ");
const optionalUrl = z
  .string()
  .trim()
  .refine((value) => value === "" || /^https:\/\/\S+$/.test(value), "الرابط يبدأ بـ https://");

const sponsorSchema = z
  .object({
    name: z.string().trim().min(2, "اكتب اسم الراعي").max(80, "الاسم طويل جدًا"),
    message: z.string().trim().min(2, "اكتب رسالة الرعاية").max(160, "الرسالة ١٦٠ حرفًا بحد أقصى"),
    link_url: optionalUrl,
    logo_url: optionalUrl,
    starts_on: isoDate,
    ends_on: isoDate,
  })
  .refine((value) => value.ends_on >= value.starts_on, { path: ["ends_on"], message: "تاريخ النهاية بعد تاريخ البداية" });

function revalidateSponsors() {
  revalidatePath("/admin/sponsors");
}

/** Adds a sponsor for the mobile app's home card (sponsors table; admins only by RLS). */
export async function createSponsorAction(_: FormState | undefined, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = sponsorSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { fieldErrors };
  }
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("sponsors").insert({
    name: parsed.data.name,
    message: parsed.data.message,
    link_url: parsed.data.link_url || null,
    logo_url: parsed.data.logo_url || null,
    starts_on: parsed.data.starts_on,
    ends_on: parsed.data.ends_on,
    active: formData.get("active") === "on",
  });
  if (error) return { error: FAILED };
  revalidateSponsors();
  return { message: "أُضيف الراعي، ويظهر في التطبيق خلال مدته." };
}

export async function setSponsorActiveAction(sponsorId: string, active: boolean): Promise<FormState> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("sponsors").update({ active }).eq("id", sponsorId);
  if (error) return { error: FAILED };
  revalidateSponsors();
  return { message: active ? "ظهر الراعي في التطبيق." : "أُوقف ظهور الراعي." };
}

export async function deleteSponsorAction(sponsorId: string): Promise<FormState> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("sponsors").delete().eq("id", sponsorId);
  if (error) return { error: FAILED };
  revalidateSponsors();
  return { message: "حُذف الراعي." };
}
