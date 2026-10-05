import type { Metadata } from "next";
import { cn } from "@/lib/cn";
import { requireAdmin } from "@/features/auth/session";
import { planDay, shiftDay } from "@/features/plan/schedule";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AddSponsorForm, SponsorRowControls } from "@/features/admin/SponsorControls";

export const metadata: Metadata = { title: "الرعاة" };

const DATE = new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const formatDay = (day: string) => DATE.format(new Date(`${day}T00:00:00Z`));

/** Sponsors of the mobile app's home card: added here, shown in the app while their dates run. */
export default async function AdminSponsorsPage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("sponsors").select("*").order("starts_on", { ascending: false });
  const list = data ?? [];
  const today = planDay();

  const status = (sponsor: (typeof list)[number]) => {
    if (!sponsor.active) return { label: "موقوف", tone: "bg-line text-muted" };
    if (today < sponsor.starts_on) return { label: "قادم", tone: "bg-sky/15 text-sky" };
    if (today > sponsor.ends_on) return { label: "انتهى", tone: "bg-line text-muted" };
    return { label: "يظهر الآن", tone: "bg-emerald-mist text-emerald" };
  };

  return (
    <div className="space-y-6">
      <section className="rounded-4xl border border-line bg-white p-6 shadow-soft">
        <h2 className="mb-1 text-xl font-bold text-emerald-deep">إضافة راعٍ</h2>
        <p className="mb-5 text-sm text-muted">
          يظهر الراعي في كارت «برعاية» آخر الصفحة الرئيسية في تطبيق المنارة خلال المدة المحددة، ولا يظهر أبدًا في صفحات المصحف أو الأطفال.
          اختر جهات تليق بالمنصة.
        </p>
        <AddSponsorForm today={today} monthLater={shiftDay(today, 30)} />
      </section>

      <div className="overflow-x-auto rounded-3xl border border-line bg-white shadow-soft">
        <table className="w-full min-w-3xl text-sm">
          <thead className="bg-ivory text-xs text-muted">
            <tr>
              <th className="px-4 py-3 text-start font-bold">الراعي</th>
              <th className="px-4 py-3 text-start font-bold">المدة</th>
              <th className="px-4 py-3 text-start font-bold">الحالة</th>
              <th className="px-4 py-3 text-start font-bold">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {list.map((sponsor) => {
              const state = status(sponsor);
              return (
                <tr key={sponsor.id} className={cn(state.label !== "يظهر الآن" && "bg-ivory/60")}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {sponsor.logo_url ? (
                        <img src={sponsor.logo_url} alt="" className="size-10 shrink-0 rounded-xl object-contain" loading="lazy" />
                      ) : null}
                      <span>
                        <span className="block font-bold">{sponsor.name}</span>
                        <span className="block text-xs text-muted">{sponsor.message}</span>
                        {sponsor.link_url && (
                          <a
                            href={sponsor.link_url}
                            target="_blank"
                            rel="noreferrer"
                            className="block text-xs text-emerald hover:underline"
                            dir="ltr"
                          >
                            {sponsor.link_url}
                          </a>
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {formatDay(sponsor.starts_on)} — {formatDay(sponsor.ends_on)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", state.tone)}>{state.label}</span>
                  </td>
                  <td className="px-4 py-3">
                    <SponsorRowControls sponsorId={sponsor.id} active={sponsor.active} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {list.length === 0 && <p className="p-6 text-center text-muted">لا يوجد رعاة بعد.</p>}
      </div>
    </div>
  );
}
