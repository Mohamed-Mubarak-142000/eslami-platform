"use client";

import { useEffect } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import {
  MAP,
  PLACES,
  ROUTES,
  frameAround,
  pointAlong,
  project,
  routePoints,
  type Frame,
  type PlaceId,
  type RouteId,
  type Stage,
} from "./seerahContent";

const EASE = [0.65, 0, 0.35, 1] as const;
const MOVE_SECONDS = 1.1;
const DRAW_SECONDS = 1.8;

export function stageFrame(stage: Extract<Stage, { kind: "map" }>): Frame {
  return frameAround(stage.focus, stage.span);
}

/** A journey drawn up to `drawn` of its length, with a light travelling at its head while it moves. */
function Journey({ route, drawn, unit }: { route: RouteId; drawn: number; unit: number }) {
  const reduce = useReducedMotion();
  const progress = useMotionValue(0);
  const cx = useTransform(progress, (share) => pointAlong(route, share).x);
  const cy = useTransform(progress, (share) => pointAlong(route, share).y);
  const points = routePoints(route);
  const d = `M${points.map((point) => `${point.x} ${point.y}`).join("L")}`;

  useEffect(() => {
    if (reduce) {
      progress.set(drawn);
      return;
    }
    const controls = animate(progress, drawn, { duration: DRAW_SECONDS, ease: EASE });
    return () => controls.stop();
  }, [drawn, progress, reduce]);

  return (
    <g>
      <path
        d={d}
        fill="none"
        stroke="var(--color-gold-deep)"
        strokeOpacity={0.18}
        strokeWidth={2}
        strokeDasharray="2 5"
        vectorEffect="non-scaling-stroke"
      />
      <motion.path
        d={d}
        fill="none"
        stroke="var(--color-gold)"
        // In map units: a non-scaling stroke would measure the dash that draws it in pixels.
        strokeWidth={unit * 0.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ pathLength: progress }}
      />
      {drawn > 0 && drawn < 1 && (
        <>
          <motion.circle cx={cx} cy={cy} r={unit * 2.4} fill="var(--color-gold)" opacity={0.25} />
          <motion.circle cx={cx} cy={cy} r={unit} fill="var(--color-gold-soft)" />
        </>
      )}
    </g>
  );
}

/**
 * Arabia, its places and journeys. The camera glides between the frames each beat names, and routes
 * draw as far as the story has gone — stepping back undraws them.
 */
export function SeerahMap({
  frame,
  routes,
  named,
  glow,
}: {
  frame: Frame;
  routes: Partial<Record<RouteId, number>>;
  /** The places whose names show — the beat's own, so neighbours don't write over each other. */
  named: PlaceId[];
  glow: PlaceId[];
}) {
  const reduce = useReducedMotion();
  // Sizes that should look the same at every zoom are in shares of the frame.
  const unit = frame.width / 110;
  const viewBox = `${frame.x} ${frame.y} ${frame.width} ${frame.height}`;

  return (
    <motion.svg
      className="size-full"
      initial={false}
      animate={{ viewBox }}
      transition={{ duration: reduce ? 0 : MOVE_SECONDS, ease: EASE }}
      preserveAspectRatio="xMidYMid slice"
      // Physical text anchors: on the page's RTL "end" would be the left.
      direction="ltr"
      role="img"
      aria-label="خريطة الجزيرة العربية"
    >
      <rect x={-MAP.width} y={-MAP.height} width={MAP.width * 3} height={MAP.height * 3} fill="var(--color-ivory)" />
      <rect x={-MAP.width} y={-MAP.height} width={MAP.width * 3} height={MAP.height * 3} fill="var(--color-sky)" fillOpacity={0.16} />
      <path
        d={MAP.land}
        fill="var(--color-parchment)"
        stroke="var(--color-gold-deep)"
        strokeOpacity={0.45}
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
      />
      {(Object.keys(ROUTES) as RouteId[]).map((route) =>
        routes[route] ? <Journey key={route} route={route} drawn={routes[route]!} unit={unit} /> : null,
      )}
      {(Object.keys(PLACES) as PlaceId[]).map((id) => {
        const place = PLACES[id];
        const point = project(place.lat, place.lon);
        const lit = glow.includes(id);
        // Only the beat's own places: unnamed dots beside Makkah would read as noise.
        if (!named.includes(id) && !lit) return null;
        return (
          <g key={id}>
            {lit && !reduce && (
              <motion.circle
                cx={point.x}
                cy={point.y}
                fill="var(--color-gold)"
                initial={{ r: unit * 1.5, opacity: 0.55 }}
                animate={{ r: unit * 5, opacity: 0 }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
              />
            )}
            <motion.circle
              cx={point.x}
              cy={point.y}
              initial={false}
              animate={{ r: lit ? unit * 1.7 : unit * 1.15 }}
              transition={{ duration: reduce ? 0 : MOVE_SECONDS, ease: EASE }}
              fill={lit ? "var(--color-gold)" : "var(--color-emerald)"}
              stroke="white"
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
            />
            {named.includes(id) && (
              <text
                x={point.x + (place.side === "left" ? -unit * 2.6 : unit * 2.6)}
                y={point.y}
                dominantBaseline="middle"
                textAnchor={place.side === "left" ? "end" : "start"}
                fontSize={unit * 3}
                className="font-display font-bold transition-[font-size] duration-1000"
                fill="var(--color-emerald-deep)"
                stroke="var(--color-parchment)"
                strokeWidth={unit * 0.8}
                paintOrder="stroke"
              >
                {place.name}
              </text>
            )}
          </g>
        );
      })}
    </motion.svg>
  );
}
