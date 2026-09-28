import Link from "next/link";
import type { Metadata, Route } from "next";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { toArabicDigits } from "@/lib/arabic";
import { requireAdmin } from "@/features/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { UserControls } from "@/features/admin/AdminControls";
import { formatArabicDate } from "@/features/progress/format";
import { getSurahs } from "@/features/quran/api";
import type { ExamStatus } from "@/lib/supabase/database.types";

export const metadata: Metadata = { title: "تفاصيل المستخدم" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const STATUS: Record<ExamStatus, { label: string; tone: string }> = {
  passed: { label: "ناجح", tone: "bg-emerald-mist text-emerald" },
  failed: { label: "لم ينجح", tone: "bg-rose/10 text-rose" },
  expired: { label: "انتهى الوقت", tone: "bg-line text-muted" },
  in_progress: { label: "جارٍ", tone: "bg-sky/10 text-sky" },
};

const PROVIDERS: Record<string, string> = { email: "البريد", google: "Google" };

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-line bg-white p-5 shadow-soft">
      <h2 className="mb-4 text-lg font-bold text-emerald-deep">{title}</h2>
      {children}
    </section>
  );
}

const Empty = ({ text }: { text: string }) => <p className="text-sm text-muted">{text}</p>;

export default async function AdminUserPage({ params }: PageProps<"/admin/users/[id]">) {
  const session = await requireAdmin();
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const supabase = await createSupabaseServerClient();
  const [{ data: profile }, { data: learners }, { data: authUser }] = await Promise.all([
    supabase.from("profiles").select("id, email, full_name, certificate_name, role, disabled, created_at").eq("id", id).maybeSingle(),
    supabase.from("learners").select("id, kind, display_name, birth_year").eq("owner_id", id).order("created_at"),
    createSupabaseAdminClient().auth.admin.getUserById(id),
  ]);
  if (!profile) notFound();

  const learnerIds = (learners ?? []).map((learner) => learner.id);
  const learnerName = new Map(
    (learners ?? []).map((learner) => [learner.id, learner.kind === "self" ? "صاحب الحساب" : learner.display_name]),
  );
  const now = new Date().toISOString();

  const [attempts, certificates, tasmee, surahs, perLearner] = await Promise.all([
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
      .select("id, learner_id, surah, ayah_from, ayah_to, correct, mistakes, created_at")
      .in("learner_id", learnerIds)
      .order("created_at", { ascending: false })
      .limit(10),
    getSurahs(),
    Promise.all(
      learnerIds.map(async (learnerId) => {
        const [memorized, due, lastDay] = await Promise.all([
          supabase.from("memorized_ayahs").select("ayah", { count: "exact", head: true }).eq("learner_id", learnerId),
          supabase.from("review_schedule").select("surah", { count: "exact", head: true }).eq("learner_id", learnerId).lte("due_at", now),
          supabase
            .from("activity_days")
            .select("day")
            .eq("learner_id", learnerId)
            .order("day", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);
        return [learnerId, { memorized: memorized.count ?? 0, due: due.count ?? 0, lastDay: lastDay.data?.day ?? null }] as const;
      }),
    ),
  ]);
  const stats = new Map(perLearner);
  const surahName = new Map(surahs.map((surah) => [surah.id, surah.name]));
  const user = authUser?.user;
  const providers = (user?.identities ?? []).map((identity) => PROVIDERS[identity.provider] ?? identity.provider);

  return (
    <div className="space-y-5">
      <Link href="/admin/users" className="inline-flex items-center gap-1 text-sm font-bold text-emerald hover:underline">
        <ArrowRight className="size-4" aria-hidden /> كل المستخدمين
      </Link>

      <section className="flex flex-wrap items-start justify-between gap-4 rounded-3xl border border-line bg-white p-5 shadow-soft">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-emerald-deep">
            {profile.full_name || "—"}
            {profile.role === "admin" && (
              <span className="ms-2 rounded-full bg-gold-mist px-2 py-0.5 align-middle text-xs text-gold-deep">مدير</span>
            )}
            {profile.disabled && <span className="ms-2 rounded-full bg-rose/10 px-2 py-0.5 align-middle text-xs text-rose">موقوف</span>}
          </h2>
          <p className="text-sm text-muted" dir="ltr">
            {profile.email}
          </p>
          <dl className="grid gap-x-6 gap-y-1 pt-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="inline text-muted">الاسم على الشهادات: </dt>
              <dd className="inline font-bold">{profile.certificate_name || "—"}</dd>
            </div>
            <div>
              <dt className="inline text-muted">انضم: </dt>
              <dd className="inline font-bold">{formatArabicDate(profile.created_at)}</dd>
            </div>
            <div>
              <dt className="inline text-muted">آخر دخول: </dt>
              <dd className="inline font-bold">{user?.last_sign_in_at ? formatArabicDate(user.last_sign_in_at) : "—"}</dd>
            </div>
            <div>
              <dt className="inline text-muted">طريقة الدخول: </dt>
              <dd className="inline font-bold">{providers.join("، ") || "—"}</dd>
            </div>
            <div>
              <dt className="inline text-muted">البريد مؤكَّد: </dt>
              <dd className="inline font-bold">{user?.email_confirmed_at ? "نعم" : "لا"}</dd>
            </div>
          </dl>
        </div>
        <UserControls userId={profile.id} disabled={profile.disabled} role={profile.role} self={profile.id === session.userId} />
      </section>

      <Panel title="المتعلّمون">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(learners ?? []).map((learner) => {
            const stat = stats.get(learner.id);
            return (
              <div key={learner.id} className="rounded-2xl bg-ivory p-4">
                <p className="font-bold">
                  {learner.kind === "self" ? profile.full_name || "صاحب الحساب" : learner.display_name}
                  <span className="ms-2 text-xs font-normal text-muted">
                    {learner.kind === "self" ? "صاحب الحساب" : `طفل${learner.birth_year ? ` — ${toArabicDigits(learner.birth_year)}` : ""}`}
                  </span>
                </p>
                <ul className="mt-2 space-y-0.5 text-sm text-muted">
                  <li>
                    آيات محفوظة: <strong className="text-ink">{toArabicDigits(stat?.memorized ?? 0)}</strong>
                  </li>
                  <li>
                    مراجعات مستحقة: <strong className={cn(stat?.due ? "text-rose" : "text-ink")}>{toArabicDigits(stat?.due ?? 0)}</strong>
                  </li>
                  <li>
                    آخر نشاط: <strong className="text-ink">{stat?.lastDay ? formatArabicDate(stat.lastDay) : "—"}</strong>
                  </li>
                </ul>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel title="الاختبارات">
        {(attempts.data ?? []).length === 0 ? (
          <Empty text="لم يدخل أي اختبار بعد." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-xl text-sm">
              <thead className="text-xs text-muted">
                <tr>
                  <th className="py-2 text-start font-bold">المتعلّم</th>
                  <th className="py-2 text-start font-bold">الجزء</th>
                  <th className="py-2 text-start font-bold">النتيجة</th>
                  <th className="py-2 text-start font-bold">الدرجة</th>
                  <th className="py-2 text-start font-bold">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {(attempts.data ?? []).map((attempt) => (
                  <tr key={attempt.id}>
                    <td className="py-2">{learnerName.get(attempt.learner_id)}</td>
                    <td className="py-2">{toArabicDigits(attempt.juz)}</td>
                    <td className="py-2">
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", STATUS[attempt.status].tone)}>
                        {STATUS[attempt.status].label}
                      </span>
                    </td>
                    <td className="py-2">
                      {attempt.score === null ? "—" : `${toArabicDigits(attempt.score)}/${toArabicDigits(attempt.total)}`}
                    </td>
                    <td className="py-2 text-muted">{formatArabicDate(attempt.started_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="الشهادات">
          {(certificates.data ?? []).length === 0 ? (
            <Empty text="لا توجد شهادات." />
          ) : (
            <ul className="divide-y divide-line text-sm">
              {(certificates.data ?? []).map((certificate) => (
                <li
                  key={certificate.id}
                  className={cn("flex items-center justify-between gap-3 py-2", certificate.revoked_at && "text-muted")}
                >
                  <span>
                    الجزء {toArabicDigits(certificate.juz)} — {learnerName.get(certificate.learner_id)}
                    {certificate.revoked_at && <span className="ms-2 text-xs text-rose">ملغاة</span>}
                  </span>
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

        <Panel title="آخر جلسات التسميع">
          {(tasmee.data ?? []).length === 0 ? (
            <Empty text="لم يسمّع بعد." />
          ) : (
            <ul className="divide-y divide-line text-sm">
              {(tasmee.data ?? []).map((session) => (
                <li key={session.id} className="flex items-center justify-between gap-3 py-2">
                  <span>
                    سورة {surahName.get(session.surah) ?? toArabicDigits(session.surah)} ({toArabicDigits(session.ayah_from)}–
                    {toArabicDigits(session.ayah_to)})
                  </span>
                  <span className="text-xs text-muted">
                    <span className="text-emerald">{toArabicDigits(session.correct)} صحيحة</span> ·{" "}
                    <span className={cn(session.mistakes > 0 && "text-rose")}>{toArabicDigits(session.mistakes)} خطأ</span> ·{" "}
                    {formatArabicDate(session.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
