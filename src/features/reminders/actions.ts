"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin, requireSession } from "@/features/auth/session";
import type { FormState } from "@/features/auth/actions";
import { siteOrigin } from "@/features/announcements/links";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isMailConfigured, isQuotaError, sendMail } from "@/lib/mail/smtp";
import { localDate } from "./dates";
import { OCCASIONS, occasionByKey } from "./occasions";
import { TOPIC_COLUMN, type ReminderTopic } from "./topics";
import { reminderContext } from "./schedule";
import { buildReminderMessage } from "./run";

const FAILED = "تعذّر حفظ التغيير.";

/** The account page switches, one per topic. */
export async function setReminderTopicAction(topic: ReminderTopic, enabled: boolean): Promise<FormState> {
  const session = await requireSession("/account");
  if (!Object.hasOwn(TOPIC_COLUMN, topic)) return { error: FAILED };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({ [TOPIC_COLUMN[topic]]: enabled } as Partial<Record<(typeof TOPIC_COLUMN)[ReminderTopic], boolean>>)
    .eq("id", session.userId);
  if (error) return { error: FAILED };
  revalidatePath("/account");
  return { message: enabled ? "ستصلك هذه التذكيرات." : "لن تصلك هذه التذكيرات بعد الآن." };
}

const settingsSchema = z.object({
  reminders_enabled: z.boolean(),
  hijri_offset: z.number().int().min(-2).max(2),
  enabled_occasions: z.array(z.string()),
});

export async function updateReminderSettingsAction(_: FormState | undefined, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = settingsSchema.safeParse({
    reminders_enabled: formData.get("reminders_enabled") === "on",
    hijri_offset: Number(formData.get("hijri_offset") ?? 0),
    enabled_occasions: formData.getAll("occasion").map(String),
  });
  if (!parsed.success) return { error: "راجع الإعدادات." };
  const enabled = new Set(parsed.data.enabled_occasions);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("app_settings")
    .update({
      reminders_enabled: parsed.data.reminders_enabled,
      hijri_offset: parsed.data.hijri_offset,
      disabled_occasions: OCCASIONS.filter((occasion) => !enabled.has(occasion.key)).map((occasion) => occasion.key),
      updated_at: new Date().toISOString(),
    })
    .eq("id", true);
  if (error) return { error: FAILED };
  revalidatePath("/admin/reminders");
  return { message: "حُفظت إعدادات التذكيرات." };
}

/** Sends one occasion's email to the signed-in admin only, to check it in a real inbox. */
export async function sendTestReminderAction(key: string): Promise<FormState> {
  const session = await requireAdmin();
  if (!isMailConfigured()) return { error: "إعدادات البريد (SMTP) غير مضبوطة." };
  const occasion = occasionByKey(key);
  if (!occasion) return { error: "مناسبة غير معروفة." };

  const supabase = await createSupabaseServerClient();
  const [{ data: settings }, origin] = await Promise.all([
    supabase.from("app_settings").select("hijri_offset, facebook_url").eq("id", true).maybeSingle(),
    siteOrigin(),
  ]);
  const content = occasion.content(reminderContext(localDate(), settings?.hijri_offset ?? 0));
  const message = buildReminderMessage(
    { id: session.userId, email: session.email, full_name: session.profile.full_name },
    { ...content, subject: `[تجربة] ${content.subject}` },
    origin,
    settings?.facebook_url ?? null,
  );
  try {
    await sendMail(message);
  } catch (error) {
    console.error("Test reminder failed", error);
    return {
      error: isQuotaError(error) ? "وصل Gmail لحد الإرسال اليومي، جرّب بعد ٢٤ ساعة." : "تعذّر إرسال النسخة التجريبية.",
    };
  }
  return { message: `أُرسلت نسخة تجريبية إلى ${session.email}.` };
}
