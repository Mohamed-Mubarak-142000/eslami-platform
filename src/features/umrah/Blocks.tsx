"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ExternalLink, Info, Loader2, MapPin, Pause, ScrollText, Users, Volume2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { toArabicDigits } from "@/lib/arabic";
import { useAudio, type AudioTrack } from "@/features/audio/AudioProvider";
import { DUAS, duaAudioUrl } from "@/features/adhkar/duasData";
import { alafasyAyahUrl } from "@/features/quran/ayahAudio";
import { HADITHS, MIQATS, VERSES, type Block, type HadithKey, type VerseKey } from "./umrahGuide";
import { SaiCounter, TawafCounter } from "./Counters";
import { updateUmrah, useUmrah } from "./umrahStore";

/** Play a track in the shared player, or pause/resume it if it's the one loaded. */
function useListen(track: AudioTrack) {
  const audio = useAudio();
  const current = audio.isCurrent(track.id);
  const state = current ? (audio.loading ? "loading" : audio.playing ? "playing" : "paused") : null;
  const toggle = () => (current ? audio.toggle() : audio.play(track));
  return { state, toggle };
}

function ListenButton({ track, label }: { track: AudioTrack; label: string }) {
  const { state, toggle } = useListen(track);
  const Icon = state === "loading" ? Loader2 : state === "playing" ? Pause : Volume2;
  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-bold transition-colors",
        state ? "bg-emerald text-white" : "bg-emerald-mist text-emerald hover:bg-emerald hover:text-white",
      )}
      aria-label={state === "playing" ? `إيقاف ${label} مؤقتًا` : `استماع: ${label}`}
    >
      <Icon className={cn("size-4", state === "loading" && "animate-spin")} aria-hidden />
      {state === "playing" ? "إيقاف" : "استمع"}
    </button>
  );
}

function DuaBlock({ id, when }: { id: string; when?: string | undefined }) {
  const dua = DUAS.find((entry) => entry.id === id);
  if (!dua) return null;
  const src = duaAudioUrl(dua);
  return (
    <figure className="rounded-3xl border border-line bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <figcaption>
          {when && <span className="block text-xs font-bold text-gold-deep">{when}</span>}
          <span className="font-bold text-emerald-deep">{dua.title}</span>
        </figcaption>
        <ListenButton
          track={{ id: `dhikr:${src}`, kind: "clip", title: dua.title, subtitle: "حصن المسلم", src, href: "/umrah" }}
          label={dua.title}
        />
      </div>
      <p className="quran-text mt-3 text-[1.45em] leading-[2.1] text-emerald-deep">{dua.text}</p>
      <a
        href={dua.sourceUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-1 inline-block text-xs text-muted underline underline-offset-4 hover:text-emerald"
      >
        {dua.source}
      </a>
    </figure>
  );
}

function VerseBlock({ verseKey, when }: { verseKey: VerseKey; when?: string | undefined }) {
  const verse = VERSES[verseKey];
  const label = `سورة البقرة، الآية ${toArabicDigits(verse.ayah)}`;
  return (
    <figure className="rounded-3xl bg-emerald-deep p-5 text-white">
      <div className="flex items-start justify-between gap-3">
        <figcaption>
          {when && <span className="block text-xs font-bold text-gold-soft">{when}</span>}
          <span className="text-sm text-white/75">{label}</span>
        </figcaption>
        <ListenButton
          track={{
            id: `umrah-verse:${verse.audio}`,
            kind: "ayah",
            title: label,
            subtitle: "مشاري العفاسي",
            src: alafasyAyahUrl(verse.audio),
            href: "/umrah",
          }}
          label={label}
        />
      </div>
      <p className="quran-text mt-3 text-[1.55em] leading-[2.2]">
        {verse.partial && "… "}﴿{verse.text}﴾
      </p>
    </figure>
  );
}

function EvidenceBlock({ keys }: { keys: HadithKey[] }) {
  return (
    <details className="group rounded-3xl border border-line bg-ivory p-4">
      <summary className="flex cursor-pointer list-none items-center gap-2 font-bold text-emerald-deep [&::-webkit-details-marker]:hidden">
        <ScrollText className="size-5 text-gold-deep" aria-hidden />
        الدليل من السنة
        <span className="ms-auto text-xs font-normal text-muted group-open:hidden">{toArabicDigits(keys.length)} حديث</span>
      </summary>
      <ul className="mt-3 space-y-4">
        {keys.map((key) => {
          const hadith = HADITHS[key];
          return (
            <li key={key} className="border-t border-line pt-3 first:border-0 first:pt-0">
              <p className="leading-8 text-ink">{hadith.text}</p>
              <p className="mt-2 flex flex-wrap items-center gap-2 text-xs">
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
              </p>
            </li>
          );
        })}
      </ul>
    </details>
  );
}

const NOTE_STYLES = {
  info: { icon: Info, box: "border-gold/40 bg-gold-mist/60", title: "text-gold-deep" },
  mistake: { icon: AlertTriangle, box: "border-rose/30 bg-rose/5", title: "text-rose" },
  women: { icon: Users, box: "border-sky/30 bg-sky/5", title: "text-sky" },
} as const;

function NoteBlock({ tone, title, items }: { tone: keyof typeof NOTE_STYLES; title: string; items: string[] }) {
  const style = NOTE_STYLES[tone];
  const Icon = style.icon;
  return (
    <aside className={cn("rounded-3xl border p-5", style.box)}>
      <h4 className={cn("flex items-center gap-2 font-bold", style.title)}>
        <Icon className="size-5" aria-hidden /> {title}
      </h4>
      <ul className="mt-2 list-disc space-y-1.5 ps-5 leading-7 text-ink">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </aside>
  );
}

function MiqatPicker() {
  const { origin } = useUmrah();
  const chosen = MIQATS.find((entry) => entry.id === origin) ?? MIQATS[0]!;
  return (
    <section aria-labelledby="miqat-picker" className="rounded-3xl border border-line bg-white p-5">
      <h4 id="miqat-picker" className="font-bold text-emerald-deep">
        من أين ستبدأ رحلتك؟
      </h4>
      <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="مكان الانطلاق">
        {MIQATS.map((entry) => {
          const active = entry.id === chosen.id;
          return (
            <button
              key={entry.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => updateUmrah((current) => ({ ...current, origin: entry.id }))}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-bold transition-colors",
                active ? "bg-emerald text-white" : "bg-ivory text-muted ring-1 ring-line hover:text-ink",
              )}
            >
              {entry.from}
            </button>
          );
        })}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={chosen.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="mt-4 flex gap-3 rounded-2xl bg-gold-mist/70 p-4"
        >
          <MapPin className="mt-1 size-6 shrink-0 text-gold-deep" aria-hidden />
          <div>
            <p className="text-sm text-muted">ميقاتك</p>
            <p className="font-display text-xl font-bold text-emerald-deep">{chosen.miqat}</p>
            <p className="mt-1 leading-7 text-ink">{chosen.detail}</p>
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

export function BlockView({ block }: { block: Block }) {
  switch (block.kind) {
    case "text":
      return <p className="leading-8 text-ink">{block.text}</p>;
    case "steps":
      return (
        <ol className="space-y-3">
          {block.items.map((item, index) => (
            <li key={item} className="flex gap-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-emerald-mist text-sm font-bold text-emerald-deep">
                {toArabicDigits(index + 1)}
              </span>
              <span className="pt-0.5 leading-7 text-ink">{item}</span>
            </li>
          ))}
        </ol>
      );
    case "dua":
      return <DuaBlock id={block.id} when={block.when} />;
    case "verse":
      return <VerseBlock verseKey={block.key} when={block.when} />;
    case "evidence":
      return <EvidenceBlock keys={block.keys} />;
    case "note":
      return <NoteBlock tone={block.tone} title={block.title} items={block.items} />;
    case "miqat":
      return <MiqatPicker />;
    case "tawaf":
      return <TawafCounter />;
    case "sai":
      return <SaiCounter />;
  }
}
