import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ReminderRunStatus, ReminderSlot } from "@/lib/supabase/database.types";
import { renderReminderEmail } from "@/lib/mail/reminderEmail";
import { isMailConfigured, sendBulkMail, type MailMessage } from "@/lib/mail/smtp";
import { sendPushToUsers } from "@/lib/push/expo";
import { oneClickUnsubscribeUrl, unsubscribeUrl } from "@/features/announcements/links";
import type { ReminderContent } from "./occasions";
import { TOPIC_COLUMN } from "./topics";
import { pickOccasion, reminderContext } from "./schedule";

/** Vercel stops the function at 300 s; stop starting new messages well before that. */
const TIME_BUDGET_MS = 240_000;
const MAX_RECIPIENTS = 5000;

export interface Recipient {
  id: string;
  email: string;
  full_name: string;
}

export function buildReminderMessage(
  recipient: Recipient,
  content: ReminderContent,
  origin: string,
  facebookUrl: string | null,
): MailMessage {
  const rendered = renderReminderEmail(content, {
    siteUrl: origin,
    recipientName: recipient.full_name,
    facebookUrl,
    unsubscribeUrl: unsubscribeUrl(origin, recipient.id, "reminders"),
  });
  return {
    to: recipient.email,
    ...rendered,
    // Gmail's own "Unsubscribe" link, one click (RFC 8058); it turns off reminders only.
    headers: {
      "List-Unsubscribe": `<${oneClickUnsubscribeUrl(origin, recipient.id, "reminders")}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  };
}

export interface ReminderRunResult {
  date: string;
  slot: ReminderSlot;
  occasion: string | null;
  /** Why nothing was sent, when nothing was. */
  skipped?: "disabled" | "no-occasion" | "already-done" | "no-recipients";
  dryRun: boolean;
  recipients: number;
  sent: number;
  failed: number;
  /** Still to send after this call; the caller calls again while it is above zero. */
  remaining: number;
  status?: ReminderRunStatus;
}

interface RunOptions {
  date: string;
  slot: ReminderSlot;
  origin: string;
  dryRun: boolean;
  startedAt: number;
}

/**
 * Sends today's reminder for one slot. Safe to call repeatedly: the run row is unique per occasion
 * and day, and everyone already delivered is skipped, so a retry or a resumed call never re-sends.
 */
export async function runReminders({ date, slot, origin, dryRun, startedAt }: RunOptions): Promise<ReminderRunResult> {
  const base = { date, slot, dryRun, recipients: 0, sent: 0, failed: 0, remaining: 0 };
  const admin = createSupabaseAdminClient();

  const { data: settings, error: settingsError } = await admin
    .from("app_settings")
    .select("reminders_enabled, hijri_offset, disabled_occasions, facebook_url")
    .eq("id", true)
    .single();
  if (settingsError) throw settingsError;
  if (!settings.reminders_enabled) return { ...base, occasion: null, skipped: "disabled" };

  const occasion = pickOccasion(date, slot, {
    hijriOffset: settings.hijri_offset,
    disabledOccasions: settings.disabled_occasions,
  });
  if (!occasion) return { ...base, occasion: null, skipped: "no-occasion" };
  const content = occasion.content(reminderContext(date, settings.hijri_offset));

  const { data: rows, error: listError } = await admin
    .from("profiles")
    .select("id, email, full_name")
    .eq("disabled", false)
    .eq(TOPIC_COLUMN[occasion.topic], true)
    .not("email", "is", null)
    .order("created_at")
    .limit(MAX_RECIPIENTS);
  if (listError) throw listError;
  const recipients = (rows ?? []).filter((row): row is Recipient => Boolean(row.email));
  const result = { ...base, occasion: occasion.key, recipients: recipients.length };
  if (recipients.length === 0) return { ...result, skipped: "no-recipients" };
  if (dryRun) return { ...result, remaining: recipients.length };
  if (!isMailConfigured()) throw new Error("SMTP is not configured");

  const run = await findOrCreateRun(occasion.key, date, slot);
  if (run.status === "done") return { ...result, skipped: "already-done", status: "done" };
  // Pushes go out once, from the call that created the run; a resumed call only continues the emails.
  if (run.fresh) {
    const push = await sendPushToUsers(
      recipients.map((recipient) => recipient.id),
      { title: content.subject, body: content.preheader, url: appRoute(content.actions[0]?.href) },
    );
    if (push.sent || push.failed) console.info("Reminder pushes", occasion.key, push);
  }

  const { data: deliveries, error: deliveriesError } = await admin
    .from("reminder_deliveries")
    .select("user_id")
    .eq("run_id", run.id)
    .limit(MAX_RECIPIENTS);
  if (deliveriesError) throw deliveriesError;
  const delivered = new Set((deliveries ?? []).map((row) => row.user_id));
  const pending = recipients.filter((recipient) => !delivered.has(recipient.id));

  let attempted = 0;
  const outcome = await sendBulkMail(
    pending.map((recipient) => buildReminderMessage(recipient, content, origin, settings.facebook_url)),
    {
      deadline: startedAt + TIME_BUDGET_MS,
      onProgress: (done) => (attempted = done),
      // Recorded one by one, so a function killed mid-run still knows who already got it.
      onSent: async (index) => {
        const { error } = await admin.from("reminder_deliveries").insert({ run_id: run.id, user_id: pending[index]!.id });
        if (error) console.error("Recording reminder delivery failed", error);
      },
    },
  );

  const remaining = outcome.stoppedByDeadline ? pending.length - attempted : 0;
  const status: ReminderRunStatus = outcome.stoppedByQuota ? "quota" : remaining > 0 ? "running" : "done";
  await admin
    .from("reminder_runs")
    .update({
      recipient_count: recipients.length,
      sent_count: delivered.size + outcome.sent,
      failed_count: outcome.failed.length,
      status,
      finished_at: status === "running" ? null : new Date().toISOString(),
    })
    .eq("id", run.id);

  return { ...result, sent: outcome.sent, failed: outcome.failed.length, remaining, status };
}

/** The mobile app's screen for a site path the reminder links to, when it has one. */
const APP_ROUTES: Record<string, string> = { "/adhkar": "/adhkar", "/quran": "/quran", "/prayer-times": "/prayer", "/listen": "/listen" };
function appRoute(href: string | undefined): string | undefined {
  return href ? APP_ROUTES[href.split(/[?#]/)[0]!] : undefined;
}

async function findOrCreateRun(occasionKey: string, date: string, slot: ReminderSlot) {
  const admin = createSupabaseAdminClient();
  const { data: created, error } = await admin
    .from("reminder_runs")
    .insert({ occasion_key: occasionKey, run_date: date, slot })
    .select("id, status")
    .single();
  if (created) return { ...created, fresh: true };
  // 23505: another call already created today's run; continue it.
  if (error.code !== "23505") throw error;
  const { data: existing, error: readError } = await admin
    .from("reminder_runs")
    .select("id, status")
    .eq("occasion_key", occasionKey)
    .eq("run_date", date)
    .single();
  if (readError) throw readError;
  return { ...existing, fresh: false };
}
