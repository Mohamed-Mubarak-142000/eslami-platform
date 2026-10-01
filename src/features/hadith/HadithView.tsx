import type { ReactNode } from "react";
import { BookMarked, CheckCircle2, ExternalLink, Library, ScrollText } from "lucide-react";
import { cn } from "@/lib/cn";
import { HADEETHENC_URL, type Hadith } from "./api";
import { CopyHadith } from "./CopyHadith";

/** A titled panel in the style of a hadith card: a gold tab above a framed box. */
export function HadithPanel({
  title,
  icon,
  children,
  className,
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("relative pt-6", className)}>
      <h2 className="absolute top-0 start-0 z-10 inline-flex items-center gap-2 rounded-t-2xl rounded-be-2xl bg-gold-deep px-5 py-2 text-lg font-bold text-white shadow-soft">
        {icon}
        {title}
      </h2>
      <div className="rounded-3xl rounded-ss-none border border-gold/30 border-e-4 border-e-emerald bg-parchment px-5 pb-5 pt-9 sm:px-7 sm:pb-7">
        {children}
      </div>
    </section>
  );
}

/** Colours the Prophet's words (between «») apart from the narration around them. */
export function HadithText({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/(«[^»]*»)/g).filter(Boolean);
  return (
    <p className={cn("text-xl leading-[2.2] text-ink sm:text-2xl sm:leading-[2.3]", className)}>
      {parts.map((part, index) =>
        part.startsWith("«") ? (
          <span key={index} className="font-semibold text-emerald-deep">
            {part}
          </span>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </p>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-sm">
      <span className="text-muted">{label}:</span> <span className="font-bold text-emerald-deep">{value}</span>
    </span>
  );
}

export function HadithView({ hadith }: { hadith: Hadith }) {
  return (
    <article className="space-y-8">
      <HadithPanel title="الحديث" icon={<ScrollText className="size-5" aria-hidden />}>
        <HadithText text={hadith.text} />
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {hadith.attribution && <Chip label="التخريج" value={hadith.attribution} />}
          {hadith.grade && <Chip label="الدرجة" value={hadith.grade} />}
          <CopyHadith text={`${hadith.text}\n${hadith.attribution}`} />
        </div>
      </HadithPanel>

      {hadith.explanation && (
        <HadithPanel title="شرح الحديث" icon={<BookMarked className="size-5" aria-hidden />}>
          <div className="space-y-4 text-lg leading-[2.1] text-ink">
            {hadith.explanation.split(/\n+/).map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </HadithPanel>
      )}

      {hadith.benefits.length > 0 && (
        <HadithPanel title="من فوائد الحديث" icon={<CheckCircle2 className="size-5" aria-hidden />}>
          <ul className="space-y-3">
            {hadith.benefits.map((benefit, index) => (
              <li key={index} className="flex gap-3 text-lg leading-9 text-ink">
                <CheckCircle2 className="mt-2 size-5 shrink-0 text-emerald" aria-hidden />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </HadithPanel>
      )}

      {hadith.words.length > 0 && (
        <HadithPanel title="معاني الكلمات" icon={<Library className="size-5" aria-hidden />}>
          <dl className="divide-y divide-gold/20">
            {hadith.words.map((entry, index) => (
              <div key={index} className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
                <dt className="font-bold text-emerald-deep">{entry.word}</dt>
                <dd className="leading-8 text-ink">{entry.meaning}</dd>
              </div>
            ))}
          </dl>
        </HadithPanel>
      )}

      {hadith.references.length > 0 && (
        <details className="rounded-3xl border border-line bg-white p-5">
          <summary className="cursor-pointer font-bold text-emerald-deep">المراجع</summary>
          <ul className="mt-3 space-y-1.5 text-sm leading-7 text-muted">
            {hadith.references.map((reference, index) => (
              <li key={index}>{reference}</li>
            ))}
          </ul>
        </details>
      )}

      <p className="text-center text-sm text-muted">
        المصدر:{" "}
        <a
          href={HADEETHENC_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-bold text-emerald hover:underline"
        >
          موسوعة الأحاديث النبوية <ExternalLink className="size-3.5" aria-hidden />
        </a>
      </p>
    </article>
  );
}
