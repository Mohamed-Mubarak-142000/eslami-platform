"use client";

import { useEffect, useRef, useState } from "react";
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
import { NightContext, PARTS, depthOf } from "./SeerahScenes";
import type { Interaction, Panorama, SceneItem } from "./seerahContent";

/*
 * A chapter told across one long landscape. The camera travels to where each beat looks; near
 * things slide past faster than far ones; the reader can drag to look around; and the travellers
 * walk on as the story goes. Parts with a note pulse and can be tapped, as in the scenes.
 */

const HEIGHT = 300;
const EASE = [0.65, 0, 0.35, 1] as const;

/** How far an item moves with the camera: far ones lag behind, near ones keep up. */
const parallaxOf = (y: number) => 0.55 + depthOf(y) * 0.45;

/** Smaller than a single scene's parts: the panorama shows more of the way at once. */
const sizeAt = (y: number) => 0.55 + depthOf(y) * 0.8;

function Item({
  item,
  camera,
  half,
  onNote,
  active,
}: {
  item: SceneItem;
  camera: MotionValue<number>;
  half: MotionValue<number>;
  onNote: (note: string) => void;
  active: boolean;
}) {
  const reduce = useReducedMotion();
  const y = item.y ?? 250;
  const p = parallaxOf(y);
  const x = useTransform([camera, half], ([c, h]: number[]) => h! + (item.x - c!) * p);
  const scale = sizeAt(y) * (item.size ?? 1);
  const part = PARTS[item.part];
  const top = (-part.height - 8) * scale;
  const note = item.note;
  return (
    <motion.g style={{ x }}>
      <g transform={`translate(0 ${y})`}>
        <motion.g
          animate={item.move && !reduce ? { x: [0, item.move, 0] } : {}}
          transition={{ duration: Math.max(4, Math.abs(item.move ?? 0) / 8), repeat: Infinity, ease: "easeInOut" }}
        >
          <g transform={`scale(${item.flip ? -scale : scale} ${scale})`}>{part.draw(item)}</g>
          {note && (
            <g
              role="button"
              tabIndex={0}
              aria-label={note}
              className="cursor-pointer outline-none"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => onNote(note)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onNote(note);
                }
              }}
            >
              <circle cx="0" cy={top} r="16" fill="transparent" />
              <motion.circle
                cx="0"
                cy={top}
                fill="none"
                stroke="#cda23e"
                strokeWidth="2"
                initial={{ r: 7, opacity: 0.9 }}
                animate={reduce ? {} : { r: [5, 12], opacity: [0.9, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
              />
              <circle cx="0" cy={top} r="4.5" fill={active ? "#ffffff" : "#cda23e"} stroke="#ffffff" strokeWidth="1.5" />
            </g>
          )}
        </motion.g>
      </g>
    </motion.g>
  );
}

/** The travellers, walking to where the beat puts them. */
function Party({ at, camera, half }: { at: number | undefined; camera: MotionValue<number>; half: MotionValue<number> }) {
  const reduce = useReducedMotion();
  const position = useMotionValue(at ?? 0);
  const y = 262;
  const p = parallaxOf(y);
  const x = useTransform([camera, half, position], ([c, h, a]: number[]) => h! + (a! - c!) * p);
  const scale = sizeAt(y);

  useEffect(() => {
    if (at === undefined) return;
    const controls = animate(position, at, { duration: reduce ? 0 : 2.4, ease: "easeInOut" });
    return () => controls.stop();
  }, [at, position, reduce]);

  return (
    <motion.g style={{ x }} initial={false} animate={{ opacity: at === undefined ? 0 : 1 }} transition={{ duration: 0.6 }}>
      <g transform={`translate(0 ${y}) scale(${scale})`}>{PARTS.party.draw({ part: "party", x: 0 })}</g>
    </motion.g>
  );
}

/**
 * Night over the start of the journey: dark while the camera is within it, the dawn coming up as
 * the camera travels on. Tied to the camera rather than drawn into the land, so every layer of the
 * scene shares the same hour whatever its depth.
 */
function NightOver({ night, camera, viewWidth }: { night: [number, number]; camera: MotionValue<number>; viewWidth: number }) {
  const [, to] = night;
  const dark = useTransform(camera, [to, to + 300], [0.62, 0], { clamp: true });
  const stars = useTransform(dark, [0, 0.62], [0, 1]);
  return (
    <g pointerEvents="none">
      <motion.rect width={viewWidth} height={HEIGHT} fill="#011a15" style={{ opacity: dark }} />
      <motion.g fill="#ffffff" style={{ opacity: stars }}>
        {Array.from({ length: Math.round(viewWidth / 8) }, (_, index) => (
          <circle
            key={index}
            cx={(index * 97) % viewWidth}
            cy={(index * 53) % 170}
            r={0.5 + (index % 3) * 0.4}
            opacity={0.5 + (index % 2) * 0.4}
          />
        ))}
        <path d={`M${viewWidth - 60} 48a20 20 0 1 0 17 31 16 16 0 1 1-17-31Z`} fill="#e8d7a6" />
      </motion.g>
    </g>
  );
}

/** Far hills along the whole way, drifting slowly. */
function Hills({ width, camera, half }: { width: number; camera: MotionValue<number>; half: MotionValue<number> }) {
  const x = useTransform([camera, half], ([c, h]: number[]) => h! - c! * 0.35);
  const points = [];
  for (let at = -200; at <= width + 400; at += 60) points.push(`${at} ${200 - ((at * 37) % 50)}`);
  return (
    <motion.g style={{ x }}>
      <path d={`M-200 216L${points.join("L")}L${width + 400} 216Z`} fill="#8c7258" opacity={0.7} />
    </motion.g>
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
    setErased((current) => {
      const next = new Set(current);
      tracks.forEach((track, index) => {
        if (Math.hypot(track.x - x, track.y - y) < 22) next.add(index);
      });
      return next.size === current.size ? current : next;
    });
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
      <p className="absolute inset-x-3 top-8 rounded-2xl bg-black/55 px-4 py-2 text-center text-sm leading-7 text-white backdrop-blur">
        {done ? interaction.done : interaction.prompt}
      </p>
    </div>
  );
}

function ChooseRoute({ interaction }: { interaction: Extract<Interaction, { kind: "choose-route" }> }) {
  const [picked, setPicked] = useState<number | null>(null);
  const choice = picked === null ? null : interaction.options[picked]!;
  return (
    <div className="absolute inset-x-3 top-8 rounded-2xl bg-white/95 p-4 shadow-lg backdrop-blur">
      <p className="text-sm leading-7 text-ink">{choice ? choice.feedback : interaction.prompt}</p>
      {!choice && (
        <div className="mt-3 grid gap-2">
          {interaction.options.map((option, index) => (
            <button
              key={option.label}
              type="button"
              onClick={() => setPicked(index)}
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
  const [viewWidth, setViewWidth] = useState(400);
  const half = useMotionValue(200);
  const target = useMotionValue(pan);
  const drag = useMotionValue(0);
  const camera = useSpring(
    useTransform([target, drag], ([t, d]: number[]) => t! + d!),
    { stiffness: 60, damping: 20 },
  );
  // A note belongs to the beat it was opened on; moving on closes it.
  const [opened, setOpened] = useState<{ pan: number; text: string } | null>(null);
  const note = opened?.pan === pan ? opened.text : null;
  const setNote = (text: string | null) => setOpened(text ? { pan, text } : null);
  const dragging = useRef<{ x: number; from: number } | null>(null);

  // The frame is as wide as the stage's shape allows at a height of 300.
  useEffect(() => {
    const element = box.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry!.contentRect;
      const next = height ? (HEIGHT * width) / height : 400;
      setViewWidth(next);
      half.set(next / 2);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [half]);

  // Each beat sends the camera on and lets go of whatever the reader dragged to.
  useEffect(() => {
    const controls = animate(target, pan, { duration: reduce ? 0 : 1.8, ease: EASE });
    drag.set(0);
    return () => controls.stop();
  }, [pan, target, drag, reduce]);

  const sorted = [...panorama.items].sort((a, b) => (a.y ?? 250) - (b.y ?? 250));
  const limit = (value: number) => Math.max(viewWidth / 2 - pan, Math.min(panorama.width - viewWidth / 2 - pan, value));

  return (
    <div
      ref={box}
      className="relative size-full cursor-grab touch-pan-y select-none active:cursor-grabbing"
      onPointerDown={(event) => {
        if (interaction?.kind === "erase-tracks") return;
        dragging.current = { x: event.clientX, from: drag.get() };
      }}
      onPointerMove={(event) => {
        if (!dragging.current || !box.current) return;
        const scale = HEIGHT / box.current.clientHeight;
        // Dragging right looks left, as with a photo: the page is RTL, the world is not.
        drag.set(limit(dragging.current.from - (event.clientX - dragging.current.x) * scale));
      }}
      onPointerUp={() => (dragging.current = null)}
      onPointerLeave={() => (dragging.current = null)}
    >
      <svg viewBox={`0 0 ${viewWidth} ${HEIGHT}`} className="size-full" role="img" aria-label="مشهد الرحلة">
        <NightContext.Provider value={false}>
          <defs>
            <linearGradient id="panorama-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#bfdcea" />
              <stop offset="1" stopColor="#f6e7c4" />
            </linearGradient>
          </defs>
          <rect width={viewWidth} height={HEIGHT} fill="url(#panorama-sky)" />
          <circle cx={viewWidth - 70} cy="62" r="22" fill="#fbe7a8" />
          <Hills width={panorama.width} camera={camera} half={half} />
          <rect x="0" y="216" width={viewWidth} height={HEIGHT - 216} fill="#d9c08f" />
          {sorted.map((item, index) => (
            <Item
              key={`${item.part}-${index}`}
              item={item}
              camera={camera}
              half={half}
              onNote={(text) => setNote(note === text ? null : text)}
              active={note === item.note}
            />
          ))}
          <Party at={party} camera={camera} half={half} />
          {panorama.night && <NightOver night={panorama.night} camera={camera} viewWidth={viewWidth} />}
        </NightContext.Provider>
      </svg>

      {interaction?.kind === "erase-tracks" && <EraseTracks key={pan} interaction={interaction} />}
      {interaction?.kind === "choose-route" && <ChooseRoute key={pan} interaction={interaction} />}

      <AnimatePresence mode="wait">
        {note ? (
          <motion.button
            key={note}
            type="button"
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
            className="pointer-events-none absolute bottom-3 start-3 rounded-full bg-black/35 px-3 py-1 text-xs text-white backdrop-blur"
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
