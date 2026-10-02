import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
/** Expo accepts at most 100 messages per request. */
const BATCH = 100;

export interface PushMessage {
  title: string;
  body: string;
  /** In-app route the notification opens, e.g. "/adhkar". */
  url?: string | undefined;
}

interface ExpoTicket {
  status: "ok" | "error";
  details?: { error?: string };
}

/**
 * Sends one message to every mobile device of these users, through Expo's push service.
 * Tokens Expo reports as DeviceNotRegistered (app uninstalled) are deleted. Never throws: pushes are
 * a bonus on top of the email, and a push outage must not fail the email run.
 */
export async function sendPushToUsers(userIds: string[], message: PushMessage): Promise<{ sent: number; failed: number }> {
  if (userIds.length === 0) return { sent: 0, failed: 0 };
  const admin = createSupabaseAdminClient();
  const tokens: string[] = [];
  // .in() goes in the query string; chunk it to stay well under URL limits.
  for (let index = 0; index < userIds.length; index += 200) {
    const { data, error } = await admin
      .from("push_tokens")
      .select("token")
      .in("user_id", userIds.slice(index, index + 200));
    if (error) {
      console.error("Reading push tokens failed", error);
      return { sent: 0, failed: 0 };
    }
    tokens.push(...(data ?? []).map((row) => row.token));
  }

  let sent = 0;
  let failed = 0;
  const dead: string[] = [];
  const headers: Record<string, string> = { "content-type": "application/json", accept: "application/json" };
  if (process.env.EXPO_ACCESS_TOKEN) headers.authorization = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`;

  for (let index = 0; index < tokens.length; index += BATCH) {
    const batch = tokens.slice(index, index + BATCH);
    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(
          batch.map((to) => ({
            to,
            title: message.title,
            body: message.body,
            sound: "default",
            channelId: "reminders",
            data: message.url ? { url: message.url } : {},
          })),
        ),
      });
      if (!response.ok) throw new Error(`Expo push answered ${response.status}`);
      const { data: tickets } = (await response.json()) as { data: ExpoTicket[] };
      tickets.forEach((ticket, position) => {
        if (ticket.status === "ok") sent += 1;
        else {
          failed += 1;
          if (ticket.details?.error === "DeviceNotRegistered") dead.push(batch[position]!);
        }
      });
    } catch (error) {
      console.error("Expo push batch failed", error);
      failed += batch.length;
    }
  }

  if (dead.length) await admin.from("push_tokens").delete().in("token", dead);
  return { sent, failed };
}
