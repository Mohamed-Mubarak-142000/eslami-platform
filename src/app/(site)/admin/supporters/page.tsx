import type { Metadata } from "next";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { requireAdmin } from "@/features/auth/session";
import { SupporterRowControls } from "@/features/admin/SupporterControls";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { SupporterStatus } from "@/lib/supabase/database.types";

export const metadata: Metadata = { title: "الداعمون" };

const RECEIPT_BUCKET = "donation_receipts";
/** Signed links to the private screenshots last long enough to review a page of requests. */
const RECEIPT_LINK_SECONDS = 60 * 30;

const TABS: { status: SupporterStatus; label: string }[] = [
  { status: "pending", label: "قيد المراجعة" },
  { status: "approved", label: "المقبولة" },
  { status: "rejected", label: "المرفوضة" },
];

const DATE = new Intl.DateTimeFormat("ar-EG", {
  day: "numeric",
  month: "long",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Africa/Cairo",
});
const NUMBER = new Intl.NumberFormat("ar-EG");

/**
 * InstaPay donations sent from the mobile app's /support screen. The admin opens the transfer
 * screenshot, checks the money arrived, then approves (the name shows on the app's home screen and a
 * thank-you email goes out) or rejects (the user sees the reason and can send again).
 */
export default async function AdminSupportersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdmin();
  const { status: requested } = await searchParams;
  const status = TABS.find((tab) => tab.status === requested)?.status ?? "pending";

  // The service role reads the users' emails and signs the private screenshots; requireAdmin() ran above.
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("supporters")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: status === "pending" })
    .limit(200);
  const list = data ?? [];

  const userIds = [...new Set(list.map((row) => row.user_id))];
  const [{ data: profiles }, signed] = await Promise.all([
    userIds.length ? admin.from("profiles").select("id, email, full_name").in("id", userIds) : Promise.resolve({ data: [] }),
    list.length
      ? admin.storage.from(RECEIPT_BUCKET).createSignedUrls(
          list.map((row) => row.receipt_path),
          RECEIPT_LINK_SECONDS,
        )
      : Promise.resolve({ data: [] }),
  ]);
  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const receiptByPath = new Map((signed.data ?? []).map((entry) => [entry.path, entry.signedUrl]));

  return (
    <div className="space-y-6">
      <section className="rounded-4xl border border-line bg-white p-6 shadow-soft">
        <h2 className="mb-1 text-xl font-bold text-emerald-deep">الداعمون عبر إنستاباي</h2>
        <p className="text-sm text-muted">
          راجع صورة التحويل وتأكد من وصول المبلغ قبل القبول. المقبولون يظهرون بالاسم والرسالة فقط (بدون المبلغ) في قسم «داعمي المنارة»
          بالتطبيق، ويصلهم إيميل شكر.
        </p>
      </section>

      <nav aria-label="حالة الطلبات" className="flex gap-2">
        {TABS.map((tab) => (
          <Link
            key={tab.status}
            href={`/admin/supporters?status=${tab.status}`}
            aria-current={tab.status === status ? "page" : undefined}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-bold",
              tab.status === status ? "bg-emerald-deep text-white" : "border border-line bg-white text-ink hover:bg-emerald-mist",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <div className="overflow-x-auto rounded-3xl border border-line bg-white shadow-soft">
        <table className="w-full min-w-4xl text-sm">
          <thead className="bg-ivory text-xs text-muted">
            <tr>
              <th className="px-4 py-3 text-start font-bold">صورة التحويل</th>
              <th className="px-4 py-3 text-start font-bold">الداعم</th>
              <th className="px-4 py-3 text-start font-bold">المبلغ والمحوِّل</th>
              <th className="px-4 py-3 text-start font-bold">التاريخ</th>
              <th className="px-4 py-3 text-start font-bold">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {list.map((row) => {
              const profile = profileById.get(row.user_id);
              const receipt = receiptByPath.get(row.receipt_path);
              return (
                <tr key={row.id} className="align-top">
                  <td className="px-4 py-3">
                    {receipt ? (
                      <a href={receipt} target="_blank" rel="noreferrer" title="فتح الصورة كاملة">
                        <img
                          src={receipt}
                          alt="صورة التحويل"
                          className="h-28 w-20 rounded-xl border border-line object-cover"
                          loading="lazy"
                        />
                      </a>
                    ) : (
                      <span className="text-xs text-muted">لا توجد صورة</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="block font-bold">{row.display_name}</span>
                    {!row.show_name && <span className="block text-xs text-muted">يظهر باسم «فاعل خير»</span>}
                    {row.message && <span className="mt-1 block text-xs text-muted">«{row.message}»</span>}
                    <span className="mt-1 block text-xs text-muted" dir="ltr">
                      {profile?.email ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="block font-bold">{NUMBER.format(row.amount)} جنيه</span>
                    <span className="block text-xs text-muted">من: {row.sender}</span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {DATE.format(new Date(row.created_at))}
                    {row.status === "approved" && (
                      <span className={cn("mt-1 block font-bold", row.thanked_at ? "text-emerald" : "text-rose")}>
                        {row.thanked_at ? "أُرسل الشكر ✓" : "لم يُرسل الشكر"}
                      </span>
                    )}
                    {row.status === "rejected" && row.reject_reason && <span className="mt-1 block text-rose">{row.reject_reason}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <SupporterRowControls supporterId={row.id} status={row.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {list.length === 0 && <p className="p-6 text-center text-muted">لا توجد طلبات هنا.</p>}
      </div>
    </div>
  );
}
