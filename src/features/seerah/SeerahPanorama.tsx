"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { AmbientContext, NightContext, PARTS, Shadow, depthOf, useStill } from "./SeerahScenes";
import type { Interaction, Panorama, ScenePart, SceneItem } from "./seerahContent";
import { seerahSfx } from "./seerahSound";

/*
 * A chapter told across one long landscape. The camera travels to where each beat looks; near
 * things slide past faster than far ones; the reader can drag to look around; and the travellers
 * walk on as the story goes. Parts with a note pulse and can be tapped, as in the scenes.
 *
 * Built to stay smooth on phones: each depth is its own <svg> in its own layer, and the camera moves
 * the layers with a CSS transform, which the browser composites without repainting the drawings. The
 * notes' pulsing dots are HTML with a CSS animation. The living details stop while the panorama is off
 * screen or the tab is hidden.
 */

const HEIGHT = 300;
const EASE = [0.65, 0, 0.35, 1] as const;
/** Depths the items are grouped into; each is one sliding layer. */
const BANDS = 6;
const PARTY_Y = 262;

/** Smaller than a single scene's parts: the panorama shows more of the way at once. */
const sizeAt = (y: number) => 0.55 + depthOf(y) * 0.8;
const bandOf = (y: number) => Math.round(depthOf(y) * (BANDS - 1));
/** How far a depth moves with the camera: far ones lag behind, near ones keep up. */
const parallaxOfBand = (band: number) => 0.55 + (band / (BANDS - 1)) * 0.45;

interface Stage {
  camera: MotionValue<number>;
  /** Half the view's width, in scene units. */
  half: number;
  /** Pixels per scene unit. */
  k: number;
}

/** A layer spanning [from, to] in its own units, sliding at `factor` of the camera's speed. */
function Layer({
  stage,
  factor,
  from,
  to,
  children,
  overlay,
  className,
}: {
  stage: Stage;
  factor: number;
  from: number;
  to: number;
  children?: ReactNode;
  overlay?: ReactNode;
  className?: string;
}) {
  const { camera, half, k } = stage;
  const x = useTransform(camera, (c) => (half - c * factor + from) * k);
  return (
    <motion.div
      className={`absolute left-0 top-0 will-change-transform ${className ?? "pointer-events-none"}`}
      style={{ x, width: (to - from) * k, height: HEIGHT * k }}
    >
      {children && (
        <svg
          width={(to - from) * k}
          height={HEIGHT * k}
          viewBox={`${from} 0 ${to - from} ${HEIGHT}`}
          className="absolute inset-0 overflow-visible"
        >
          {children}
        </svg>
      )}
      {overlay}
    </motion.div>
  );
}

/** One part at (x, y) in its layer's units; only its own `move` (a flock wandering) animates. */
function Item({ item, x }: { item: SceneItem; x: number }) {
  const still = useStill();
  const y = item.y ?? 250;
  const scale = sizeAt(y) * (item.size ?? 1);
  const drawing = (
    <>
      <Shadow part={item.part} scale={scale} />
      <g transform={`scale(${item.flip ? -scale : scale} ${scale})`}>{PARTS[item.part].draw(item)}</g>
    </>
  );
  return (
    <g transform={`translate(${x} ${y})`}>
      {item.move && !still ? (
        <motion.g
          animate={{ x: [0, item.move, 0] }}
          transition={{ duration: Math.max(4, Math.abs(item.move) / 8), repeat: Infinity, ease: "easeInOut" }}
        >
          {drawing}
        </motion.g>
      ) : (
        drawing
      )}
    </g>
  );
}

/** A note's dot: an HTML button, its ring pulsing with a CSS animation the browser runs on its own. */
function Marker({
  left,
  top,
  note,
  active,
  onNote,
}: {
  left: number;
  top: number;
  note: string;
  active: boolean;
  onNote: (note: string) => void;
}) {
  return (
    <button
      type="button"
      aria-label={note}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={() => onNote(note)}
      className="pointer-events-auto absolute grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white"
      style={{ left, top }}
    >
      <span className="absolute size-5 animate-ping rounded-full border-2 border-gold [animation-duration:1.6s] motion-reduce:animate-none" />
      <span className={`relative size-[11px] rounded-full border-[1.5px] border-white ${active ? "bg-white" : "bg-gold"}`} />
    </button>
  );
}

/** The travellers, walking to where the beat puts them: one small layer of their own. */
function Party({ part, at, stage }: { part: ScenePart; at: number | undefined; stage: Stage }) {
  const reduce = useReducedMotion();
  const position = useMotionValue(at ?? 0);
  const p = parallaxOfBand(bandOf(PARTY_Y));
  const scale = sizeAt(PARTY_Y);
  const box = 120;
  const { camera, half, k } = stage;
  const x = useTransform([camera, position], ([c, a]: number[]) => (half + (a! - c!) * p - box) * k);

  useEffect(() => {
    if (at === undefined) return;
    const controls = animate(position, at, { duration: reduce ? 0 : 2.4, ease: "easeInOut" });
    return () => controls.stop();
  }, [at, position, reduce]);

  return (
    <motion.div
      className="pointer-events-none absolute left-0 top-0 will-change-transform"
      style={{ x, width: box * 2 * k, height: HEIGHT * k }}
      initial={false}
      animate={{ opacity: at === undefined ? 0 : 1 }}
      transition={{ duration: 0.6 }}
    >
      <svg width={box * 2 * k} height={HEIGHT * k} viewBox={`${-box} 0 ${box * 2} ${HEIGHT}`} className="overflow-visible">
        <g transform={`translate(0 ${PARTY_Y})`}>
          <Shadow part={part} scale={scale} />
          <g transform={`scale(${scale})`}>{PARTS[part].draw({ part, x: 0 })}</g>
        </g>
      </svg>
    </motion.div>
  );
}

const MOODS = {
  night: { color: "#011a15", level: 0.62, stars: true },
  dawn: { color: "#5b4a7a", level: 0.22, stars: false },
  dusk: { color: "#7a3b2a", level: 0.28, stars: false },
} as const;

/**
 * A stretch under another sky than day: full while the camera is within it, fading over 150 units
 * on either side. Tied to the camera rather than drawn into the land, so every layer of the scene
 * shares the same hour whatever its depth. HTML layers, so the fade is only an opacity.
 */
function Mood({
  mood,
  camera,
  viewWidth,
}: {
  mood: NonNullable<Panorama["moods"]>[number];
  camera: MotionValue<number>;
  viewWidth: number;
}) {
  const { color, level, stars } = MOODS[mood.sky];
  const amount = useTransform(camera, [mood.from - 150, mood.from, mood.to, mood.to + 150], [0, level, level, 0], { clamp: true });
  const starsShown = useTransform(amount, [0, level], [0, 1]);
  return (
    <>
      <motion.div
        className="pointer-events-none absolute inset-0 will-change-[opacity]"
        style={{ backgroundColor: color, opacity: amount }}
      />
      {stars && (
        <motion.svg
          viewBox={`0 0 ${viewWidth} ${HEIGHT}`}
          className="pointer-events-none absolute inset-0 size-full will-change-[opacity]"
          style={{ opacity: starsShown }}
        >
          <g fill="#ffffff">
            {Array.from({ length: Math.round(viewWidth / 8) }, (_, index) => (
              <circle
                key={index}
                cx={(index * 97) % viewWidth}
                cy={(index * 53) % 170}
                r={0.5 + (index % 3) * 0.4}
                opacity={0.5 + (index % 2) * 0.4}
              />
            ))}
          </g>
          <path d={`M${viewWidth - 60} 48a20 20 0 1 0 17 31 16 16 0 1 1-17-31Z`} fill="#e8d7a6" />
        </motion.svg>
      )}
    </>
  );
}

/** Wipe across the footprints to erase them. */
function EraseTracks({ interaction }: { interaction: Extract<Interaction, { kind: "erase-tracks" }> }) {
  const tracks = Array.from({ length: 12 }, (_, index) => ({ x: 140 + index * 11, y: 262 + (index % 2 ? -5 : 4) }));
  const [erased, setErased] = useState<Set<number>>(new Set());
  const done = erased.size === tracks.length;
  const svg = useRef<SVGSVGElement>(null);

  function wipe(event: React.PointerEvent) {
    if (event.buttons === 0 && event.pointerType === "mouse") return;
    const element = svg.current!;
    const point = element.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const { x, y } = point.matrixTransform(element.getScreenCTM()!.inverse());
    const next = new Set(erased);
    tracks.forEach((track, index) => {
      if (Math.hypot(track.x - x, track.y - y) < 22) next.add(index);
    });
    if (next.size === erased.size) return;
    if (next.size === tracks.length) seerahSfx.chime();
    else seerahSfx.swish();
    setErased(next);
  }

  return (
    <div className="absolute inset-0 touch-none" onPointerDown={wipe} onPointerMove={wipe}>
      <svg ref={svg} viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet" className="size-full">
        {tracks.map((track, index) => (
          <motion.ellipse
            key={index}
            cx={track.x}
            cy={track.y}
            rx="4"
            ry="2.4"
            fill="#5a432a"
            initial={false}
            animate={{ opacity: erased.has(index) ? 0 : 0.9 }}
            transition={{ duration: 0.5 }}
          />
        ))}
      </svg>
      <p className="absolute inset-x-3 top-[4.5rem] rounded-2xl bg-black/55 px-4 py-2 text-center text-sm leading-7 text-white backdrop-blur">
        {done ? interaction.done : interaction.prompt}
      </p>
    </div>
  );
}

function ChooseRoute({ interaction }: { interaction: Extract<Interaction, { kind: "choose-route" | "choice" }> }) {
  const [picked, setPicked] = useState<number | null>(null);
  const choice = picked === null ? null : interaction.options[picked]!;
  return (
    <div className="absolute inset-x-3 top-[4.5rem] rounded-2xl bg-white/95 p-4 shadow-lg backdrop-blur">
      <p className="text-sm leading-7 text-ink">{choice ? choice.feedback : interaction.prompt}</p>
      {!choice && (
        <div className="mt-3 grid gap-2">
          {interaction.options.map((option, index) => (
            <button
              key={option.label}
              type="button"
              onClick={() => {
                if (option.right) seerahSfx.chime();
                else seerahSfx.wrong();
                setPicked(index);
              }}
              className="rounded-xl border border-gold/50 bg-gold-mist px-3 py-2 text-sm font-bold text-emerald-deep transition-colors hover:bg-gold-soft"
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
      {choice && !choice.right && (
        <p className="mt-2 text-sm font-bold text-emerald-deep">{interaction.options.find((option) => option.right)?.feedback}</p>
      )}
    </div>
  );
}

interface Band {
  band: number;
  p: number;
  from: number;
  to: number;
  items: SceneItem[];
}

/** The items grouped by depth, far to near, each group drawn in the order of its feet. */
function groupBands(items: SceneItem[]): Band[] {
  const groups = new Map<number, SceneItem[]>();
  for (const item of items) {
    const band = bandOf(item.y ?? 250);
    groups.set(band, [...(groups.get(band) ?? []), item]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a - b)
    .map(([band, list]) => {
      const p = parallaxOfBand(band);
      const sorted = [...list].sort((a, b) => (a.y ?? 250) - (b.y ?? 250));
      const xs = sorted.map((item) => item.x * p);
      return { band, p, from: Math.min(...xs) - 160, to: Math.max(...xs) + 160, items: sorted };
    });
}

/** Live only while the panorama is on screen and the tab is visible. */
function useOnScreen(element: React.RefObject<HTMLElement | null>): boolean {
  const [inView, setInView] = useState(true);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const node = element.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry!.isIntersecting));
    observer.observe(node);
    const onVisibility = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [element]);
  return inView && visible;
}

export function SeerahPanorama({
  panorama,
  pan,
  party,
  interaction,
}: {
  panorama: Panorama;
  pan: number;
  party: number | undefined;
  interaction: Interaction | undefined;
}) {
  const reduce = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const k = size.height ? size.height / HEIGHT : 1;
  const viewWidth = size.height ? (HEIGHT * size.width) / size.height : 400;
  const target = useMotionValue(pan);
  const drag = useMotionValue(0);
  const camera = useSpring(
    useTransform([target, drag], ([t, d]: number[]) => t! + d!),
    { stiffness: 60, damping: 20 },
  );
  const live = useOnScreen(box);
  // A note belongs to the beat it was opened on; moving on closes it.
  const [opened, setOpened] = useState<{ pan: number; text: string } | null>(null);
  const note = opened?.pan === pan ? opened.text : null;
  const setNote = (text: string | null) => setOpened(text ? { pan, text } : null);
  const dragging = useRef<{ x: number; from: number } | null>(null);

  useEffect(() => {
    const element = box.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry!.contentRect;
      setSize({ width, height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Each beat sends the camera on and lets go of whatever the reader dragged to.
  useEffect(() => {
    const controls = animate(target, pan, { duration: reduce ? 0 : 1.8, ease: EASE });
    drag.set(0);
    return () => controls.stop();
  }, [pan, target, drag, reduce]);

  const bands = useMemo(() => groupBands(panorama.items), [panorama.items]);
  const hills = useMemo(() => {
    const far = [];
    const mid = [];
    for (let at = -200; at <= panorama.width + 400; at += 60) far.push(`${at} ${200 - ((at * 37) % 50)}`);
    for (let at = -200; at <= panorama.width + 400; at += 90) mid.push(`${at} ${208 - ((at * 53) % 26)}`);
    return {
      far: `M-200 216L${far.join("L")}L${panorama.width + 400} 216Z`,
      mid: `M-200 218L${mid.join("L")}L${panorama.width + 400} 218Z`,
    };
  }, [panorama.width]);
  const clouds = Math.ceil(panorama.width / 500);
  const limit = (value: number) => Math.max(viewWidth / 2 - pan, Math.min(panorama.width - viewWidth / 2 - pan, value));
  const stage: Stage = { camera, half: viewWidth / 2, k };
  const onNote = (text: string) => {
    if (note !== text) seerahSfx.chime();
    setNote(note === text ? null : text);
  };

  return (
    <div
      ref={box}
      dir="ltr"
      role="img"
      aria-label="مشهد الرحلة"
      className="relative size-full cursor-grab touch-pan-y select-none overflow-hidden active:cursor-grabbing"
      style={{ background: "linear-gradient(#bfdcea, #f6e7c4)" }}
      onPointerDown={(event) => {
        if (interaction?.kind === "erase-tracks") return;
        dragging.current = { x: event.clientX, from: drag.get() };
      }}
      onPointerMove={(event) => {
        if (!dragging.current || !box.current) return;
        const scale = HEIGHT / box.current.clientHeight;
        // Dragging right looks left, as with a photo.
        drag.set(limit(dragging.current.from - (event.clientX - dragging.current.x) * scale));
      }}
      onPointerUp={() => (dragging.current = null)}
      onPointerLeave={() => (dragging.current = null)}
    >
      {size.height > 0 && (
        <AmbientContext.Provider value={live}>
          <NightContext.Provider value={false}>
            <div
              className="pointer-events-none absolute rounded-full bg-[#fbe7a8]"
              style={{ width: 44 * k, height: 44 * k, left: (viewWidth - 92) * k, top: 40 * k }}
            />
            <Layer stage={stage} factor={0.12} from={0} to={clouds * 420 + 260}>
              <g opacity={0.85}>
                {Array.from({ length: clouds }, (_, index) => (
                  <g key={index} transform={`translate(${index * 420 + 120} ${50 + (index % 3) * 22}) scale(${0.8 + (index % 2) * 0.4})`}>
                    {PARTS.cloud.draw({ part: "cloud", x: 0 })}
                  </g>
                ))}
              </g>
            </Layer>
            <Layer stage={stage} factor={0.35} from={-200} to={panorama.width + 400}>
              <path d={hills.far} fill="#8c7258" opacity={0.7} />
            </Layer>
            <Layer stage={stage} factor={0.5} from={-200} to={panorama.width + 400}>
              <path d={hills.mid} fill="#b39672" opacity={0.75} />
            </Layer>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-[#d9c08f]" style={{ top: 216 * k }} />

            {bands.map((band) => (
              <Layer key={band.band} stage={stage} factor={band.p} from={band.from} to={band.to}>
                {band.items.map((item, index) => (
                  <Item key={`${item.part}-${index}`} item={item} x={item.x * band.p} />
                ))}
              </Layer>
            ))}

            <Party part={panorama.traveller ?? "party"} at={party} stage={stage} />

            <Layer stage={stage} factor={1.25} from={-40} to={panorama.width * 1.25 + 60}>
              {Array.from({ length: Math.ceil((panorama.width * 1.25) / 70) }, (_, index) => {
                const at = index * 70 + ((index * 37) % 30);
                return index % 3 === 0 ? (
                  <path key={index} d={`M${at - 8} 300q2-12 6-4q2-14 5-1q3-10 5 5Z`} fill="#7d8f4a" />
                ) : (
                  <ellipse
                    key={index}
                    cx={at}
                    cy={296 - (index % 2) * 3}
                    rx={6 + (index % 4) * 2}
                    ry={3 + (index % 3)}
                    fill={index % 2 ? "#a08a66" : "#8c7a5c"}
                  />
                );
              })}
            </Layer>

            {panorama.moods?.map((mood) => (
              <Mood key={mood.from} mood={mood} camera={camera} viewWidth={viewWidth} />
            ))}

            {/* The notes' dots ride above everything, each sliding with its part's depth. */}
            {bands.map((band) => {
              const noted = band.items.filter((item) => item.note);
              if (!noted.length) return null;
              return (
                <Layer
                  key={`notes-${band.band}`}
                  stage={stage}
                  factor={band.p}
                  from={band.from}
                  to={band.to}
                  overlay={noted.map((item, index) => {
                    const y = item.y ?? 250;
                    const top = y + (-PARTS[item.part].height - 8) * sizeAt(y) * (item.size ?? 1);
                    return (
                      <Marker
                        key={index}
                        left={(item.x * band.p - band.from) * k}
                        top={top * k}
                        note={item.note!}
                        active={note === item.note}
                        onNote={onNote}
                      />
                    );
                  })}
                />
              );
            })}
          </NightContext.Provider>
        </AmbientContext.Provider>
      )}

      {interaction?.kind === "erase-tracks" && <EraseTracks key={pan} interaction={interaction} />}
      {(interaction?.kind === "choose-route" || interaction?.kind === "choice") && <ChooseRoute key={pan} interaction={interaction} />}

      <AnimatePresence mode="wait">
        {note ? (
          <motion.button
            key={note}
            type="button"
            dir="rtl"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => setNote(null)}
            className="absolute inset-x-3 bottom-3 rounded-2xl bg-white/95 px-4 py-3 text-start text-sm leading-7 text-ink shadow-lg backdrop-blur"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
          >
            {note}
          </motion.button>
        ) : !interaction ? (
          <motion.span
            key="hint"
            dir="rtl"
            className="pointer-events-none absolute bottom-3 end-3 rounded-full bg-black/35 px-3 py-1 text-xs text-white backdrop-blur"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            اسحب لتتجوّل، والمس النقاط المضيئة
          </motion.span>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
