"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/cn";
import { toArabicDigits } from "@/lib/arabic";
import { useAudio, type AudioTrack } from "@/features/audio/AudioProvider";
import { EqualizerBars } from "@/features/audio/EqualizerBars";
import { buildSurahAudioUrl, type Reciter, type Surah } from "@/features/quran/api";
import { kidsPanel } from "./ui/kidsStyles";

export function KidsListen({ reciters, surahs }: { reciters: Reciter[]; surahs: Surah[] }) {
  const audio = useAudio();
  const [reciterId, setReciterId] = useState(reciters[0]?.id ?? 0);
  const reciter = reciters.find((entry) => entry.id === reciterId) ?? reciters[0];
  const moshaf = reciter?.moshaf[0];

  const queue = useMemo<AudioTrack[]>(() => {
    if (!reciter || !moshaf) return [];
    return surahs
      .filter((surah) => moshaf.surahList.includes(surah.id))
      .map((surah) => ({
        id: `kids-listen-${moshaf.id}-${surah.id}`,
        kind: "surah" as const,
        title: `سورة ${surah.name}`,
        subtitle: `${reciter.name} — المصحف المعلّم`,
        src: buildSurahAudioUrl(moshaf.server, surah.id),
      }));
  }, [reciter, moshaf, surahs]);

  return (
    <div>
      <div className={`${kidsPanel} text-center`}>
        <h1 className="text-3xl font-extrabold text-emerald-deep sm:text-4xl">استمع مع الأطفال</h1>
        <p className="mt-2 text-lg text-muted">المصحف المعلّم: يقرأ الشيخ الآية، ثم يردّدها الأطفال معه — ردّد معهم!</p>
        {reciters.length > 1 && (
          <div className="mt-5 flex flex-wrap justify-center gap-2" role="group" aria-label="اختر الشيخ">
            {reciters.map((entry) => (
              <button
                key={entry.id}
                type="button"
                aria-pressed={entry.id === reciter?.id}
                onClick={() => setReciterId(entry.id)}
                className={cn(
                  "rounded-full px-4 py-2 text-base font-extrabold",
                  entry.id === reciter?.id
                    ? "bg-[#1f9be0] text-white shadow-[0_5px_0_#157ab3]"
                    : "bg-white text-muted ring-2 ring-[#e2e8df]",
                )}
              >
                {entry.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {queue.length === 0 && <p className={`${kidsPanel} mt-6 text-center text-muted`}>لا تتوفر تسجيلات المصحف المعلّم الآن.</p>}
      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {queue.map((track, index) => {
          const current = audio.isCurrent(track.id);
          const playing = current && audio.playing;
          return (
            <motion.li
              key={track.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: Math.min(index * 0.03, 0.5) }}
            >
              <button
                type="button"
                onClick={() => (current ? audio.toggle() : audio.play(track, { queue }))}
                className={cn(
                  "flex w-full flex-col items-center gap-2 rounded-[2rem] p-5 shadow-lift ring-4 transition-transform hover:-translate-y-1",
                  playing ? "bg-[#1f9be0] text-white ring-white" : "bg-white/95 text-emerald-deep ring-white/60",
                )}
              >
                <span
                  className={cn("grid size-14 place-items-center rounded-full", playing ? "bg-white/20" : "bg-[#e4f4fd] text-[#1f9be0]")}
                >
                  {playing ? <Pause className="size-7 fill-current" aria-hidden /> : <Play className="size-7 fill-current" aria-hidden />}
                </span>
                <span className="text-xl font-extrabold">{track.title}</span>
                {playing ? <EqualizerBars active /> : <span className="text-xs font-bold opacity-60">{toArabicDigits(index + 1)}</span>}
              </button>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
