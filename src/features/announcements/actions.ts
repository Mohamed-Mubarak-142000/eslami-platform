"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin, requireSession } from "@/features/auth/session";
import type { FormState } from "@/features/auth/actions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { renderAnnouncementEmail, type AnnouncementContent } from "@/lib/mail/announcementEmail";
import { isMailConfigured, isQuotaError, sendBulkMail, sendMail, type MailMessage } from "@/lib/mail/smtp";
import { toArabicDigits } from "@/lib/arabic";
import { isValidUnsubscribeToken, oneClickUnsubscribeUrl, parseMailingList, siteOrigin, unsubscribeUrl } from "./links";
import { MAX_RECIPIENTS } from "./limits";

const FAILED = "تعذّر تنفيذ العملية.";

const lines = (value: string) =>
  value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .refine((value) => value === "" || /^https:\/\/\S+$/.test(value), "رابط يبدأ بـ https://");

const announcementSchema = z.object({
  subject: z.string().trim().min(3, "العنوان قصير جدًا").max(150, "العنوان طويل جدًا"),
  preheader: z.string().trim().max(150, "سطر المعاينة طويل جدًا"),
  title: z.string().trim().min(3, "العنوان الرئيسي قصير جدًا").max(120, "العنوان الرئيسي طويل جدًا"),
  intro: z.string().trim().min(10, "اكتب مقدمة قصيرة عن الميزة").max(1500, "المقدمة طويلة جدًا"),
  what: z.string().trim().max(1500, "النص طويل جدًا"),
  steps: z
    .string()
    .max(3000)
    .transform(lines)
    .pipe(z.array(z.string().max(300, "خطوة طويلة جدًا")).max(8, "٨ خطوات بحد أقصى")),
  benefits: z
    .string()
    .max(3000)
    .transform(lines)
    .pipe(z.array(z.string().max(300, "نقطة طويلة جدًا")).max(8, "٨ نقاط بحد أقصى")),
  ctaLabel: z.string().trim().max(40, "نص الزر طويل جدًا"),
  ctaUrl: optionalUrl,
});

type ParsedAnnouncement = z.infer<typeof announcementSchema>;

function parseAnnouncement(formData: FormData): { data: ParsedAnnouncement } | { state: FormState } {
  const raw = Object.fromEntries(Object.keys(announcementSchema.shape).map((key) => [key, String(formData.get(key) ?? "")]));
  const parsed = announcementSchema.safeParse(raw);
  if (parsed.success) return { data: parsed.data };
  const fieldErrors: Record<string, string> = {};
  for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
  return { state: { fieldErrors, error: "راجع الحقول المظللة." } };
}

function toContent(data: ParsedAnnouncement): AnnouncementContent {
  return {
    title: data.title,
    intro: data.intro,
    steps: data.steps,
    benefits: data.benefits,
    ...(data.preheader && { preheader: data.preheader }),
    ...(data.what && { what: data.what }),
    ...(data.ctaLabel && { ctaLabel: data.ctaLabel }),
    ...(data.ctaUrl && { ctaUrl: data.ctaUrl }),
  };
}

async function facebookUrl(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("app_settings").select("facebook_url").eq("id", true).maybeSingle();
  return data?.facebook_url ?? null;
}

interface Recipient {
  id: string;
  email: string;
  full_name: string;
}

function buildMessage(
  recipient: Recipient,
  subject: string,
  content: AnnouncementContent,
  origin: string,
  facebook: string | null,
): MailMessage {
  const unsubscribe = unsubscribeUrl(origin, recipient.id);
  const rendered = renderAnnouncementEmail(content, {
    subject,
    siteUrl: origin,
    recipientName: recipient.full_name,
    facebookUrl: facebook,
    unsubscribeUrl: unsubscribe,
  });
  return {
    to: recipient.email,
    ...rendered,
    // Lets Gmail show its own "Unsubscribe" link, and unsubscribe in one click (RFC 8058).
    headers: {
      "List-Unsubscribe": `<${oneClickUnsubscribeUrl(origin, recipient.id)}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  };
}

/** Sends the draft to the signed-in admin only, to check it in a real inbox first. */
export async function sendTestAnnouncementAction(_: FormState | undefined, formData: FormData): Promise<FormState> {
  const session = await requireAdmin();
  if (!isMailConfigured()) return { error: "إعدادات البريد (SMTP) غير مضبوطة." };
  const parsed = parseAnnouncement(formData);
  if ("state" in parsed) return parsed.state;
  const [origin, facebook] = await Promise.all([siteOrigin(), facebookUrl()]);
  const me: Recipient = { id: session.userId, email: session.email, full_name: session.profile.full_name };
  try {
    await sendMail(buildMessage(me, `[تجربة] ${parsed.data.subject}`, toContent(parsed.data), origin, facebook));
  } catch (error) {
    console.error("Test announcement failed", error);
    return {
      error: isQuotaError(error) ? "وصل Gmail لحد الإرسال اليومي، جرّب بعد ٢٤ ساعة." : "تعذّر إرسال النسخة التجريبية.",
    };
  }
  return { message: `أُرسلت نسخة تجريبية إلى ${session.email}.` };
}

export async function sendAnnouncementAction(_: FormState | undefined, formData: FormData): Promise<FormState> {
  const session = await requireAdmin();
  if (!isMailConfigured()) return { error: "إعدادات البريد (SMTP) غير مضبوطة." };
  const parsed = parseAnnouncement(formData);
  if ("state" in parsed) return parsed.state;

  const audience = formData.get("audience") === "selected" ? "selected" : "all";
  const selected = formData.getAll("recipient").map(String);
  if (audience === "selected") {
    if (selected.length === 0) return { error: "اختر مستلمًا واحدًا على الأقل." };
    if (!selected.every((id) => z.string().uuid().safeParse(id).success)) return { error: FAILED };
  }

  const admin = createSupabaseAdminClient();
  let request = admin
    .from("profiles")
    .select("id, email, full_name")
    .eq("disabled", false)
    .eq("email_updates", true)
    .not("email", "is", null);
  if (audience === "selected") request = request.in("id", selected);
  const { data: rows, error: listError } = await request.limit(MAX_RECIPIENTS + 1);
  if (listError) return { error: FAILED };
  const recipients = (rows ?? []).filter((row): row is Recipient => Boolean(row.email));
  if (recipients.length === 0) return { error: "لا يوجد مستلمون يقبلون رسائل التحديثات." };
  if (recipients.length > MAX_RECIPIENTS) {
    return { error: `الحد الأقصى ${toArabicDigits(MAX_RECIPIENTS)} مستلم في المرة بسبب حد Gmail اليومي.` };
  }

  const content = toContent(parsed.data);
  const { data: log, error: logError } = await admin
    .from("announcements")
    .insert({ subject: parsed.data.subject, content, sent_by: session.userId, recipient_count: recipients.length })
    .select("id")
    .single();
  if (logError) return { error: FAILED };

  const [origin, facebook] = await Promise.all([siteOrigin(), facebookUrl()]);
  const result = await sendBulkMail(recipients.map((recipient) => buildMessage(recipient, parsed.data.subject, content, origin, facebook)));
  await admin
    .from("announcements")
    .update({ sent_count: result.sent, failed_count: result.failed.length, finished_at: new Date().toISOString() })
    .eq("id", log.id);
  revalidatePath("/admin/emails");

  const summary = `أُرسلت الرسالة إلى ${toArabicDigits(result.sent)} من ${toArabicDigits(recipients.length)} مستلم.`;
  if (result.stoppedByQuota) return { error: `${summary} توقف الإرسال لأن Gmail وصل لحده اليومي.` };
  if (result.failed.length) return { error: `${summary} تعذّر الإرسال إلى: ${result.failed.join("، ")}` };
  return { message: summary };
}

const facebookSchema = z.object({
  facebook_url: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || /^https:\/\/([a-z0-9-]+\.)?(facebook|fb)\.com\/\S+$/i.test(value),
      "رابط صفحة فيسبوك يبدأ بـ https://www.facebook.com/",
    ),
});

export async function updateFacebookUrlAction(_: FormState | undefined, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = facebookSchema.safeParse({ facebook_url: formData.get("facebook_url") ?? "" });
  if (!parsed.success) return { fieldErrors: { facebook_url: parsed.error.issues[0]!.message } };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("app_settings")
    .update({ facebook_url: parsed.data.facebook_url || null, updated_at: new Date().toISOString() })
    .eq("id", true);
  if (error) return { error: FAILED };
  revalidatePath("/admin/emails");
  return { message: parsed.data.facebook_url ? "حُفظ رابط فيسبوك." : "أُزيل رابط فيسبوك من الرسائل." };
}

/** The account page switch. */
export async function setEmailUpdatesAction(enabled: boolean): Promise<FormState> {
  const session = await requireSession("/account");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("profiles").update({ email_updates: enabled }).eq("id", session.userId);
  if (error) return { error: "تعذّر حفظ التغيير." };
  revalidatePath("/account");
  return { message: enabled ? "ستصلك رسائل التحديثات." : "لن تصلك رسائل التحديثات بعد الآن." };
}

/** The signed link in every email; works without signing in. `list` picks which emails stop. */
export async function unsubscribeAction(userId: string, token: string, listValue?: string): Promise<FormState> {
  const list = parseMailingList(listValue);
  if (!z.string().uuid().safeParse(userId).success || !isValidUnsubscribeToken(userId, token, list)) {
    return { error: "رابط إلغاء الاشتراك غير صالح." };
  }
  const changes = list === "reminders" ? { remind_friday: false, remind_fasting: false, remind_seasons: false } : { email_updates: false };
  const { error } = await createSupabaseAdminClient().from("profiles").update(changes).eq("id", userId);
  if (error) return { error: FAILED };
  return { message: list === "reminders" ? "تم. لن تصلك تذكيرات الأيام المميزة بعد الآن." : "تم. لن تصلك رسائل التحديثات بعد الآن." };
}
