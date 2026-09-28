import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { BadgeCheck, ShieldAlert } from "lucide-react";
import { toArabicDigits } from "@/lib/arabic";
import { buttonClass } from "@/components/ui/button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SITE_URL, isSupabaseConfigured } from "@/lib/supabase/env";
import { Certificate, juzOrdinal } from "@/features/certificates/Certificate";
import { PrintButton } from "@/features/certificates/PrintButton";

const CODE_PATTERN = /^[A-Z2-9]{5}-[A-Z2-9]{5}$/;

const findCertificate = cache(async (raw: string) => {
  const code = decodeURIComponent(raw).trim().toUpperCase();
  if (!isSupabaseConfigured || !CODE_PATTERN.test(code)) return null;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.rpc("verify_certificate", { code });
  const row = data?.[0];
  return row ? { ...row, code } : null;
});

export async function generateMetadata({ params }: PageProps<"/certificates/[code]">): Promise<Metadata> {
  const certificate = await findCertificate((await params).code);
  if (!certificate) return { title: "شهادة غير موجودة", robots: { index: false } };
  return {
    title: `شهادة ${certificate.holder_name} — الجزء ${juzOrdinal(certificate.juz)}`,
    description: `شهادة اجتياز اختبار حفظ الجزء ${juzOrdinal(certificate.juz)} من القرآن الكريم على منصة المنارة.`,
    robots: { index: false },
  };
}

export default async function CertificatePage({ params }: PageProps<"/certificates/[code]">) {
  const certificate = await findCertificate((await params).code);
  if (!certificate) notFound();
  const verifyUrl = `${SITE_URL}/certificates/${certificate.code}`;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10 sm:px-6">
      <div
        role="status"
        className={
          certificate.revoked
            ? "flex items-center gap-3 rounded-3xl bg-rose/10 p-4 font-bold text-rose"
            : "flex items-center gap-3 rounded-3xl bg-emerald-mist p-4 font-bold text-emerald-deep"
        }
      >
        {certificate.revoked ? (
          <ShieldAlert className="size-6 shrink-0" aria-hidden />
        ) : (
          <BadgeCheck className="size-6 shrink-0" aria-hidden />
        )}
        {certificate.revoked
          ? "هذه الشهادة أُلغيت من إدارة المنصة ولم تعد سارية."
          : `شهادة صحيحة صادرة من منصة المنارة لـ ${certificate.holder_name} — الجزء ${juzOrdinal(certificate.juz)} (${toArabicDigits(certificate.score)}/${toArabicDigits(certificate.total)}).`}
      </div>

      <Certificate
        holderName={certificate.holder_name}
        juz={certificate.juz}
        score={certificate.score}
        total={certificate.total}
        issuedAt={certificate.issued_at}
        code={certificate.code}
        verifyUrl={verifyUrl}
        revoked={certificate.revoked}
      />

      {!certificate.revoked && (
        <div className="flex flex-wrap justify-center gap-3">
          <PrintButton />
          <Link href="/exams" className={buttonClass("outline", "lg")}>
            اختبر جزءًا آخر
          </Link>
        </div>
      )}
    </div>
  );
}
