"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Pause, Play, Search, Users } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatDuration, toArabicDigits } from "@/lib/arabic";
import { normalizeArabic } from "@/lib/normalizeArabic";
import { useAudio, type AudioTrack } from "@/features/audio/AudioProvider";
import { EqualizerBars } from "@/features/audio/EqualizerBars";
import { loadHls } from "@/features/audio/hlsSource";
import { ReciterAvatar } from "@/features/listen/ReciterBrowser";
import { SOUND_CATEGORIES, bareArtistName, type SoundArtist, type SoundCategoryKey, type SoundLibrary } from "./soundsApi";

const ALL = "all";
const VOICE_LABEL: Record<SoundCategoryKey, string> = {
  ibtihalat: "المبتهلون",
  tawasheeh: "المنشدون",
  duas: "الأصوات",
  adhan: "المؤذنون",
};

function ArtistAvatar({ artist, className }: { artist: SoundArtist; className: string }) {
  const [broken, setBroken] = useState(false);
  if (!artist.image || broken) return <ReciterAvatar name={bareArtistName(artist.name)} className={className} />;
  return (
    <Image
      src={artist.image}
      alt=""
      width={96}
      height={96}
      unoptimized
      loading="lazy"
      onError={() => setBroken(true)}
      className={cn("shrink-0 rounded-full bg-gold-mist object-cover shadow-soft", className)}
    />
  );
}

interface SoundsLibraryProps {
  category: SoundCategoryKey;
  library: SoundLibrary;
}

export function SoundsLibrary({ category, library }: SoundsLibraryProps) {
  const audio = useAudio();
  const [artistId, setArtistId] = useState(ALL);
  const [query, setQuery] = useState("");
  const { href, label } = SOUND_CATEGORIES[category];
  const artists = useMemo(() => new Map(library.artists.map((artist) => [artist.id, artist])), [library.artists]);

  // Most of the radio's recordings are HLS; fetch the player early so the first tap starts quickly.
  useEffect(() => {
    if (library.tracks.some((track) => track.hls)) void loadHls().catch(() => {});
  }, [library.tracks]);

  const visible = useMemo(() => {
    const needle = normalizeArabic(query);
    return library.tracks.filter((track) => {
      if (artistId !== ALL && track.artistId !== artistId) return false;
      if (!needle) return true;
      const artist = artists.get(track.artistId)?.name ?? "";
      return normalizeArabic(`${track.title} ${artist}`).includes(needle);
    });
  }, [library.tracks, artistId, query, artists]);

  const queue = useMemo<AudioTrack[]>(
    () =>
      visible.map((track) => ({
        id: track.id,
        kind: "clip" as const,
        title: track.title,
        subtitle: artists.get(track.artistId)?.name ?? label,
        src: track.src,
        hls: track.hls,
        href,
      })),
    [visible, artists, label, href],
  );

  function playTrack(track: AudioTrack) {
    if (audio.isCurrent(track.id)) {
      audio.toggle();
      return;
    }
    audio.play(track, { queue });
  }

  const selected = artistId === ALL ? null : artists.get(artistId);
  const trackById = useMemo(() => new Map(library.tracks.map((track) => [track.id, track])), [library.tracks]);

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

      {library.tracks.length === 0 ? (
        <p className="mt-8 rounded-3xl bg-white p-8 text-center text-muted">تعذّر تحميل هذا القسم الآن، حاول مرة أخرى بعد قليل.</p>
      ) : (
        <>
          <section aria-labelledby="voices-title" className="mt-8">
            <h2 id="voices-title" className="text-sm font-bold text-muted">
              {VOICE_LABEL[category]} · {toArabicDigits(library.artists.length)}
            </h2>
            <div
              className="-mx-4 mt-3 flex snap-x gap-3 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6"
              role="group"
              aria-label={VOICE_LABEL[category]}
            >
              <button
                type="button"
                aria-pressed={artistId === ALL}
                onClick={() => setArtistId(ALL)}
                className={cn(
                  "flex w-28 shrink-0 snap-start flex-col items-center gap-2 rounded-3xl border p-3 text-center transition-colors",
                  artistId === ALL ? "border-emerald bg-emerald-mist" : "border-line bg-white hover:border-emerald/40",
                )}
              >
                <span className="grid size-16 place-items-center rounded-full bg-emerald text-white shadow-soft">
                  <Users className="size-7" aria-hidden />
                </span>
                <span className="text-sm font-bold leading-tight text-emerald-deep">الكل</span>
                <span className="text-xs text-muted">{toArabicDigits(library.tracks.length)}</span>
              </button>
              {library.artists.map((artist) => (
                <button
                  key={artist.id}
                  type="button"
                  aria-pressed={artistId === artist.id}
                  onClick={() => setArtistId(artist.id)}
                  className={cn(
                    "flex w-28 shrink-0 snap-start flex-col items-center gap-2 rounded-3xl border p-3 text-center transition-colors",
                    artistId === artist.id ? "border-emerald bg-emerald-mist" : "border-line bg-white hover:border-emerald/40",
                  )}
                >
                  <ArtistAvatar artist={artist} className="size-16 text-2xl" />
                  <span className="line-clamp-2 text-sm font-bold leading-tight text-emerald-deep">{bareArtistName(artist.name)}</span>
                  <span className="text-xs text-muted">{toArabicDigits(artist.count)}</span>
                </button>
              ))}
            </div>
          </section>

          <label className="relative mt-4 mb-4 block">
            <span className="sr-only">ابحث بالعنوان أو اسم الشيخ</span>
            <Search className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-muted" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={selected ? `ابحث في ${label} ${bareArtistName(selected.name)}…` : "ابحث بالعنوان أو اسم الشيخ…"}
              className="h-12 w-full rounded-full border border-line bg-white pe-4 ps-12 outline-none focus:border-emerald/40"
            />
          </label>

          {visible.length === 0 && <p className="rounded-3xl bg-white p-8 text-center text-muted">لا توجد نتائج مطابقة.</p>}
          <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {queue.map((track) => {
              const current = audio.isCurrent(track.id);
              const source = trackById.get(track.id);
              const artist = source ? artists.get(source.artistId) : undefined;
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
                    <span className="relative shrink-0">
                      {artist ? <ArtistAvatar artist={artist} className="size-11 text-lg" /> : <span className="block size-11" />}
                      {current && (
                        <span className="absolute inset-0 grid place-items-center rounded-full bg-emerald-night/70 text-white">
                          {audio.loading ? (
                            <Loader2 className="size-4 animate-spin" aria-hidden />
                          ) : audio.playing ? (
                            <EqualizerBars active />
                          ) : null}
                        </span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 font-bold leading-snug">{track.title}</span>
                      <span className={cn("mt-0.5 block truncate text-xs", current ? "text-white/75" : "text-muted")}>
                        {artist && bareArtistName(artist.name)}
                        {source && source.duration > 0 && ` · ${formatDuration(source.duration)}`}
                      </span>
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
            المصدر:{" "}
            <a href="https://misrquran.gov.eg/" target="_blank" rel="noreferrer" className="underline">
              مكتبة إذاعة القرآن الكريم المصرية
            </a>{" "}
            ومجموعات عامة على{" "}
            <a href="https://archive.org/" target="_blank" rel="noreferrer" className="underline">
              أرشيف الإنترنت
            </a>
            .
          </p>
        </>
      )}
    </div>
  );
}
