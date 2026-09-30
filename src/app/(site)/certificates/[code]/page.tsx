import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { BadgeCheck, ShieldAlert } from "lucide-react";
import { toArabicDigits } from "@/lib/arabic";
import { buttonClass } from "@/components/ui/button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SITE_URL, isSupabaseConfigured } from "@/lib/supabase/env";
import { Certificate, juzOrdinal, type JuzScope } from "@/features/certificates/Certificate";
import { PrintButton } from "@/features/certificates/PrintButton";
import { getSurahs } from "@/features/quran/api";
import { getJuzStarts, getMushafPageStarts } from "@/features/quran/textApi";
import { getSurahAyahCount } from "@/features/kids/progress/surahAyahCounts";
import { buildJuzPages } from "@/features/plan/schedule";

/** First and last ayah (and mushaf pages) of a juz, from the cached Quran metadata; null if unavailable. */
async function juzScope(juz: number): Promise<JuzScope | null> {
  const [starts, pageStarts, surahs] = await Promise.all([getJuzStarts(), getMushafPageStarts(), getSurahs()]);
  const start = starts[juz - 1];
  if (!start || surahs.length === 0) return null;
  const next = starts[juz];
  const end = !next
    ? { surah: 114, ayah: getSurahAyahCount(114) }
    : next.ayah === 1
      ? { surah: next.surah - 1, ayah: getSurahAyahCount(next.surah - 1) }
      : { surah: next.surah, ayah: next.ayah - 1 };
  const name = (id: number) => surahs.find((surah) => surah.id === id)?.name ?? toArabicDigits(id);
  const pages = buildJuzPages(starts, pageStarts)[juz - 1];
  return {
    from: { surah: name(start.surah), ayah: start.ayah },
    to: { surah: name(end.surah), ayah: end.ayah },
    pages: pages ? { start: pages.startPage, end: pages.endPage } : undefined,
  };
}

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
  const scope = await juzScope(certificate.juz);

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
        scope={scope}
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
