import Link from "next/link";
import type { Metadata, Route } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, Award, BookOpenCheck, CalendarDays, ClipboardCheck, Mic } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { toArabicDigits } from "@/lib/arabic";
import { requireAdmin } from "@/features/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { UserControls } from "@/features/admin/AdminControls";
import { PROVIDERS, UserAvatar, UserBadges, formatDateTime, formatFullDate, relativeDay } from "@/features/admin/UserBits";
import { totalUnits } from "@/features/plan/schedule";
import { getSurahs } from "@/features/quran/api";
import type { ExamStatus } from "@/lib/supabase/database.types";

export const metadata: Metadata = { title: "تفاصيل المستخدم" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const QURAN_AYAHS = 6236;

const STATUS: Record<ExamStatus, { label: string; tone: string }> = {
  passed: { label: "ناجح", tone: "bg-emerald-mist text-emerald" },
  failed: { label: "لم ينجح", tone: "bg-rose/10 text-rose" },
  expired: { label: "انتهى الوقت", tone: "bg-line text-muted" },
  in_progress: { label: "جارٍ", tone: "bg-sky/10 text-sky" },
};

function Panel({ title, count, children, className }: { title: string; count?: number; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-3xl border border-line bg-white p-5 shadow-soft", className)}>
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-emerald-deep">
        {title}
        {count !== undefined && <span className="rounded-full bg-ivory px-2 text-xs font-bold text-muted">{toArabicDigits(count)}</span>}
      </h2>
      {children}
    </section>
  );
}

const Empty = ({ text }: { text: string }) => <p className="rounded-2xl bg-ivory p-4 text-center text-sm text-muted">{text}</p>;

function Stat({ icon: Icon, label, value, hint }: { icon: LucideIcon; label: string; value: string; hint?: string | undefined }) {
  return (
    <div className="flex items-center gap-3 rounded-3xl border border-line bg-white p-4 shadow-soft">
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gold-mist text-gold-deep">
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="font-display text-xl font-bold text-emerald-deep">{value}</p>
        <p className="text-xs text-muted">
          {label}
          {hint && <span className="text-muted/80"> · {hint}</span>}
        </p>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="text-muted">{label}</dt>
      <dd className="text-end font-bold">{children}</dd>
    </div>
  );
}

function Toggle({ on }: { on: boolean }) {
  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", on ? "bg-emerald-mist text-emerald" : "bg-line text-muted")}>
      {on ? "مفعّل" : "متوقف"}
    </span>
  );
}

function Progress({ value }: { value: number }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-white" role="presentation">
      <div className="h-full rounded-full bg-emerald" style={{ width: `${Math.min(100, Math.max(value > 0 ? 1 : 0, value))}%` }} />
    </div>
  );
}

function percent(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

export default async function AdminUserPage({ params }: PageProps<"/admin/users/[id]">) {
  const session = await requireAdmin();
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const supabase = await createSupabaseServerClient();
  const adminClient = createSupabaseAdminClient();
  const [{ data: profile }, { data: learnerRows }, { data: authUser }, reminders] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, email, full_name, certificate_name, role, disabled, email_updates, remind_friday, remind_fasting, remind_seasons, created_at, updated_at",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase.from("learners").select("id, kind, display_name, birth_year, created_at").eq("owner_id", id).order("created_at"),
    adminClient.auth.admin.getUserById(id),
    supabase
      .from("reminder_deliveries")
      .select("sent_at", { count: "exact" })
      .eq("user_id", id)
      .order("sent_at", { ascending: false })
      .limit(1),
  ]);
  if (!profile) notFound();

  const learners = learnerRows ?? [];
  const learnerIds = learners.map((learner) => learner.id);
  const learnerName = new Map(
    learners.map((learner) => [learner.id, learner.kind === "self" ? profile.full_name || "صاحب الحساب" : learner.display_name]),
  );
  const now = new Date().toISOString();

  const [attempts, certificates, tasmee, plans, khatmas, surahs, perLearner] = await Promise.all([
    supabase
      .from("exam_attempts")
      .select("id, learner_id, juz, status, score, total, started_at")
      .in("learner_id", learnerIds)
      .order("started_at", { ascending: false })
      .limit(30),
    supabase
      .from("certificates")
      .select("id, learner_id, juz, score, total, verification_code, issued_at, revoked_at")
      .in("learner_id", learnerIds)
      .order("issued_at", { ascending: false }),
    supabase
      .from("tasmee_sessions")
      .select("id, learner_id, surah, ayah_from, ayah_to, correct, mistakes, created_at", { count: "exact" })
      .in("learner_id", learnerIds)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("memorization_plans")
      .select("learner_id, kind, start_juz, end_juz, start_page, end_page, progress_units")
      .eq("status", "active")
      .in("learner_id", learnerIds),
    supabase.from("khatmas").select("learner_id, position").eq("status", "active").in("learner_id", learnerIds),
    getSurahs(),
    Promise.all(
      learnerIds.map(async (learnerId) => {
        const [memorized, due, days, lastDay, badges, games, stories] = await Promise.all([
          supabase.from("memorized_ayahs").select("ayah", { count: "exact", head: true }).eq("learner_id", learnerId),
          supabase.from("review_schedule").select("surah", { count: "exact", head: true }).eq("learner_id", learnerId).lte("due_at", now),
          supabase.from("activity_days").select("day", { count: "exact", head: true }).eq("learner_id", learnerId),
          supabase
            .from("activity_days")
            .select("day")
            .eq("learner_id", learnerId)
            .order("day", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase.from("learner_badges").select("badge_id", { count: "exact", head: true }).eq("learner_id", learnerId),
          supabase.from("game_sessions").select("id", { count: "exact", head: true }).eq("learner_id", learnerId),
          supabase.from("story_views").select("story_id", { count: "exact", head: true }).eq("learner_id", learnerId),
        ]);
        return [
          learnerId,
          {
            memorized: memorized.count ?? 0,
            due: due.count ?? 0,
            days: days.count ?? 0,
            lastDay: lastDay.data?.day ?? null,
            badges: badges.count ?? 0,
            games: games.count ?? 0,
            stories: stories.count ?? 0,
          },
        ] as const;
      }),
    ),
  ]);
  const stats = new Map(perLearner);
  const surahName = new Map(surahs.map((surah) => [surah.id, surah.name]));
  const user = authUser?.user;
  const providers = [...new Set((user?.identities ?? []).map((identity) => PROVIDERS[identity.provider] ?? identity.provider))];

  const totals = perLearner.reduce((sum, [, stat]) => ({ memorized: sum.memorized + stat.memorized, days: sum.days + stat.days }), {
    memorized: 0,
    days: 0,
  });
  const lastActivity = perLearner
    .map(([, stat]) => stat.lastDay)
    .filter((day): day is string => Boolean(day))
    .sort()
    .at(-1);
  const submitted = (attempts.data ?? []).filter((attempt) => attempt.status !== "in_progress");
  const passed = submitted.filter((attempt) => attempt.status === "passed").length;
  const activeCertificates = (certificates.data ?? []).filter((certificate) => !certificate.revoked_at).length;
  const children = learners.filter((learner) => learner.kind === "child").length;

  return (
    <div className="space-y-5">
      <Link href="/admin/users" className="inline-flex items-center gap-1 text-sm font-bold text-emerald hover:underline">
        <ArrowRight className="size-4" aria-hidden /> كل المستخدمين
      </Link>

      <section className="rounded-3xl border border-line bg-white shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-4 p-5">
          <div className="flex min-w-0 items-center gap-4">
            <UserAvatar
              name={profile.full_name || profile.email || ""}
              role={profile.role}
              disabled={profile.disabled}
              className="size-16 text-2xl"
            />
            <div className="min-w-0 space-y-1">
              <h2 className="flex flex-wrap items-center gap-2 text-2xl font-bold text-emerald-deep">
                {profile.full_name || "—"}
                <UserBadges role={profile.role} disabled={profile.disabled} className="text-xs" />
              </h2>
              <p className="truncate text-sm text-muted" dir="ltr">
                {profile.email}
              </p>
              <p className="text-xs text-muted">
                عضو منذ {formatFullDate(profile.created_at)}
                {lastActivity && <> · آخر نشاط {relativeDay(lastActivity)}</>}
              </p>
            </div>
          </div>
          <UserControls userId={profile.id} disabled={profile.disabled} role={profile.role} self={profile.id === session.userId} />
        </div>
      </section>

      <section aria-label="ملخص" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Stat
          icon={BookOpenCheck}
          label="آية محفوظة"
          value={toArabicDigits(totals.memorized)}
          hint={learners.length > 1 ? "لكل المتعلّمين" : undefined}
        />
        <Stat icon={CalendarDays} label="يوم نشاط" value={toArabicDigits(totals.days)} />
        <Stat icon={ClipboardCheck} label="اختبار ناجح" value={`${toArabicDigits(passed)} / ${toArabicDigits(submitted.length)}`} />
        <Stat icon={Award} label="شهادة سارية" value={toArabicDigits(activeCertificates)} />
        <Stat icon={Mic} label="جلسة تسميع" value={toArabicDigits(tasmee.count ?? 0)} />
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="بيانات الحساب">
          <dl className="divide-y divide-line text-sm">
            <Row label="الاسم على الشهادات">{profile.certificate_name || "—"}</Row>
            <Row label="طريقة الدخول">{providers.join("، ") || "—"}</Row>
            <Row label="البريد مؤكَّد">
              {user?.email_confirmed_at ? (
                <span className="text-emerald">نعم — {formatFullDate(user.email_confirmed_at)}</span>
              ) : (
                <span className="text-rose">لا</span>
              )}
            </Row>
            <Row label="تاريخ الانضمام">{formatDateTime(profile.created_at)}</Row>
            <Row label="آخر دخول">{user?.last_sign_in_at ? formatDateTime(user.last_sign_in_at) : "—"}</Row>
            <Row label="آخر تعديل للملف">{formatFullDate(profile.updated_at)}</Row>
            <Row label="المتعلّمون">
              {children
                ? `صاحب الحساب + ${toArabicDigits(children)} ${children === 1 ? "طفل" : children === 2 ? "طفلان" : "أطفال"}`
                : "حساب فردي"}
            </Row>
            <Row label="معرّف المستخدم">
              <span className="font-mono text-xs font-normal text-muted" dir="ltr">
                {profile.id}
              </span>
            </Row>
          </dl>
        </Panel>

        <Panel title="الرسائل والتذكيرات">
          <dl className="divide-y divide-line text-sm">
            <Row label="رسائل الإدارة والتحديثات">
              <Toggle on={profile.email_updates} />
            </Row>
            <Row label="تذكير الجمعة">
              <Toggle on={profile.remind_friday} />
            </Row>
            <Row label="تذكير الصيام">
              <Toggle on={profile.remind_fasting} />
            </Row>
            <Row label="تذكير المواسم">
              <Toggle on={profile.remind_seasons} />
            </Row>
            <Row label="تذكيرات وصلته">{toArabicDigits(reminders.count ?? 0)}</Row>
            <Row label="آخر تذكير">{reminders.data?.[0] ? formatDateTime(reminders.data[0].sent_at) : "—"}</Row>
          </dl>
        </Panel>
      </div>

      <Panel title="المتعلّمون" count={learners.length}>
        <div className="grid gap-4 md:grid-cols-2">
          {learners.map((learner) => {
            const stat = stats.get(learner.id);
            const plan = (plans.data ?? []).find((row) => row.learner_id === learner.id);
            const khatma = (khatmas.data ?? []).find((row) => row.learner_id === learner.id);
            const memorizedPercent = percent(stat?.memorized ?? 0, QURAN_AYAHS);
            const child = learner.kind === "child";
            return (
              <article key={learner.id} className="space-y-4 rounded-2xl bg-ivory p-4">
                <header className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <UserAvatar name={learnerName.get(learner.id) ?? ""} className="size-9 text-sm" />
                    <div>
                      <p className="font-bold">{learnerName.get(learner.id)}</p>
                      <p className="text-xs text-muted">
                        {child ? `طفل${learner.birth_year ? ` — مواليد ${toArabicDigits(learner.birth_year)}` : ""}` : "صاحب الحساب"}
                        {" · "}أُضيف {formatFullDate(learner.created_at)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-bold",
                      child ? "bg-sky/10 text-sky" : "bg-emerald-mist text-emerald",
                    )}
                  >
                    {child ? "طفل" : "بالغ"}
                  </span>
                </header>

                <div className="space-y-1.5">
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-muted">الحفظ</span>
                    <span>
                      <strong className="text-emerald-deep">{toArabicDigits(stat?.memorized ?? 0)}</strong>
                      <span className="text-xs text-muted"> آية · {toArabicDigits(memorizedPercent)}٪ من القرآن</span>
                    </span>
                  </div>
                  <Progress value={(100 * (stat?.memorized ?? 0)) / QURAN_AYAHS} />
                </div>

                <dl className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: "مراجعات مستحقة", value: toArabicDigits(stat?.due ?? 0), alert: Boolean(stat?.due) },
                    { label: "أيام النشاط", value: toArabicDigits(stat?.days ?? 0) },
                    { label: "آخر نشاط", value: stat?.lastDay ? relativeDay(stat.lastDay) : "—" },
                    { label: "الأوسمة", value: toArabicDigits(stat?.badges ?? 0) },
                    { label: "الألعاب", value: toArabicDigits(stat?.games ?? 0) },
                    { label: "القصص", value: toArabicDigits(stat?.stories ?? 0) },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl bg-white px-2 py-2">
                      <dd className={cn("text-sm font-bold", item.alert ? "text-rose" : "text-ink")}>{item.value}</dd>
                      <dt className="text-[0.7rem] text-muted">{item.label}</dt>
                    </div>
                  ))}
                </dl>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2">
                    <span className="text-muted">خطة الحفظ</span>
                    {plan ? (
                      plan.kind === "review" ? (
                        <strong>خطة مراجعة</strong>
                      ) : (
                        <span className="text-end">
                          <strong>
                            {plan.start_juz && plan.end_juz
                              ? plan.start_juz === plan.end_juz
                                ? `الجزء ${toArabicDigits(plan.start_juz)}`
                                : `الأجزاء ${toArabicDigits(plan.start_juz)}–${toArabicDigits(plan.end_juz)}`
                              : `الصفحات ${toArabicDigits(plan.start_page ?? 0)}–${toArabicDigits(plan.end_page ?? 0)}`}
                          </strong>
                          <span className="text-xs text-muted"> · {toArabicDigits(percent(plan.progress_units, totalUnits(plan)))}٪</span>
                        </span>
                      )
                    ) : (
                      <span className="text-muted">لا توجد</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2">
                    <span className="text-muted">الختمة</span>
                    {khatma ? (
                      <strong>{toArabicDigits(percent(khatma.position, QURAN_AYAHS))}٪ مقروءة</strong>
                    ) : (
                      <span className="text-muted">لا توجد</span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </Panel>

      <Panel title="الاختبارات" count={(attempts.data ?? []).length}>
        {(attempts.data ?? []).length === 0 ? (
          <Empty text="لم يدخل أي اختبار بعد." />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-line">
            <table className="w-full min-w-xl text-sm">
              <thead className="bg-ivory text-xs text-muted">
                <tr>
                  <th className="px-4 py-2.5 text-start font-bold">المتعلّم</th>
                  <th className="px-4 py-2.5 text-start font-bold">الجزء</th>
                  <th className="px-4 py-2.5 text-start font-bold">النتيجة</th>
                  <th className="px-4 py-2.5 text-start font-bold">الدرجة</th>
                  <th className="px-4 py-2.5 text-start font-bold">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {(attempts.data ?? []).map((attempt) => (
                  <tr key={attempt.id}>
                    <td className="px-4 py-2.5">{learnerName.get(attempt.learner_id)}</td>
                    <td className="px-4 py-2.5 font-bold">{toArabicDigits(attempt.juz)}</td>
                    <td className="px-4 py-2.5">
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", STATUS[attempt.status].tone)}>
                        {STATUS[attempt.status].label}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      {attempt.score === null ? (
                        "—"
                      ) : (
                        <>
                          {toArabicDigits(attempt.score)}/{toArabicDigits(attempt.total)}
                          <span className="text-xs text-muted"> ({toArabicDigits(percent(attempt.score, attempt.total))}٪)</span>
                        </>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-muted">{formatDateTime(attempt.started_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="الشهادات" count={(certificates.data ?? []).length}>
          {(certificates.data ?? []).length === 0 ? (
            <Empty text="لا توجد شهادات." />
          ) : (
            <ul className="space-y-2 text-sm">
              {(certificates.data ?? []).map((certificate) => (
                <li
                  key={certificate.id}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-2xl bg-ivory px-4 py-3",
                    certificate.revoked_at && "opacity-60",
                  )}
                >
                  <div>
                    <p className="font-bold">
                      الجزء {toArabicDigits(certificate.juz)}
                      {certificate.revoked_at && <span className="ms-2 rounded-full bg-rose/10 px-2 text-xs text-rose">ملغاة</span>}
                    </p>
                    <p className="text-xs text-muted">
                      {learnerName.get(certificate.learner_id)} · {toArabicDigits(certificate.score)}/{toArabicDigits(certificate.total)} ·{" "}
                      {formatFullDate(certificate.issued_at)}
                    </p>
                  </div>
                  <Link
                    href={`/certificates/${certificate.verification_code}` as Route}
                    className="font-mono text-xs text-emerald hover:underline"
                    dir="ltr"
                  >
                    {certificate.verification_code}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="آخر جلسات التسميع" count={tasmee.count ?? 0}>
          {(tasmee.data ?? []).length === 0 ? (
            <Empty text="لم يسمّع بعد." />
          ) : (
            <ul className="space-y-2 text-sm">
              {(tasmee.data ?? []).map((row) => {
                const accuracy = percent(row.correct, row.correct + row.mistakes);
                return (
                  <li key={row.id} className="flex items-center justify-between gap-3 rounded-2xl bg-ivory px-4 py-3">
                    <div>
                      <p className="font-bold">
                        سورة {surahName.get(row.surah) ?? toArabicDigits(row.surah)}
                        <span className="font-normal text-muted">
                          {" "}
                          ({toArabicDigits(row.ayah_from)}–{toArabicDigits(row.ayah_to)})
                        </span>
                      </p>
                      <p className="text-xs text-muted">
                        {learners.length > 1 && <>{learnerName.get(row.learner_id)} · </>}
                        <span className="text-emerald">{toArabicDigits(row.correct)} صحيحة</span> ·{" "}
                        <span className={cn(row.mistakes > 0 && "text-rose")}>{toArabicDigits(row.mistakes)} خطأ</span> ·{" "}
                        {formatFullDate(row.created_at)}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold",
                        accuracy >= 90
                          ? "bg-emerald-mist text-emerald"
                          : accuracy >= 70
                            ? "bg-gold-mist text-gold-deep"
                            : "bg-rose/10 text-rose",
                      )}
                    >
                      {toArabicDigits(accuracy)}٪
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
