import type { Metadata } from "next";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { toArabicDigits } from "@/lib/arabic";
import { requireAdmin } from "@/features/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/features/admin/UserBits";
import { siteOrigin } from "@/features/announcements/links";
import { localDate, reminderDay } from "@/features/reminders/dates";
import { OCCASIONS, occasionByKey } from "@/features/reminders/occasions";
import { reminderContext, upcomingReminders } from "@/features/reminders/schedule";
import { ReminderSettingsForm, TestReminderButton } from "@/features/reminders/ReminderAdmin";
import { renderReminderEmail } from "@/lib/mail/reminderEmail";

export const metadata: Metadata = { title: "التذكيرات" };

const DAY_FORMAT = new Intl.DateTimeFormat("ar-EG", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const SLOT_LABEL = { morning: "صباحًا", evening: "مساءً" } as const;
const STATUS_LABEL = { running: "جارٍ الإرسال…", done: "اكتمل", quota: "توقف (حد Gmail)" } as const;

export default async function AdminRemindersPage({ searchParams }: PageProps<"/admin/reminders">) {
  const session = await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const [{ data: settings }, { data: runs }, origin, params] = await Promise.all([
    supabase.from("app_settings").select("reminders_enabled, hijri_offset, disabled_occasions, facebook_url").eq("id", true).maybeSingle(),
    supabase
      .from("reminder_runs")
      .select("id, occasion_key, recipient_count, sent_count, failed_count, status, started_at, finished_at")
      .order("started_at", { ascending: false })
      .limit(20),
    siteOrigin(),
    searchParams,
  ]);

  const hijriOffset = settings?.hijri_offset ?? 0;
  const disabled = new Set(settings?.disabled_occasions ?? []);
  const today = localDate();
  const todayHijri = reminderDay(today, hijriOffset).hijri;
  const upcoming = upcomingReminders(today, 30, hijriOffset);

  const previewKey = typeof params.preview === "string" ? params.preview : undefined;
  const preview = (previewKey && occasionByKey(previewKey)) || upcoming[0]?.occasion || OCCASIONS[0]!;
  const { html } = renderReminderEmail(preview.content(reminderContext(today, hijriOffset)), {
    siteUrl: origin,
    recipientName: session.profile.full_name,
    facebookUrl: settings?.facebook_url ?? null,
    unsubscribeUrl: `${origin}/account`,
  });

  return (
    <div className="space-y-6">
      <section className="rounded-4xl border border-line bg-white p-6 shadow-soft">
        <h2 className="mb-1 text-xl font-bold text-emerald-deep">تذكيرات الأيام المميزة</h2>
        <p className="mb-5 text-sm text-muted">
          تُرسل تلقائيًا مرتين يوميًا: صباحًا (الجمعة) ومساءً (الصيام والمواسم في اليوم التالي)، ورسالة واحدة على الأكثر لكل مستخدم في
          اليوم. التاريخ الهجري اليوم بعد الضبط: {toArabicDigits(todayHijri.day)} {todayHijri.monthName} {toArabicDigits(todayHijri.year)}{" "}
          هـ.
        </p>
        <ReminderSettingsForm
          enabled={settings?.reminders_enabled ?? true}
          hijriOffset={hijriOffset}
          occasions={OCCASIONS.map((occasion) => ({ key: occasion.key, label: occasion.label, enabled: !disabled.has(occasion.key) }))}
        />
      </section>

      <section aria-labelledby="upcoming-title" className="overflow-x-auto rounded-3xl border border-line bg-white shadow-soft">
        <h2 id="upcoming-title" className="px-6 pt-5 text-xl font-bold text-emerald-deep">
          الثلاثون يومًا القادمة
        </h2>
        <table className="mt-3 w-full min-w-2xl text-sm">
          <thead className="bg-ivory text-xs text-muted">
            <tr>
              <th className="px-4 py-3 text-start font-bold">اليوم</th>
              <th className="px-4 py-3 text-start font-bold">الوقت</th>
              <th className="px-4 py-3 text-start font-bold">المناسبة</th>
              <th className="px-4 py-3 text-start font-bold">معاينة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {upcoming.map(({ date, slot, occasion }) => (
              <tr key={`${date}-${slot}`} className={disabled.has(occasion.key) ? "text-muted line-through" : undefined}>
                <td className="px-4 py-3">{DAY_FORMAT.format(new Date(`${date}T12:00:00Z`))}</td>
                <td className="px-4 py-3 text-muted">{SLOT_LABEL[slot]}</td>
                <td className="px-4 py-3 font-bold">{occasion.label}</td>
                <td className="px-4 py-3">
                  <Link
                    href={{ pathname: "/admin/reminders", query: { preview: occasion.key } }}
                    scroll={false}
                    className="font-bold text-emerald hover:underline"
                  >
                    عرض
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {upcoming.length === 0 && <p className="p-6 text-center text-muted">لا توجد مناسبات في هذه الفترة.</p>}
      </section>

      <section className="rounded-4xl border border-line bg-white p-6 shadow-soft">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-emerald-deep">معاينة: {preview.label}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {OCCASIONS.map((occasion) => (
                <Link
                  key={occasion.key}
                  href={{ pathname: "/admin/reminders", query: { preview: occasion.key } }}
                  scroll={false}
                  aria-current={occasion.key === preview.key ? "page" : undefined}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-bold",
                    occasion.key === preview.key ? "bg-emerald-deep text-white" : "border border-line hover:bg-emerald-mist",
                  )}
                >
                  {occasion.label}
                </Link>
              ))}
            </div>
          </div>
          <TestReminderButton key={preview.key} occasionKey={preview.key} />
        </div>
        <iframe
          title="معاينة التذكير"
          srcDoc={html}
          sandbox=""
          className="h-[70vh] min-h-[32rem] w-full rounded-3xl border border-line bg-[#f3ecdc]"
        />
      </section>

      <section aria-labelledby="runs-title" className="overflow-x-auto rounded-3xl border border-line bg-white shadow-soft">
        <h2 id="runs-title" className="px-6 pt-5 text-xl font-bold text-emerald-deep">
          سجل الإرسال
        </h2>
        <table className="mt-3 w-full min-w-2xl text-sm">
          <thead className="bg-ivory text-xs text-muted">
            <tr>
              <th className="px-4 py-3 text-start font-bold">المناسبة</th>
              <th className="px-4 py-3 text-start font-bold">بدأ</th>
              <th className="px-4 py-3 text-start font-bold">انتهى</th>
              <th className="px-4 py-3 text-start font-bold">وصلت</th>
              <th className="px-4 py-3 text-start font-bold">تعذّرت</th>
              <th className="px-4 py-3 text-start font-bold">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {(runs ?? []).map((run) => (
              <tr key={run.id}>
                <td className="px-4 py-3 font-bold">{occasionByKey(run.occasion_key)?.label ?? run.occasion_key}</td>
                <td className="px-4 py-3 text-muted">{formatDateTime(run.started_at)}</td>
                <td className="px-4 py-3 text-muted">{run.finished_at ? formatDateTime(run.finished_at) : "—"}</td>
                <td className="px-4 py-3">
                  {toArabicDigits(run.sent_count)} من {toArabicDigits(run.recipient_count)}
                </td>
                <td className={run.failed_count ? "px-4 py-3 font-bold text-rose" : "px-4 py-3 text-muted"}>
                  {toArabicDigits(run.failed_count)}
                </td>
                <td className={run.status === "quota" ? "px-4 py-3 font-bold text-rose" : "px-4 py-3"}>{STATUS_LABEL[run.status]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {(runs ?? []).length === 0 && <p className="p-6 text-center text-muted">لم تُرسل تذكيرات بعد.</p>}
      </section>
    </div>
  );
}
