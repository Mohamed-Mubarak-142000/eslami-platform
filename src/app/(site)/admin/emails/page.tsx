import type { Metadata } from "next";
import { toArabicDigits } from "@/lib/arabic";
import { requireAdmin } from "@/features/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatArabicDate } from "@/features/progress/format";
import { AnnouncementComposer, type ComposerUser } from "@/features/announcements/AnnouncementComposer";
import { FacebookUrlForm } from "@/features/announcements/AnnouncementSettings";
import { siteOrigin } from "@/features/announcements/links";

export const metadata: Metadata = { title: "الرسائل" };

// Sending goes out one message at a time inside the server action; give it room on Vercel.
export const maxDuration = 300;

export default async function AdminEmailsPage() {
  const session = await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const [{ data: profiles }, { data: settings }, { data: history }, origin] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, full_name, email_updates")
      .eq("disabled", false)
      .not("email", "is", null)
      .order("full_name")
      .limit(2000),
    supabase.from("app_settings").select("facebook_url").eq("id", true).maybeSingle(),
    supabase
      .from("announcements")
      .select("id, subject, recipient_count, sent_count, failed_count, created_at, finished_at")
      .order("created_at", { ascending: false })
      .limit(20),
    siteOrigin(),
  ]);

  const users: ComposerUser[] = (profiles ?? []).map((profile) => ({
    id: profile.id,
    name: profile.full_name,
    email: profile.email ?? "",
    acceptsUpdates: profile.email_updates,
  }));
  const facebookUrl = settings?.facebook_url ?? null;

  return (
    <div className="space-y-6">
      <section className="rounded-4xl border border-line bg-white p-6 shadow-soft">
        <h2 className="mb-1 text-xl font-bold text-emerald-deep">رسالة عن ميزة جديدة</h2>
        <p className="mb-5 text-sm text-muted">
          اكتب الأقسام، وتظهر الرسالة بقالب المنارة في المعاينة. أرسل نسخة تجريبية لنفسك أولًا، ثم أرسلها للمستخدمين.
        </p>
        <AnnouncementComposer users={users} siteUrl={origin} facebookUrl={facebookUrl} adminName={session.profile.full_name} />
      </section>

      <section className="rounded-4xl border border-line bg-white p-6 shadow-soft">
        <h2 className="mb-1 text-xl font-bold text-emerald-deep">فيسبوك</h2>
        <p className="mb-5 text-sm text-muted">رابط واحد يُستخدم في كل الرسائل.</p>
        <FacebookUrlForm facebookUrl={facebookUrl} />
      </section>

      <section aria-labelledby="history-title" className="overflow-x-auto rounded-3xl border border-line bg-white shadow-soft">
        <h2 id="history-title" className="px-6 pt-5 text-xl font-bold text-emerald-deep">
          الرسائل السابقة
        </h2>
        <table className="mt-3 w-full min-w-2xl text-sm">
          <thead className="bg-ivory text-xs text-muted">
            <tr>
              <th className="px-4 py-3 text-start font-bold">الرسالة</th>
              <th className="px-4 py-3 text-start font-bold">التاريخ</th>
              <th className="px-4 py-3 text-start font-bold">وصلت</th>
              <th className="px-4 py-3 text-start font-bold">تعذّرت</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {(history ?? []).map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3 font-bold">{row.subject}</td>
                <td className="px-4 py-3 text-muted">{formatArabicDate(row.created_at)}</td>
                <td className="px-4 py-3">
                  {row.finished_at ? `${toArabicDigits(row.sent_count)} من ${toArabicDigits(row.recipient_count)}` : "جارٍ الإرسال…"}
                </td>
                <td className={row.failed_count ? "px-4 py-3 font-bold text-rose" : "px-4 py-3 text-muted"}>
                  {toArabicDigits(row.failed_count)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(history ?? []).length === 0 && <p className="p-6 text-center text-muted">لم تُرسل رسائل بعد.</p>}
      </section>
    </div>
  );
}
