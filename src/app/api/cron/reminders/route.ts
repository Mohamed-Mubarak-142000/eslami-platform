import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { siteOrigin } from "@/features/announcements/links";
import { isIsoDate, slotDate } from "@/features/reminders/dates";
import { runReminders } from "@/features/reminders/run";

// Sending goes out one message at a time; the run stops itself at ~240 s and reports `remaining`.
export const maxDuration = 300;

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/**
 * GET from Vercel Cron (vercel.json), on time; POST from the GitHub Action (.github/workflows/reminders.yml),
 * kept as a backup and for manual runs. Both send "Authorization: Bearer CRON_SECRET", and a second call
 * for the same day only continues what is left, so the two never double-send.
 * /api/cron/reminders?slot=morning|evening[&date=YYYY-MM-DD][&dryRun=1]
 */
export const GET = run;
export const POST = run;

async function run(request: NextRequest) {
  const startedAt = Date.now();
  if (!authorized(request)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const params = request.nextUrl.searchParams;
  const slot = params.get("slot");
  if (slot !== "morning" && slot !== "evening") return NextResponse.json({ error: "slot must be morning or evening" }, { status: 400 });
  const dateParam = params.get("date");
  if (dateParam && !isIsoDate(dateParam)) return NextResponse.json({ error: "date must be YYYY-MM-DD" }, { status: 400 });

  try {
    const result = await runReminders({
      date: dateParam ?? slotDate(slot),
      slot,
      origin: await siteOrigin(),
      dryRun: params.get("dryRun") === "1",
      startedAt,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Reminder run failed", error);
    return NextResponse.json({ error: "run failed" }, { status: 500 });
  }
}
