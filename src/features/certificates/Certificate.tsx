import QRCode from "qrcode";
import { cn } from "@/lib/cn";
import { toArabicDigits } from "@/lib/arabic";
import { Divider } from "@/components/ui/Ornament";
import { BrandMark } from "@/components/site/BrandMark";
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

/** Where the juz starts and ends in the Mushaf, when the Quran metadata is available. */
export interface JuzScope {
  from: { surah: string; ayah: number };
  to: { surah: string; ayah: number };
  pages?: { start: number; end: number } | undefined;
}

interface CertificateProps {
  holderName: string;
  juz: number;
  score: number;
  total: number;
  issuedAt: string;
  code: string;
  verifyUrl: string;
  revoked: boolean;
  scope?: JuzScope | null;
}

function gradeLabel(percent: number): string {
  if (percent >= 90) return "ممتاز";
  if (percent >= 80) return "جيد جدًا";
  if (percent >= 70) return "جيد";
  return "مقبول";
}

/*
 * Sized in container units (cqw) so one layout scales from a phone to a printed A4-landscape sheet;
 * each size has a rem floor so small screens stay readable (the fixed aspect ratio starts at `sm`).
 */
const TEXT = {
  xs: "text-[max(0.62rem,1.05cqw)]",
  sm: "text-[max(0.72rem,1.3cqw)]",
  md: "text-[max(0.85rem,1.65cqw)]",
  lg: "text-[max(1rem,2cqw)]",
  title: "text-[max(1.6rem,3.9cqw)]",
  name: "text-[max(1.9rem,4.6cqw)]",
};
const CORNER = "size-[max(2.5rem,5.5cqw)]!";

/** Printable certificate (server component): ornate mushaf-style frame, holder, juz, result, dates, QR to verification. */
export async function Certificate({ holderName, juz, score, total, issuedAt, code, verifyUrl, revoked, scope }: CertificateProps) {
  const qr = await QRCode.toString(verifyUrl, {
    type: "svg",
    margin: 0,
    errorCorrectionLevel: "M",
    color: { dark: "#003e32", light: "#0000" },
  });
  const percent = total > 0 ? Math.round((score / total) * 100) : 0;
  const grade = gradeLabel(percent);
  const issued = new Date(issuedAt);
  const details: [string, string][] = [
    ["الدرجة", `${toArabicDigits(score)} من ${toArabicDigits(total)}`],
    ["النسبة", `${toArabicDigits(percent)}٪`],
    ["التقدير", grade],
    scope?.pages
      ? ["صفحات المصحف", `${toArabicDigits(scope.pages.start)} – ${toArabicDigits(scope.pages.end)}`]
      : ["رقم الجزء", toArabicDigits(juz)],
  ];

  return (
    <article
      aria-label={`شهادة اجتياز اختبار حفظ الجزء ${juzOrdinal(juz)} — ${holderName}`}
      className={cn(
        "print-area @container pattern-stars-light relative mx-auto flex w-full max-w-5xl rounded-4xl bg-emerald-deep p-[max(0.5rem,1.6cqw)] shadow-lift sm:aspect-[1.414] print:rounded-none print:shadow-none",
        revoked && "grayscale",
      )}
      style={{ ["--page-bg" as string]: "#fbf6e8" }}
    >
      <div className="flex min-w-0 flex-1 rounded-[max(1.1rem,2.2cqw)] border-[max(1.5px,0.22cqw)] border-gold p-[max(0.25rem,0.45cqw)]">
        <div
          className="relative flex min-w-0 flex-1 flex-col items-center justify-between gap-[max(0.75rem,1.2cqw)] overflow-hidden rounded-[max(0.9rem,1.7cqw)] border border-gold/60 px-[max(1rem,6cqw)] py-[max(1.25rem,3cqw)] text-center"
          style={{ background: "var(--page-bg)" }}
        >
          <div className="pattern-stars pointer-events-none absolute inset-0 opacity-35" aria-hidden />
          <FrameCorner className={cn("right-1 top-1 -scale-x-100", CORNER)} />
          <FrameCorner className={cn("left-1 top-1", CORNER)} />
          <FrameCorner className={cn("bottom-1 right-1 rotate-180", CORNER)} />
          <FrameCorner className={cn("bottom-1 left-1 -scale-y-100", CORNER)} />

          <header className="relative flex flex-col items-center">
            <BrandMark priority className="h-[max(3rem,6cqw)]" />
            <p className={cn("mt-[0.5cqw] font-bold tracking-wide text-gold-deep", TEXT.sm)}>منصة المنارة للقرآن الكريم</p>
            <h1 className={cn("mt-[0.3cqw] font-display font-bold leading-tight text-emerald-deep", TEXT.title)}>
              شهادة اجتياز اختبار حفظ
            </h1>
            <p
              className={cn(
                "mt-[0.8cqw] rounded-full bg-emerald-deep px-[max(1.25rem,2.6cqw)] py-[max(0.2rem,0.35cqw)] font-display font-bold text-gold-soft",
                TEXT.lg,
              )}
            >
              الجزء {juzOrdinal(juz)}
            </p>
          </header>

          <div className="relative">
            <p className={cn("text-ink/75", TEXT.md)}>تشهد منصة المنارة بأنّ</p>
            <p className={cn("mt-[0.3cqw] font-display font-bold leading-snug text-gold-deep", TEXT.name)}>{holderName}</p>
            <Divider className="mx-auto mt-[0.6cqw] w-[max(10rem,26cqw)]" />
            <p className={cn("mx-auto mt-[0.9cqw] max-w-[68cqw] leading-relaxed text-ink/85", TEXT.md)}>
              قد اجتاز اختبار حفظ <span className="font-bold text-emerald-deep">الجزء {juzOrdinal(juz)}</span> من القرآن الكريم
              {scope && (
                <>
                  {" "}
                  (من سورة {scope.from.surah} الآية {toArabicDigits(scope.from.ayah)} إلى سورة {scope.to.surah} الآية{" "}
                  {toArabicDigits(scope.to.ayah)})
                </>
              )}{" "}
              بتقدير <span className="font-bold text-gold-deep">{grade}</span>، سائلين الله أن يجعل القرآن ربيع قلبه ونور صدره، وأن يرزقه
              العمل به.
            </p>
          </div>

          <dl className="relative grid w-full max-w-[72cqw] grid-cols-2 gap-[max(0.5rem,1cqw)] sm:grid-cols-4">
            {details.map(([label, value]) => (
              <div
                key={label}
                className="rounded-[max(0.75rem,1.4cqw)] border border-gold/40 bg-white/70 px-[1cqw] py-[max(0.4rem,0.7cqw)]"
              >
                <dd className={cn("font-display font-bold text-emerald-deep", TEXT.lg)}>{value}</dd>
                <dt className={cn("font-semibold text-muted", TEXT.xs)}>{label}</dt>
              </div>
            ))}
          </dl>

          <p className={cn("relative font-quran text-emerald-deep", TEXT.lg)}>
            «خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ» <span className={cn("font-sans text-muted", TEXT.xs)}>— رواه البخاري</span>
          </p>

          <footer className={cn("relative grid w-full grid-cols-[1fr_auto_1fr] items-end gap-[max(0.75rem,2.5cqw)] text-ink/75", TEXT.sm)}>
            <div className="text-start">
              <p className="font-bold text-emerald-deep">تاريخ الإصدار</p>
              <p>{HIJRI.format(issued)}</p>
              <p>{GREGORIAN.format(issued)}</p>
            </div>
            <div className="flex flex-col items-center gap-[0.4cqw]">
              <div className="rounded-[max(0.6rem,1cqw)] border-2 border-double border-gold bg-white p-[max(0.3rem,0.6cqw)]">
                <div className="size-[max(4rem,8.5cqw)] [&_svg]:size-full" dangerouslySetInnerHTML={{ __html: qr }} aria-hidden />
              </div>
              <p className={cn("font-mono tracking-widest text-emerald-deep", TEXT.xs)} dir="ltr">
                {code}
              </p>
            </div>
            <div className="text-end">
              <p className="font-bold text-emerald-deep">التحقق من الشهادة</p>
              <p>امسح الرمز أو أدخل رقم الشهادة</p>
              <p className={cn("text-muted", TEXT.xs)}>الشهادة تقيس الحفظ، وليست إجازة في التلاوة</p>
            </div>
          </footer>

          {revoked && (
            <p
              className={cn(
                "absolute inset-x-0 top-1/2 mx-auto w-fit -translate-y-1/2 -rotate-12 rounded-2xl border-4 border-rose bg-white/80 px-[3cqw] py-[1cqw] font-bold text-rose",
                TEXT.name,
              )}
            >
              ملغاة
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
