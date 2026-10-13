import Link from "next/link";
import type { Metadata, Route } from "next";
import { Award, GraduationCap } from "lucide-react";
import { toArabicDigits } from "@/lib/arabic";
import { buttonClass } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireSession } from "@/features/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { juzOrdinal } from "@/features/certificates/Certificate";
import { formatArabicDate } from "@/features/progress/format";

export const metadata: Metadata = { title: "شهاداتي", robots: { index: false } };

export default async function MyCertificatesPage() {
  const session = await requireSession("/certificates/mine");
  const supabase = await createSupabaseServerClient();
  const learnerIds = session.learners.map((learner) => learner.id);
  const [{ data }, { data: nawawi }] = await Promise.all([
    supabase
      .from("certificates")
      .select("learner_id, juz, holder_name, score, total, verification_code, issued_at, revoked_at")
      .in("learner_id", learnerIds)
      .order("issued_at", { ascending: false }),
    supabase
      .from("nawawi_certificates")
      .select("learner_id, holder_name, score, total, verification_code, issued_at, revoked_at")
      .in("learner_id", learnerIds),
  ]);
  // The Forty Nawawi certificate first, then the juz certificates, newest first.
  const certificates = [
    ...(nawawi ?? []).map((certificate) => ({ ...certificate, subject: "الأربعون النووية" })),
    ...(data ?? []).map((certificate) => ({ ...certificate, subject: `الجزء ${juzOrdinal(certificate.juz)}` })),
  ];

  return (
    <>
      <PageHeader
        kicker="شهاداتي"
        icon={<Award className="size-4" aria-hidden />}
        title="شهاداتك"
        description="كل شهادة لها رقم تحقق ورمز QR يتيح لأي أحد التأكد من صحتها."
      />
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        {certificates.length === 0 ? (
          <div className="rounded-4xl border border-line bg-white p-10 text-center shadow-soft">
            <GraduationCap className="mx-auto size-12 text-gold-deep" aria-hidden />
            <h2 className="mt-4 text-xl font-bold text-emerald-deep">لا توجد شهادات بعد</h2>
            <p className="mt-2 text-muted">اجتز اختبار أي جزء، أو أتمّ الأربعين النووية، لتحصل على أول شهادة.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/exams" className={buttonClass("primary", "lg")}>
                اختبارات الأجزاء
              </Link>
              <Link href="/nawawi" className={buttonClass("outline", "lg")}>
                الأربعون النووية
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-10">
            {session.learners
              .map((learner) => ({ learner, items: certificates.filter((certificate) => certificate.learner_id === learner.id) }))
              .filter(({ items }) => items.length > 0)
              .map(({ learner, items }) => (
                <section key={learner.id}>
                  <h2 className="mb-4 text-xl font-bold text-emerald-deep">
                    {learner.kind === "self" ? "شهاداتي" : `شهادات ${learner.display_name}`}
                  </h2>
                  <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((certificate) => (
                      <li key={certificate.verification_code}>
                        <Link
                          href={`/certificates/${certificate.verification_code}` as Route}
                          className="flex h-full flex-col rounded-3xl border border-gold/50 bg-linear-to-br from-gold-mist to-white p-5 shadow-soft transition-transform hover:-translate-y-0.5"
                        >
                          <Award className="size-8 text-gold-deep" aria-hidden />
                          <p className="mt-3 font-display text-lg font-bold text-emerald-deep">{certificate.subject}</p>
                          <p className="text-sm text-muted">
                            {certificate.holder_name} · {toArabicDigits(certificate.score)}/{toArabicDigits(certificate.total)} ·{" "}
                            {formatArabicDate(certificate.issued_at)}
                          </p>
                          {certificate.revoked_at && <p className="mt-2 text-sm font-bold text-rose">ملغاة</p>}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
          </div>
        )}
      </div>
    </>
  );
}
