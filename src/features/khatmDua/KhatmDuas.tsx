import { ExternalLink, Info } from "lucide-react";
import { toArabicDigits } from "@/lib/arabic";
import { QURAN_DUAS, SUNNAH_DUAS } from "./khatmDuaData";

/** The khatm duas: a note on what is (and isn't) established, then the Quranic and prophetic duas. */
export function KhatmDuas() {
  return (
    <div className="space-y-8">
      <section className="flex gap-3 rounded-3xl border border-gold/40 bg-gold-mist/60 p-5 text-sm leading-7 text-ink">
        <Info className="mt-1 size-5 shrink-0 text-gold-deep" aria-hidden />
        <div className="space-y-2">
          <p>
            لم يثبت عن النبي ﷺ دعاء مخصوص بختم القرآن، وثبت عن أنس بن مالك رضي الله عنه أنه كان إذا ختم القرآن جمع أهله ودعا. فادعُ بما شئت
            من خيري الدنيا والآخرة، وأفضله ما جاء في القرآن والسنة.
          </p>
          <p className="text-muted">الدعاء المتداول المنسوب إلى شيخ الإسلام ابن تيمية لا تثبت نسبته إليه.</p>
        </div>
      </section>

      <section aria-labelledby="khatm-quran">
        <h2 id="khatm-quran" className="text-xl font-bold text-emerald-deep">
          من القرآن الكريم
        </h2>
        <ol className="mt-4 space-y-3">
          {QURAN_DUAS.map((dua) => (
            <li key={dua.key} className="rounded-3xl border border-line bg-white p-5">
              <p className="quran-text text-2xl leading-[2.1] text-emerald-deep">
                {dua.partial && "… "}
                {dua.text} <span className="ayah-mark">﴿{toArabicDigits(dua.ayah)}﴾</span>
              </p>
              <p className="mt-2 text-xs text-muted">
                {dua.surahName}، الآية {toArabicDigits(dua.ayah)}
                {dua.note && <span className="text-gold-deep"> — {dua.note}</span>}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="khatm-sunnah">
        <h2 id="khatm-sunnah" className="text-xl font-bold text-emerald-deep">
          من السنة النبوية
        </h2>
        <ol className="mt-4 space-y-3">
          {SUNNAH_DUAS.map((dua) => (
            <li key={dua.id} className="rounded-3xl border border-line bg-white p-5">
              <p className="text-sm font-bold text-gold-deep">{dua.title}</p>
              <p className="quran-text mt-2 text-2xl leading-[2.1] text-emerald-deep">{dua.dua}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-emerald-mist px-2.5 py-0.5 font-bold text-emerald-deep">{dua.grade}</span>
                <span className="text-muted">{dua.attribution}</span>
                <a
                  href={dua.url}
                  target="_blank"
                  rel="noreferrer"
                  className="ms-auto inline-flex items-center gap-1 text-muted underline underline-offset-4 hover:text-emerald"
                >
                  الشرح <ExternalLink className="size-3" aria-hidden />
                </a>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
