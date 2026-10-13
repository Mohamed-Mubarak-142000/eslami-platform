"use client";

import { useState } from "react";
import { LayoutGroup, motion } from "framer-motion";
import { BookOpen, ExternalLink, HandHeart, Loader2, Pause, Play, ScrollText } from "lucide-react";
import { cn } from "@/lib/cn";
import { toArabicDigits } from "@/lib/arabic";
import { buttonClass } from "@/components/ui/button";
import { useAudio } from "@/features/audio/AudioProvider";
import { AyahNumber } from "@/features/quran/AyahNumber";
import { RUQYAH_QURAN, RUQYAH_SUNNAH, passageTracks, type RuqyahHadith, type RuqyahPassage } from "./ruqyahData";

type Tab = "quran" | "sunnah";
const TABS: { id: Tab; label: string; icon: typeof BookOpen }[] = [
  { id: "quran", label: "آيات الرقية", icon: BookOpen },
  { id: "sunnah", label: "من السنة النبوية", icon: ScrollText },
];

export function RuqyahView() {
  const [tab, setTab] = useState<Tab>("quran");
  const audio = useAudio();
  const playingId = audio.track?.id.startsWith("ruqyah:") ? audio.track.id : null;
  const fullQueue = RUQYAH_QURAN.flatMap(passageTracks);
  const playingAll = audio.queue.length === fullQueue.length && playingId !== null;

  function playPassage(passage: RuqyahPassage) {
    if (playingId?.startsWith(`ruqyah:${passage.id}:`) && !playingAll) {
      audio.toggle();
      return;
    }
    const queue = passageTracks(passage);
    audio.play(queue[0]!, { queue });
  }

  function playAll() {
    if (playingAll) {
      audio.toggle();
      return;
    }
    audio.play(fullQueue[0]!, { queue: fullQueue });
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6">
      <section className="rounded-3xl border border-gold/40 bg-gold-mist/60 p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold text-emerald-deep">
          <HandHeart className="size-5 text-gold-deep" aria-hidden /> قبل أن تبدأ
        </h2>
        <ul className="mt-3 list-disc space-y-1.5 ps-5 text-sm leading-7 text-ink">
          <li>الرقية دعاء وقراءة، والشفاء من الله وحده؛ فاقرأ بيقين وحضور قلب.</li>
          <li>يرقي المسلم نفسه وأهله، ويضع يده على موضع الألم، وينفث نفثًا خفيفًا كما كان النبي ﷺ يفعل.</li>
          <li>كل رقية ليس فيها شرك فلا بأس بها، واحذر من يطلب اسم الأم أو أثرًا من الثياب أو يكتب طلاسم.</li>
          <li>الرقية لا تغني عن الطبيب والدواء؛ فالتداوي مشروع، والأخذ بالأسباب من التوكل.</li>
        </ul>
      </section>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <LayoutGroup>
          <div className="flex gap-2" role="tablist" aria-label="أقسام الرقية">
            {TABS.map(({ id, label, icon: Icon }) => {
              const active = id === tab;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(id)}
                  className={cn(
                    "relative isolate inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-colors",
                    active ? "text-white" : "bg-white text-muted ring-1 ring-line hover:text-ink",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="ruqyah-tab"
                      className="absolute inset-0 -z-10 rounded-full bg-emerald shadow-soft"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <Icon className="size-4" aria-hidden /> {label}
                </button>
              );
            })}
          </div>
        </LayoutGroup>
        {tab === "quran" && (
          <button type="button" onClick={playAll} className={buttonClass("gold", "md")}>
            {playingAll && audio.playing ? <Pause aria-hidden /> : <Play aria-hidden />}
            {playingAll ? (audio.playing ? "إيقاف مؤقت" : "متابعة الاستماع") : "استمع للرقية كاملة"}
          </button>
        )}
      </div>

      {tab === "quran" ? (
        <ol className="mt-6 space-y-4">
          {RUQYAH_QURAN.map((passage) => {
            const current = !playingAll && playingId?.startsWith(`ruqyah:${passage.id}:`);
            return (
              <PassageCard
                key={passage.id}
                passage={passage}
                state={current ? (audio.loading ? "loading" : audio.playing ? "playing" : "paused") : null}
                activeAyah={playingId?.startsWith(`ruqyah:${passage.id}:`) ? Number(playingId.split(":").at(-1)) : null}
                onPlay={() => playPassage(passage)}
              />
            );
          })}
        </ol>
      ) : (
        <ol className="mt-6 grid gap-4 md:grid-cols-2">
          {RUQYAH_SUNNAH.map((hadith) => (
            <HadithCard key={hadith.id} hadith={hadith} />
          ))}
        </ol>
      )}

      <p className="mt-10 text-center text-xs leading-6 text-muted">
        الآيات من نص المصحف برواية حفص، والأحاديث بدرجاتها من{" "}
        <a
          href="https://hadeethenc.com/ar/home"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-4 hover:text-emerald"
        >
          موسوعة الأحاديث النبوية
        </a>
        . الآيات غير المعلَّمة بحديث هي ما جرت عادة أهل العلم بالرقية به، والقرآن كله شفاء.
      </p>
    </div>
  );
}

function PassageCard({
  passage,
  state,
  activeAyah,
  onPlay,
}: {
  passage: RuqyahPassage;
  state: "loading" | "playing" | "paused" | null;
  activeAyah: number | null;
  onPlay: () => void;
}) {
  const Icon = state === "loading" ? Loader2 : state === "playing" ? Pause : Play;
  const range =
    passage.from === passage.to
      ? `الآية ${toArabicDigits(passage.from)}`
      : `الآيات ${toArabicDigits(passage.from)}–${toArabicDigits(passage.to)}`;

  return (
    <li className={cn("rounded-[1.75rem] border bg-white p-5 sm:p-6", state ? "border-emerald/40" : "border-line")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-emerald-deep">{passage.title}</h3>
          <p className="mt-0.5 text-sm text-muted">
            {passage.surahName} — {range}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {passage.repeat && <span className="rounded-full bg-gold-mist px-2.5 py-0.5 text-xs font-bold text-gold-deep">ثلاث مرات</span>}
          <button
            type="button"
            onClick={onPlay}
            className={cn(
              "grid size-11 place-items-center rounded-full transition-colors",
              state ? "bg-emerald text-white" : "bg-emerald-mist text-emerald hover:bg-emerald hover:text-white",
            )}
            aria-label={state === "playing" ? `إيقاف ${passage.title} مؤقتًا` : `استماع إلى ${passage.title}`}
          >
            <Icon className={cn("size-5", state === "loading" && "animate-spin")} aria-hidden />
          </button>
        </div>
      </div>
      {passage.sunnah && (
        <p className="mt-3 inline-flex rounded-2xl bg-emerald-mist px-3 py-1.5 text-xs font-bold leading-6 text-emerald-deep">
          {passage.sunnah}
        </p>
      )}
      <p className="quran-text mt-4 text-2xl leading-[2.2] text-emerald-deep">
        {passage.ayahs.map((ayah) => (
          <span
            key={ayah.numberInSurah}
            className={cn("rounded-lg transition-colors", activeAyah === ayah.numberInSurah && "bg-gold-mist")}
          >
            {ayah.text} <AyahNumber number={ayah.numberInSurah} riwayaFont={null} />{" "}
          </span>
        ))}
      </p>
    </li>
  );
}

function HadithCard({ hadith }: { hadith: RuqyahHadith }) {
  return (
    <li className="flex flex-col rounded-[1.75rem] border border-line bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-gold-deep">{hadith.title}</h3>
        {hadith.repeat && <span className="rounded-full bg-gold-mist px-2.5 py-0.5 text-xs font-bold text-gold-deep">سبع مرات</span>}
      </div>
      {hadith.dua ? (
        <p className="quran-text mt-3 flex-1 text-2xl leading-[2.1] text-emerald-deep">{hadith.dua}</p>
      ) : (
        <p className="mt-3 flex-1 leading-8 text-ink">{hadith.hadith}</p>
      )}
      {hadith.dua && (
        <details className="group mt-3 rounded-2xl bg-ivory p-3 text-sm">
          <summary className="cursor-pointer font-bold text-muted marker:text-gold group-open:text-ink">نص الحديث</summary>
          <p className="mt-2 leading-8 text-ink">{hadith.hadith}</p>
        </details>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-emerald-mist px-2.5 py-0.5 font-bold text-emerald-deep">{hadith.grade}</span>
        <span className="text-muted">{hadith.attribution}</span>
        <a
          href={hadith.url}
          target="_blank"
          rel="noreferrer"
          className="ms-auto inline-flex items-center gap-1 text-muted underline underline-offset-4 hover:text-emerald"
        >
          الشرح <ExternalLink className="size-3" aria-hidden />
        </a>
      </div>
    </li>
  );
}
