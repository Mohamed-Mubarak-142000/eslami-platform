"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Loader2, Pause, Play, Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatDuration, toArabicDigits } from "@/lib/arabic";
import { normalizeArabic } from "@/lib/normalizeArabic";
import { useAudio, type AudioTrack } from "@/features/audio/AudioProvider";
import { EqualizerBars } from "@/features/audio/EqualizerBars";
import { SOUND_CATEGORIES, type SoundCategoryKey, type SoundCollection } from "./soundsApi";

interface SoundsLibraryProps {
  category: SoundCategoryKey;
  collections: SoundCollection[];
}

export function SoundsLibrary({ category, collections }: SoundsLibraryProps) {
  const audio = useAudio();
  const [collectionId, setCollectionId] = useState(collections[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const collection = collections.find((entry) => entry.id === collectionId) ?? collections[0];
  const { href, label } = SOUND_CATEGORIES[category];

  const queue = useMemo<AudioTrack[]>(
    () =>
      (collection?.tracks ?? []).map((track) => ({
        id: track.id,
        kind: "clip" as const,
        title: track.title,
        subtitle: `${label} · ${collection!.label}`,
        src: track.url,
        href,
      })),
    [collection, label, href],
  );
  const durations = useMemo(() => new Map(collection?.tracks.map((track) => [track.id, track.duration])), [collection]);

  const visible = useMemo(() => {
    const needle = normalizeArabic(query);
    return queue.filter((track) => !needle || normalizeArabic(track.title).includes(needle));
  }, [queue, query]);

  function playTrack(track: AudioTrack) {
    if (audio.isCurrent(track.id)) {
      audio.toggle();
      return;
    }
    audio.play(track, { queue });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <nav aria-label="أقسام الأدعية والابتهالات" className="flex flex-wrap gap-2">
        {Object.values(SOUND_CATEGORIES).map((entry) => (
          <Link
            key={entry.key}
            href={entry.href}
            aria-current={entry.key === category ? "page" : undefined}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-bold transition-colors",
              entry.key === category ? "bg-emerald text-white shadow-soft" : "border border-line bg-white text-ink hover:border-emerald/40",
            )}
          >
            {entry.label}
          </Link>
        ))}
      </nav>

      {collections.length === 0 ? (
        <p className="mt-8 rounded-3xl bg-white p-8 text-center text-muted">تعذّر تحميل هذا القسم الآن، حاول مرة أخرى بعد قليل.</p>
      ) : (
        <>
          {collections.length > 1 && (
            <div className="mt-6 grid gap-2 sm:grid-cols-2" role="group" aria-label="المجموعات">
              {collections.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  aria-pressed={entry.id === collection?.id}
                  onClick={() => {
                    setCollectionId(entry.id);
                    setQuery("");
                  }}
                  className={cn(
                    "rounded-2xl border p-3 text-start text-sm transition-colors",
                    entry.id === collection?.id ? "border-emerald bg-emerald-mist" : "border-line bg-white hover:border-emerald/40",
                  )}
                >
                  <span className="block font-bold text-emerald-deep">{entry.label}</span>
                  <span className="text-xs text-muted">{toArabicDigits(entry.tracks.length)} مقطع</span>
                </button>
              ))}
            </div>
          )}

          <label className="relative mt-6 mb-4 block">
            <span className="sr-only">ابحث بالاسم</span>
            <Search className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-muted" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ابحث بالعنوان أو اسم الشيخ…"
              className="h-12 w-full rounded-full border border-line bg-white pe-4 ps-12 outline-none focus:border-emerald/40"
            />
          </label>

          {visible.length === 0 && <p className="rounded-3xl bg-white p-8 text-center text-muted">لا توجد نتائج مطابقة.</p>}
          <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((track, index) => {
              const current = audio.isCurrent(track.id);
              const duration = durations.get(track.id) ?? 0;
              return (
                <li key={track.id}>
                  <button
                    type="button"
                    onClick={() => playTrack(track)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl border p-3 text-start transition-[border-color,background-color]",
                      current ? "border-emerald bg-emerald text-white shadow-soft" : "border-line bg-white hover:border-gold/60",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-10 shrink-0 place-items-center rounded-xl text-sm font-bold",
                        current ? "bg-white/15" : "bg-gold-mist text-gold-deep",
                      )}
                    >
                      {current && audio.loading ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                      ) : current && audio.playing ? (
                        <EqualizerBars active />
                      ) : (
                        toArabicDigits(index + 1)
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 font-bold leading-snug">{track.title}</span>
                      {duration > 0 && (
                        <span className={cn("mt-0.5 block text-xs", current ? "text-white/70" : "text-muted")}>
                          {formatDuration(duration)}
                        </span>
                      )}
                    </span>
                    {current && audio.playing ? (
                      <Pause className="size-4 shrink-0 fill-current" aria-hidden />
                    ) : (
                      <Play className={cn("size-4 shrink-0", current ? "fill-current" : "text-emerald")} aria-hidden />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
          {audio.error && queue.some((track) => audio.isCurrent(track.id)) && (
            <p role="status" className="mt-4 text-center text-sm text-rose">
              {audio.error}
            </p>
          )}
          <p className="mt-8 text-center text-xs text-muted">
            المقاطع من مجموعات عامة على{" "}
            <a href={`https://archive.org/details/${collection?.id}`} target="_blank" rel="noreferrer" className="underline">
              أرشيف الإنترنت
            </a>
            .
          </p>
        </>
      )}
    </div>
  );
}
