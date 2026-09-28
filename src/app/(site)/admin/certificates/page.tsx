import Link from "next/link";
import type { Metadata, Route } from "next";
import { Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { toArabicDigits } from "@/lib/arabic";
import { requireAdmin } from "@/features/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CertificateControls } from "@/features/admin/AdminControls";
import { formatArabicDate } from "@/features/progress/format";
import { adminSearchTerm } from "@/features/admin/search";

export const metadata: Metadata = { title: "الشهادات" };

export default async function AdminCertificatesPage({ searchParams }: PageProps<"/admin/certificates">) {
  await requireAdmin();
  const query = adminSearchTerm((await searchParams).q);
  const supabase = await createSupabaseServerClient();

  let request = supabase
    .from("certificates")
    .select("id, juz, holder_name, score, total, verification_code, issued_at, revoked_at")
    .order("issued_at", { ascending: false })
    .limit(100);
  if (query) request = request.or(`verification_code.ilike.%${query.toUpperCase()}%,holder_name.ilike.%${query}%`);
  const { data } = await request;
  const certificates = data ?? [];

  return (
    <div className="space-y-5">
      <form action="/admin/certificates" className="relative max-w-md">
        <Search className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="ابحث برقم الشهادة أو الاسم"
          aria-label="بحث عن شهادة"
          className="h-12 w-full rounded-full border border-line bg-white pe-4 ps-11 outline-none focus:border-emerald/50"
        />
      </form>
      <div className="overflow-x-auto rounded-3xl border border-line bg-white shadow-soft">
        <table className="w-full min-w-3xl text-sm">
          <thead className="bg-ivory text-xs text-muted">
            <tr>
              <th className="px-4 py-3 text-start font-bold">الرقم</th>
              <th className="px-4 py-3 text-start font-bold">الاسم</th>
              <th className="px-4 py-3 text-start font-bold">الجزء</th>
              <th className="px-4 py-3 text-start font-bold">الدرجة</th>
              <th className="px-4 py-3 text-start font-bold">التاريخ</th>
              <th className="px-4 py-3 text-start font-bold">إجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {certificates.map((certificate) => (
              <tr key={certificate.id} className={cn(certificate.revoked_at && "bg-rose/5 text-muted")}>
                <td className="px-4 py-3 font-mono text-xs" dir="ltr">
                  <Link href={`/certificates/${certificate.verification_code}` as Route} className="text-emerald hover:underline">
                    {certificate.verification_code}
                  </Link>
                </td>
                <td className="px-4 py-3 font-bold">{certificate.holder_name}</td>
                <td className="px-4 py-3">{toArabicDigits(certificate.juz)}</td>
                <td className="px-4 py-3">
                  {toArabicDigits(certificate.score)}/{toArabicDigits(certificate.total)}
                </td>
                <td className="px-4 py-3">{formatArabicDate(certificate.issued_at)}</td>
                <td className="px-4 py-3">
                  <CertificateControls certificateId={certificate.id} revoked={certificate.revoked_at !== null} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {certificates.length === 0 && <p className="p-6 text-center text-muted">لا توجد شهادات.</p>}
      </div>
    </div>
  );
}
