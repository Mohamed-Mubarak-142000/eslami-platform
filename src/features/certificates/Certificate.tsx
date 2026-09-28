import QRCode from "qrcode";
import { cn } from "@/lib/cn";
import { toArabicDigits } from "@/lib/arabic";
import { StarMark } from "@/components/ui/Ornament";
import { FrameCorner } from "@/features/quran/MushafFrame";

const JUZ_ORDINALS = [
  "الأول",
  "الثاني",
  "الثالث",
  "الرابع",
  "الخامس",
  "السادس",
  "السابع",
  "الثامن",
  "التاسع",
  "العاشر",
  "الحادي عشر",
  "الثاني عشر",
  "الثالث عشر",
  "الرابع عشر",
  "الخامس عشر",
  "السادس عشر",
  "السابع عشر",
  "الثامن عشر",
  "التاسع عشر",
  "العشرين",
  "الحادي والعشرين",
  "الثاني والعشرين",
  "الثالث والعشرين",
  "الرابع والعشرين",
  "الخامس والعشرين",
  "السادس والعشرين",
  "السابع والعشرين",
  "الثامن والعشرين",
  "التاسع والعشرين",
  "الثلاثين",
];

export function juzOrdinal(juz: number): string {
  return JUZ_ORDINALS[juz - 1] ?? toArabicDigits(juz);
}

const GREGORIAN = new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Cairo" });
const HIJRI = new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Africa/Cairo",
});

interface CertificateProps {
  holderName: string;
  juz: number;
  score: number;
  total: number;
  issuedAt: string;
  code: string;
  verifyUrl: string;
  revoked: boolean;
}

/** Printable certificate (server component): ornate mushaf-style frame, holder, juz, dates, QR to verification. */
export async function Certificate({ holderName, juz, score, total, issuedAt, code, verifyUrl, revoked }: CertificateProps) {
  const qr = await QRCode.toString(verifyUrl, {
    type: "svg",
    margin: 0,
    errorCorrectionLevel: "M",
    color: { dark: "#003e32", light: "#0000" },
  });
  const percent = total > 0 ? Math.round((score / total) * 100) : 0;
  const issued = new Date(issuedAt);

  return (
    <article
      aria-label={`شهادة اجتياز اختبار حفظ الجزء ${juzOrdinal(juz)} — ${holderName}`}
      className={cn(
        "print-area pattern-stars relative mx-auto w-full sm:aspect-[1.414] max-w-4xl rounded-4xl p-3 shadow-lift print:shadow-none",
        revoked && "grayscale",
      )}
      style={{ background: "var(--color-emerald-deep)", ["--page-bg" as string]: "#fbf6e8" }}
    >
      <div className="h-full rounded-[1.6rem] border-2 border-gold/80 p-1.5">
        <div
          className="relative flex h-full flex-col items-center justify-between rounded-[1.25rem] border border-gold/50 px-6 py-6 text-center sm:px-14 sm:py-10"
          style={{ background: "var(--page-bg)" }}
        >
          <FrameCorner className="right-1 top-1 -scale-x-100" />
          <FrameCorner className="left-1 top-1" />
          <FrameCorner className="bottom-1 right-1 rotate-180" />
          <FrameCorner className="bottom-1 left-1 -scale-y-100" />

          <header className="flex flex-col items-center">
            <StarMark className="size-8 text-gold sm:size-10" />
            <p className="mt-2 text-xs font-bold tracking-wide text-gold-deep sm:text-sm">منصة المنارة للقرآن الكريم</p>
            <h1 className="mt-2 font-display text-2xl font-bold text-emerald-deep sm:text-4xl">شهادة اجتياز اختبار حفظ</h1>
          </header>

          <div className="space-y-2 sm:space-y-4">
            <p className="text-sm text-ink/75 sm:text-lg">تشهد منصة المنارة بنجاح</p>
            <p className="font-display text-3xl font-bold text-emerald sm:text-5xl">{holderName}</p>
            <p className="text-sm leading-relaxed text-ink/80 sm:text-lg">
              في اختبار حفظ <span className="font-bold text-emerald-deep">الجزء {juzOrdinal(juz)}</span> من القرآن الكريم
              <br />
              بنسبة <span className="font-bold text-gold-deep">{toArabicDigits(percent)}٪</span> ({toArabicDigits(score)} من{" "}
              {toArabicDigits(total)}). وبالله التوفيق.
            </p>
          </div>

          <footer className="grid w-full grid-cols-[1fr_auto_1fr] items-end gap-3 text-[0.65rem] text-ink/70 sm:gap-6 sm:text-sm">
            <div className="text-start">
              <p className="font-bold text-emerald-deep">تاريخ الإصدار</p>
              <p>{HIJRI.format(issued)}</p>
              <p>{GREGORIAN.format(issued)}</p>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="size-16 sm:size-24 [&_svg]:size-full" dangerouslySetInnerHTML={{ __html: qr }} aria-hidden />
              <p className="font-mono text-[0.6rem] tracking-widest text-emerald-deep sm:text-xs" dir="ltr">
                {code}
              </p>
            </div>
            <div className="text-end">
              <p className="font-bold text-emerald-deep">التحقق من الشهادة</p>
              <p>امسح الرمز أو أدخل رقم الشهادة</p>
              <p className="text-[0.6rem] text-muted sm:text-xs">الشهادة تقيس الحفظ، وليست إجازة في التلاوة</p>
            </div>
          </footer>

          {revoked && (
            <p className="absolute inset-x-0 top-1/2 mx-auto w-fit -translate-y-1/2 -rotate-12 rounded-2xl border-4 border-rose px-6 py-2 text-3xl font-bold text-rose sm:text-5xl">
              ملغاة
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
