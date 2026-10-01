"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Lock, Play, Star } from "lucide-react";
import { toArabicDigits } from "@/lib/arabic";
import { useActiveLearner } from "@/features/account/AccountProvider";
import type { Surah } from "@/features/quran/api";
import { useKidsProgress } from "../progress/KidsProgressProvider";
import {
  countDoneStations,
  currentStation,
  JOURNEY_LENGTH,
  JOURNEY_REGIONS,
  journeyPercent,
  journeyStations,
  stationStars,
  type JourneyStation,
} from "../progress/journey";
import { Companion } from "../companion/Companion";
import { useCompanion } from "../companion/CompanionProvider";
import { kidsButton } from "../ui/kidsStyles";
import { sfx } from "../sfx";
import { DailyChallengeCard } from "./DailyChallengeCard";

const ROW_HEIGHT = 128;
/** Horizontal position (percent of the width) of each station along the winding road. */
const ROAD_X = [50, 74, 50, 26];

function Road({ count }: { count: number }) {
  const points = Array.from(
    { length: count },
    (_, index) => [ROAD_X[index % ROAD_X.length]!, index * ROW_HEIGHT + ROW_HEIGHT / 2] as const,
  );
  const d = points.reduce((path, [x, y], index) => {
    if (index === 0) return `M${x} ${y}`;
    const [px, py] = points[index - 1]!;
    const mid = (py + y) / 2;
    return `${path} C${px} ${mid} ${x} ${mid} ${x} ${y}`;
  }, "");
  return (
    <svg
      className="pointer-events-none absolute inset-0 size-full"
      viewBox={`0 0 100 ${count * ROW_HEIGHT}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      <path d={d} fill="none" stroke="rgb(255 255 255 / 85%)" strokeWidth="26" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <path
        d={d}
        fill="none"
        stroke="#e7d6a8"
        strokeWidth="4"
        strokeDasharray="2 14"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function StationButton({
  station,
  name,
  stars,
  color,
  shadow,
  side,
}: {
  station: JourneyStation;
  name: string;
  stars: number;
  color: string;
  shadow: string;
  /** Which side of the station the companion stands on (toward the middle of the road). */
  side: "left" | "right";
}) {
  const { react } = useCompanion();
  const { state } = useKidsProgress();
  const reduceMotion = useReducedMotion();
  const locked = station.status === "locked";
  const current = station.status === "current";
  const circle = (
    <motion.span
      className={`relative grid place-items-center rounded-full text-white ${current ? "size-24" : "size-20"}`}
      style={locked ? { background: "#cfd6d2", boxShadow: "0 7px 0 #a9b3ae" } : { background: color, boxShadow: `0 7px 0 ${shadow}` }}
      animate={current && !reduceMotion ? { scale: [1, 1.07, 1] } : { scale: 1 }}
      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
    >
      {locked ? (
        <Lock className="size-8 text-white/90" aria-hidden />
      ) : (
        <span className="text-3xl font-extrabold">{toArabicDigits(station.index + 1)}</span>
      )}
      {station.status === "review" && (
        <span className="absolute -top-2 -inset-e-2 rounded-full bg-[#e84a67] px-2 py-0.5 text-xs font-extrabold ring-2 ring-white">
          راجعها
        </span>
      )}
      {current && <span className="absolute inset-0 -z-10 animate-ping rounded-full opacity-30" style={{ background: color }} />}
    </motion.span>
  );
  const label = (
    <span className="mt-2 flex flex-col items-center">
      <span
        className={`rounded-full px-3 py-0.5 text-base font-extrabold ${locked ? "bg-white/70 text-muted" : "bg-white text-emerald-deep"}`}
      >
        {name}
      </span>
      {!locked && stars > 0 && (
        <span className="mt-1 flex gap-0.5" aria-label={`${stars} من ٥ نجوم`}>
          {Array.from({ length: 5 }, (_, index) => (
            <Star
              key={index}
              className={`size-3.5 ${index < stars ? "fill-[#f5c542] text-[#e0a800]" : "fill-white/70 text-white/70"}`}
              aria-hidden
            />
          ))}
        </span>
      )}
    </span>
  );

  if (locked)
    return (
      <button
        type="button"
        onClick={() => {
          sfx.tap();
          react("locked", "thinking");
        }}
        className="flex flex-col items-center"
        aria-label={`سورة ${name}: مغلقة. اجتز اختبار السورة التي قبلها لتفتحها`}
      >
        {circle}
        {label}
      </button>
    );
  return (
    <Link
      href={`/kids/journey/${station.surahId}` as Route}
      onClick={() => sfx.tap()}
      className="flex flex-col items-center transition-transform hover:-translate-y-1"
      aria-label={`سورة ${name}${current ? " (محطتك الآن)" : ""}`}
    >
      <span className="relative">
        {circle}
        {current && state.companion && (
          <Companion
            animal={state.companion.animal}
            equipped={state.companion.equipped}
            mood="happy"
            className={`absolute -top-14 size-24 drop-shadow-lg ${side === "left" ? "-left-24" : "-right-24"}`}
          />
        )}
      </span>
      {label}
    </Link>
  );
}

export function JourneyMap({ surahs }: { surahs: Surah[] }) {
  const { state, status } = useKidsProgress();
  const learner = useActiveLearner();
  const currentRef = useRef<HTMLLIElement>(null);
  const reduceMotion = useReducedMotion();
  const names = new Map(surahs.map((surah) => [surah.id, surah.name]));
  const stations = journeyStations(state);
  const current = currentStation(stations);
  const percent = journeyPercent(state);
  const done = countDoneStations(state);

  useEffect(() => {
    if (status !== "ready") return;
    const timer = setTimeout(
      () => currentRef.current?.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" }),
      700,
    );
    return () => clearTimeout(timer);
  }, [status, reduceMotion]);

  return (
    <div>
      <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 18 }}
          className="rounded-[2.5rem] bg-white/95 p-6 text-center shadow-lift ring-4 ring-white/60 backdrop-blur sm:p-7 lg:text-start"
        >
          <h1 className="text-3xl font-extrabold text-emerald-deep sm:text-4xl">أهلًا يا {learner?.display_name ?? "بطل"}! 👋</h1>
          <p className="mt-2 text-xl text-muted">جاهز نكمل رحلتنا مع القرآن؟ 🌟</p>

          <div className="mt-5">
            <div className="flex items-center justify-between text-base font-extrabold text-emerald-deep">
              <span>رحلتك مع القرآن</span>
              <span>
                {toArabicDigits(done)} / {toArabicDigits(JOURNEY_LENGTH)} محطة
              </span>
            </div>
            <div
              className="mt-2 h-6 overflow-hidden rounded-full bg-[#e9efe9] ring-2 ring-white"
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="نسبة التقدم في الرحلة"
            >
              <motion.div
                className="h-full rounded-full bg-linear-to-l from-[#12a15b] to-[#7bd389]"
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(percent, 3)}%` }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
              />
            </div>
          </div>

          {current ? (
            <Link
              href={`/kids/journey/${current.surahId}` as Route}
              className={kidsButton("emerald", "mt-6 w-full px-8 py-4 text-2xl sm:w-auto [&_svg]:size-7")}
            >
              <Play className="fill-current" aria-hidden /> كمّل الرحلة: سورة {names.get(current.surahId)}
            </Link>
          ) : (
            done === JOURNEY_LENGTH && (
              <p className="mt-6 rounded-3xl bg-[#fff6d8] p-4 text-xl font-extrabold text-[#8a5a00]">🏆 ما شاء الله! أنت حافظ صغير</p>
            )
          )}
        </motion.div>
        <DailyChallengeCard surahId={current?.surahId ?? null} />
      </section>

      <div className="mt-8 space-y-6">
        {JOURNEY_REGIONS.map((region) => {
          const regionStations = stations.filter((station) => station.region.id === region.id);
          const regionDone = regionStations.filter((station) => station.status === "done" || station.status === "review").length;
          return (
            <section
              key={region.id}
              aria-label={region.name}
              className="overflow-hidden rounded-[2.5rem] p-4 shadow-lift ring-4 ring-white/70 sm:p-6"
              style={{ background: `${region.tint}f2` }}
            >
              <header className="flex items-center gap-3">
                <span
                  className="grid size-14 place-items-center rounded-2xl text-3xl"
                  style={{ background: region.color, boxShadow: `0 5px 0 ${region.shadow}` }}
                  aria-hidden
                >
                  {region.emoji}
                </span>
                <div>
                  <h2 className="text-2xl font-extrabold text-emerald-deep">{region.name}</h2>
                  <p className="text-base font-bold text-muted">
                    {toArabicDigits(regionDone)} من {toArabicDigits(regionStations.length)} محطات
                  </p>
                </div>
              </header>
              <ol className="relative mt-2" style={{ height: regionStations.length * ROW_HEIGHT }}>
                <Road count={regionStations.length} />
                {regionStations.map((station, index) => (
                  <li
                    key={station.surahId}
                    ref={station.status === "current" ? currentRef : undefined}
                    className="absolute -translate-x-1/2"
                    style={{ left: `${ROAD_X[index % ROAD_X.length]}%`, top: index * ROW_HEIGHT + 8 }}
                  >
                    <StationButton
                      station={station}
                      name={names.get(station.surahId) ?? toArabicDigits(station.surahId)}
                      stars={stationStars(state, station.surahId)}
                      color={region.color}
                      shadow={region.shadow}
                      side={ROAD_X[index % ROAD_X.length]! >= 50 ? "left" : "right"}
                    />
                  </li>
                ))}
              </ol>
            </section>
          );
        })}
        <div className="rounded-[2.5rem] bg-white/90 p-6 text-center shadow-lift ring-4 ring-white/70">
          <p className="text-6xl" aria-hidden>
            🏆
          </p>
          <p className="mt-2 text-2xl font-extrabold text-emerald-deep">نهاية الرحلة: الحافظ الصغير</p>
          <p className="mt-1 text-lg text-muted">أكمل كل المحطات لتصل إلى هنا!</p>
        </div>
      </div>
    </div>
  );
}
