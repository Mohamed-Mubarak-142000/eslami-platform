"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/features/auth/session";
import type { FormState } from "@/features/auth/actions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const FAILED = "تعذّر تنفيذ العملية.";
/** The public bucket for logos (supabase/migrations/20261005000002_sponsor_logos.sql). */
const LOGO_BUCKET = "sponsors";
const LOGO_MAX_BYTES = 1024 * 1024;
const LOGO_TYPES: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

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
    starts_on: isoDate,
    ends_on: isoDate,
  })
  .refine((value) => value.ends_on >= value.starts_on, { path: ["ends_on"], message: "تاريخ النهاية بعد تاريخ البداية" });

function revalidateSponsors() {
  revalidatePath("/admin/sponsors");
  // The home page's "برعاية" section (features/home/HomeSponsors.tsx) shows the change on the next visit.
  updateTag("sponsors");
}

/** The uploaded logo file, or null when none was chosen; a string is the field's error. */
function readLogo(formData: FormData): File | null | string {
  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) return null;
  if (!LOGO_TYPES[file.type]) return "الشعار صورة PNG أو JPG أو WebP";
  if (file.size > LOGO_MAX_BYTES) return "حجم الشعار ١ ميجابايت بحد أقصى";
  return file;
}

/** Stored under a random name; returns its public URL. The service role writes after requireAdmin(). */
async function uploadLogo(file: File): Promise<string | null> {
  const storage = createSupabaseAdminClient().storage.from(LOGO_BUCKET);
  const path = `${randomUUID()}.${LOGO_TYPES[file.type]}`;
  const { error } = await storage.upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
  if (error) {
    console.error("Sponsor logo upload failed", error);
    return null;
  }
  return storage.getPublicUrl(path).data.publicUrl;
}

/** Removes a logo this page uploaded (logos from elsewhere are left alone). */
async function removeLogo(publicUrl: string | null) {
  const marker = `/storage/v1/object/public/${LOGO_BUCKET}/`;
  const at = publicUrl?.indexOf(marker) ?? -1;
  if (!publicUrl || at === -1) return;
  await createSupabaseAdminClient()
    .storage.from(LOGO_BUCKET)
    .remove([decodeURIComponent(publicUrl.slice(at + marker.length))]);
}

/** Adds a sponsor for the home "برعاية" section on the website and in the app (admins only). */
export async function createSponsorAction(_: FormState | undefined, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = sponsorSchema.safeParse(Object.fromEntries(formData));
  const logo = readLogo(formData);
  if (!parsed.success || typeof logo === "string") {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.success ? [] : parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    if (typeof logo === "string") fieldErrors.logo = logo;
    return { fieldErrors };
  }

  const logoUrl = logo ? await uploadLogo(logo) : null;
  if (logo && !logoUrl) return { fieldErrors: { logo: "تعذّر رفع الشعار، حاول مرة أخرى." } };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("sponsors").insert({
    name: parsed.data.name,
    message: parsed.data.message,
    link_url: parsed.data.link_url || null,
    logo_url: logoUrl,
    starts_on: parsed.data.starts_on,
    ends_on: parsed.data.ends_on,
    active: formData.get("active") === "on",
  });
  if (error) {
    await removeLogo(logoUrl);
    return { error: FAILED };
  }
  revalidateSponsors();
  return { message: "أُضيف الراعي، ويظهر في الموقع والتطبيق خلال مدته." };
}

export async function setSponsorActiveAction(sponsorId: string, active: boolean): Promise<FormState> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("sponsors").update({ active }).eq("id", sponsorId);
  if (error) return { error: FAILED };
  revalidateSponsors();
  return { message: active ? "ظهر الراعي في الموقع والتطبيق." : "أُوقف ظهور الراعي." };
}

/** Deletes the sponsor and its uploaded logo. */
export async function deleteSponsorAction(sponsorId: string): Promise<FormState> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("sponsors").delete().eq("id", sponsorId).select("logo_url").maybeSingle();
  if (error) return { error: FAILED };
  await removeLogo(data?.logo_url ?? null);
  revalidateSponsors();
  return { message: "حُذف الراعي." };
}
