import type { Metadata } from "next";
import { Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { toArabicDigits } from "@/lib/arabic";
import { requireAdmin } from "@/features/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { UserControls } from "@/features/admin/AdminControls";
import { formatArabicDate } from "@/features/progress/format";
import { adminSearchTerm } from "@/features/admin/search";

export const metadata: Metadata = { title: "المستخدمون" };

const PAGE_SIZE = 50;

export default async function AdminUsersPage({ searchParams }: PageProps<"/admin/users">) {
  const session = await requireAdmin();
  const query = adminSearchTerm((await searchParams).q);
  const supabase = await createSupabaseServerClient();

  let request = supabase
    .from("profiles")
    .select("id, email, full_name, role, disabled, created_at")
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);
  if (query) request = request.or(`email.ilike.%${query}%,full_name.ilike.%${query}%`);
  const { data } = await request;
  const profiles = data ?? [];
  const ids = profiles.map((profile) => profile.id);

  const { data: learners } = ids.length
    ? await supabase.from("learners").select("id, owner_id, kind, display_name").in("owner_id", ids)
    : { data: [] };
  const learnerIds = (learners ?? []).map((learner) => learner.id);
  const { data: certificates } = learnerIds.length
    ? await supabase.from("certificates").select("learner_id").is("revoked_at", null).in("learner_id", learnerIds)
    : { data: [] };

  return (
    <div className="space-y-5">
      <form action="/admin/users" className="relative max-w-md">
        <Search className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="ابحث بالاسم أو البريد"
          aria-label="بحث عن مستخدم"
          className="h-12 w-full rounded-full border border-line bg-white pe-4 ps-11 outline-none focus:border-emerald/50"
        />
      </form>
      <div className="overflow-x-auto rounded-3xl border border-line bg-white shadow-soft">
        <table className="w-full min-w-3xl text-sm">
          <thead className="bg-ivory text-xs text-muted">
            <tr>
              <th className="px-4 py-3 text-start font-bold">المستخدم</th>
              <th className="px-4 py-3 text-start font-bold">الملفات</th>
              <th className="px-4 py-3 text-start font-bold">شهادات</th>
              <th className="px-4 py-3 text-start font-bold">انضم</th>
              <th className="px-4 py-3 text-start font-bold">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {profiles.map((profile) => {
              const own = (learners ?? []).filter((learner) => learner.owner_id === profile.id);
              const certificateCount = (certificates ?? []).filter((certificate) =>
                own.some((learner) => learner.id === certificate.learner_id),
              ).length;
              return (
                <tr key={profile.id} className={cn(profile.disabled && "bg-rose/5")}>
                  <td className="px-4 py-3">
                    <p className="font-bold">
                      {profile.full_name || "—"}
                      {profile.role === "admin" && (
                        <span className="ms-2 rounded-full bg-gold-mist px-2 py-0.5 text-[0.7rem] text-gold-deep">مدير</span>
                      )}
                      {profile.disabled && <span className="ms-2 rounded-full bg-rose/10 px-2 py-0.5 text-[0.7rem] text-rose">موقوف</span>}
                    </p>
                    <p className="text-xs text-muted" dir="ltr">
                      {profile.email}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {own.map((learner) => (learner.kind === "self" ? "صاحب الحساب" : learner.display_name)).join("، ")}
                  </td>
                  <td className="px-4 py-3">{toArabicDigits(certificateCount)}</td>
                  <td className="px-4 py-3 text-muted">{formatArabicDate(profile.created_at)}</td>
                  <td className="px-4 py-3">
                    <UserControls
                      userId={profile.id}
                      disabled={profile.disabled}
                      role={profile.role}
                      self={profile.id === session.userId}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {profiles.length === 0 && <p className="p-6 text-center text-muted">لا توجد نتائج.</p>}
      </div>
      {profiles.length === PAGE_SIZE && (
        <p className="text-xs text-muted">تُعرض أحدث {toArabicDigits(PAGE_SIZE)} نتيجة — استخدم البحث للوصول لغيرها.</p>
      )}
    </div>
  );
}
