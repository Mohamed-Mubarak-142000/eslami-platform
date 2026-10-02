import Link from "next/link";
import type { Metadata, Route } from "next";
import { Award, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { toArabicDigits } from "@/lib/arabic";
import { requireAdmin } from "@/features/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { adminSearchTerm } from "@/features/admin/search";
import { PROVIDERS, UserAvatar, UserBadges, daysSince, formatFullDate, relativeDay } from "@/features/admin/UserBits";

export const metadata: Metadata = { title: "المستخدمون" };

const PAGE_SIZE = 20;

const FILTERS = [
  { key: "all", label: "الكل" },
  { key: "admins", label: "المدراء" },
  { key: "disabled", label: "الموقوفون" },
] as const;
type Filter = (typeof FILTERS)[number]["key"];

function single(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function usersHref({ q, filter, page }: { q: string; filter: Filter; page: number }): Route {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (filter !== "all") params.set("filter", filter);
  if (page > 1) params.set("page", String(page));
  const search = params.toString();
  return (search ? `/admin/users?${search}` : "/admin/users") as Route;
}

const Th = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <th scope="col" className={cn("whitespace-nowrap px-4 py-3 text-start font-bold", className)}>
    {children}
  </th>
);

export default async function AdminUsersPage({ searchParams }: PageProps<"/admin/users">) {
  await requireAdmin();
  const params = await searchParams;
  const query = adminSearchTerm(params.q);
  const filter: Filter = FILTERS.some((item) => item.key === single(params.filter)) ? (single(params.filter) as Filter) : "all";
  const page = Math.max(1, Number.parseInt(single(params.page) ?? "1", 10) || 1);
  const supabase = await createSupabaseServerClient();

  let request = supabase
    .from("profiles")
    .select("id, email, full_name, role, disabled, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (query) request = request.or(`email.ilike.%${query}%,full_name.ilike.%${query}%`);
  if (filter === "admins") request = request.eq("role", "admin");
  if (filter === "disabled") request = request.eq("disabled", true);

  const [{ data, count }, allCount, adminCount, disabledCount] = await Promise.all([
    request,
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("disabled", true),
  ]);
  const filterCounts: Record<Filter, number> = {
    all: allCount.count ?? 0,
    admins: adminCount.count ?? 0,
    disabled: disabledCount.count ?? 0,
  };
  const profiles = data ?? [];
  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const ids = profiles.map((profile) => profile.id);

  const { data: learnerRows } = ids.length
    ? await supabase.from("learners").select("id, owner_id, kind, display_name").in("owner_id", ids).order("created_at")
    : { data: [] };
  const learners = learnerRows ?? [];
  const learnerIds = learners.map((learner) => learner.id);

  const adminClient = createSupabaseAdminClient();
  const [certificates, attempts, perLearner, authUsers] = await Promise.all([
    learnerIds.length
      ? supabase.from("certificates").select("learner_id").is("revoked_at", null).in("learner_id", learnerIds)
      : { data: [] },
    learnerIds.length
      ? supabase.from("exam_attempts").select("learner_id, status").neq("status", "in_progress").in("learner_id", learnerIds)
      : { data: [] },
    Promise.all(
      learnerIds.map(async (learnerId) => {
        const [memorized, lastDay] = await Promise.all([
          supabase.from("memorized_ayahs").select("ayah", { count: "exact", head: true }).eq("learner_id", learnerId),
          supabase
            .from("activity_days")
            .select("day")
            .eq("learner_id", learnerId)
            .order("day", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);
        return [learnerId, { memorized: memorized.count ?? 0, lastDay: lastDay.data?.day ?? null }] as const;
      }),
    ),
    Promise.all(
      ids.map(async (id) => {
        const { data: auth } = await adminClient.auth.admin.getUserById(id).catch(() => ({ data: null }));
        return [id, auth?.user ?? null] as const;
      }),
    ),
  ]);
  const learnerStats = new Map(perLearner);
  const authById = new Map(authUsers);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <form action="/admin/users" className="relative w-full max-w-md">
          {filter !== "all" && <input type="hidden" name="filter" value={filter} />}
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
        <nav aria-label="تصفية المستخدمين" className="flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <Link
              key={item.key}
              href={usersHref({ q: query, filter: item.key, page: 1 })}
              aria-current={filter === item.key ? "page" : undefined}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold",
                filter === item.key ? "bg-emerald text-white" : "border border-line bg-white hover:bg-emerald-mist",
              )}
            >
              {item.label}
              <span className={cn("rounded-full px-2 text-xs", filter === item.key ? "bg-white/20" : "bg-ivory text-muted")}>
                {toArabicDigits(filterCounts[item.key])}
              </span>
            </Link>
          ))}
        </nav>
      </div>

      <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-soft">
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3 text-sm">
          <p className="font-bold text-emerald-deep">
            {toArabicDigits(total)} مستخدم{query && <span className="font-normal text-muted"> — نتائج البحث عن «{query}»</span>}
          </p>
          {total > 0 && (
            <p className="text-xs text-muted">
              {toArabicDigits((page - 1) * PAGE_SIZE + 1)}–{toArabicDigits((page - 1) * PAGE_SIZE + profiles.length)}
            </p>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-5xl text-sm">
            <thead className="bg-ivory text-xs text-muted">
              <tr>
                <Th>المستخدم</Th>
                <Th>المتعلّمون</Th>
                <Th className="text-center">آيات محفوظة</Th>
                <Th className="text-center">الاختبارات</Th>
                <Th className="text-center">الشهادات</Th>
                <Th>آخر نشاط</Th>
                <Th>آخر دخول</Th>
                <Th>تاريخ الانضمام</Th>
                <Th>
                  <span className="sr-only">التفاصيل</span>
                </Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {profiles.map((profile) => {
                const href = `/admin/users/${profile.id}` as Route;
                const own = learners.filter((learner) => learner.owner_id === profile.id);
                const ownIds = new Set(own.map((learner) => learner.id));
                const children = own.filter((learner) => learner.kind === "child");
                const memorized = own.reduce((sum, learner) => sum + (learnerStats.get(learner.id)?.memorized ?? 0), 0);
                const lastDay = own
                  .map((learner) => learnerStats.get(learner.id)?.lastDay)
                  .filter((day): day is string => Boolean(day))
                  .sort()
                  .at(-1);
                const certificateCount = (certificates.data ?? []).filter((row) => ownIds.has(row.learner_id)).length;
                const ownAttempts = (attempts.data ?? []).filter((row) => ownIds.has(row.learner_id));
                const passed = ownAttempts.filter((row) => row.status === "passed").length;
                const auth = authById.get(profile.id);
                const providers = [
                  ...new Set((auth?.identities ?? []).map((identity) => PROVIDERS[identity.provider] ?? identity.provider)),
                ];
                return (
                  <tr key={profile.id} className={cn("transition-colors hover:bg-ivory/60", profile.disabled && "bg-rose/5")}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <UserAvatar name={profile.full_name || profile.email || ""} role={profile.role} disabled={profile.disabled} />
                        <div className="min-w-0">
                          <p className="flex flex-wrap items-center gap-1.5 font-bold">
                            <Link href={href} className="hover:text-emerald hover:underline">
                              {profile.full_name || "—"}
                            </Link>
                            <UserBadges role={profile.role} disabled={profile.disabled} />
                          </p>
                          <p className="max-w-56 truncate text-xs text-muted" dir="ltr" title={profile.email ?? undefined}>
                            {profile.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {children.length === 0 ? (
                        <span className="text-xs text-muted">حساب فردي</span>
                      ) : (
                        <div className="flex max-w-52 flex-wrap gap-1">
                          {children.slice(0, 3).map((child) => (
                            <span key={child.id} className="rounded-full bg-sky/10 px-2 py-0.5 text-xs text-sky">
                              {child.display_name}
                            </span>
                          ))}
                          {children.length > 3 && (
                            <span className="rounded-full bg-line px-2 py-0.5 text-xs text-muted">
                              +{toArabicDigits(children.length - 3)}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn("font-bold", memorized ? "text-emerald-deep" : "text-muted")}>{toArabicDigits(memorized)}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {ownAttempts.length === 0 ? (
                        <span className="text-muted">—</span>
                      ) : (
                        <span title={`${passed} ناجح من ${ownAttempts.length}`}>
                          <strong className="text-emerald">{toArabicDigits(passed)}</strong>
                          <span className="text-muted"> / {toArabicDigits(ownAttempts.length)}</span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {certificateCount ? (
                        <span className="inline-flex items-center gap-1 font-bold text-gold-deep">
                          <Award className="size-4" aria-hidden /> {toArabicDigits(certificateCount)}
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {lastDay ? (
                        <span className={cn("inline-flex items-center gap-1.5", daysSince(lastDay) <= 7 ? "text-emerald" : "text-muted")}>
                          {daysSince(lastDay) <= 7 && <span className="size-1.5 rounded-full bg-emerald" aria-hidden />}
                          {relativeDay(lastDay)}
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <p>{auth?.last_sign_in_at ? relativeDay(auth.last_sign_in_at) : "—"}</p>
                      {providers.length > 0 && <p className="text-xs text-muted">{providers.join("، ")}</p>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted">{formatFullDate(profile.created_at)}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={href}
                        aria-label={`تفاصيل ${profile.full_name || profile.email}`}
                        className="grid size-8 place-items-center rounded-full border border-line text-muted hover:border-emerald/40 hover:text-emerald"
                      >
                        <ChevronLeft className="size-4" aria-hidden />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {profiles.length === 0 && <p className="p-6 text-center text-muted">لا توجد نتائج.</p>}
        {pages > 1 && (
          <nav aria-label="الصفحات" className="flex items-center justify-between gap-3 border-t border-line px-5 py-3 text-sm">
            <PageLink href={usersHref({ q: query, filter, page: page - 1 })} disabled={page <= 1}>
              <ChevronRight className="size-4" aria-hidden /> السابق
            </PageLink>
            <span className="text-muted">
              صفحة {toArabicDigits(page)} من {toArabicDigits(pages)}
            </span>
            <PageLink href={usersHref({ q: query, filter, page: page + 1 })} disabled={page >= pages}>
              التالي <ChevronLeft className="size-4" aria-hidden />
            </PageLink>
          </nav>
        )}
      </div>
    </div>
  );
}

function PageLink({ href, disabled, children }: { href: Route; disabled: boolean; children: React.ReactNode }) {
  const className = "inline-flex items-center gap-1 rounded-full border border-line px-4 py-1.5 font-bold";
  if (disabled) return <span className={cn(className, "text-muted opacity-50")}>{children}</span>;
  return (
    <Link href={href} className={cn(className, "hover:bg-emerald-mist")}>
      {children}
    </Link>
  );
}
