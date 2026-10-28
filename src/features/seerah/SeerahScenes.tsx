"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from "framer-motion";
import type { Land, ScenePart, SceneItem, Sky } from "./seerahContent";

/*
 * The stage when a beat isn't on the map: a scene drawn for that beat from a library of parts on a
 * 400×300 frame. Every part keeps a little life of its own (palms sway, camels walk, flags lift,
 * crowds shift), the layers drift apart as the pointer moves, and the parts that carry a note pulse
 * so the reader can tap them.
 *
 * People are faceless silhouettes of ordinary crowds only. The Prophet ﷺ, his family and the
 * companions a beat names are never drawn; a light, a camel or a lit doorway stands in their place.
 */

const INK = "#3b2a1e";
const NIGHT_INK = "#06120e";
const SAND = "#d9c08f";
const MUD = "#b98d5a";
const MUD_DARK = "#8a6339";
const WOOD = "#6b4a26";
const LEAF = "#2f6b45";
const GOLD = "#cda23e";
const GOLD_SOFT = "#e8d7a6";

/** Night darkens the ground and the people; parts read it to pick their colours. */
export const NightContext = createContext(false);
const useNight = () => useContext(NightContext);
const useInk = () => (useNight() ? NIGHT_INK : INK);

/** The same randomness every time: a small seeded generator instead of Math.random. */
function seeded(seed: number) {
  let state = Math.max(1, Math.floor(seed * 9973) % 2147483647);
  return () => ((state = (state * 16807) % 2147483647) - 1) / 2147483646;
}

// ---------------------------------------------------------------------------------------------
// Motion helpers: every loop stops when the reader asks for less motion.

function Sway({
  children,
  degrees = 1.5,
  seconds = 6,
  originY = 0,
}: {
  children: ReactNode;
  degrees?: number;
  seconds?: number;
  originY?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.g
      style={{ originX: "0px", originY: `${originY}px` }}
      animate={reduce ? {} : { rotate: [0, degrees, 0, -degrees * 0.6, 0] }}
      transition={{ duration: seconds, repeat: Infinity, ease: "easeInOut" }}
    >
      {children}
    </motion.g>
  );
}

function Bob({ children, by = 1.5, seconds = 2.4, delay = 0 }: { children: ReactNode; by?: number; seconds?: number; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.g animate={reduce ? {} : { y: [0, -by, 0] }} transition={{ duration: seconds, repeat: Infinity, ease: "easeInOut", delay }}>
      {children}
    </motion.g>
  );
}

function Pulse({ children, from = 0.5, to = 1, seconds = 3 }: { children: ReactNode; from?: number; to?: number; seconds?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.g
      initial={{ opacity: to }}
      animate={reduce ? {} : { opacity: [from, to, from] }}
      transition={{ duration: seconds, repeat: Infinity }}
    >
      {children}
    </motion.g>
  );
}

// ---------------------------------------------------------------------------------------------
// People, as silhouettes: a wrapped head and a robe in the colours of the time, no face, no features.

const ROBES = ["#efe6d2", "#c9a878", "#8a6339", "#5e6e5a", "#a35d3d", "#e2d6bc"];
const WRAPS = ["#3b2a1e", "#efe6d2", "#7a5a3a"];

function Figure({ x = 0, height = 26, carry, seed = 1 }: { x?: number; height?: number; carry?: boolean; seed?: number }) {
  const night = useNight();
  const k = height / 26;
  const robe = night ? NIGHT_INK : ROBES[seed % ROBES.length]!;
  const wrap = night ? NIGHT_INK : WRAPS[seed % WRAPS.length]!;
  return (
    <g transform={`translate(${x} 0) scale(${k})`}>
      <Bob by={0.8} seconds={2 + (seed % 5) * 0.3} delay={(seed % 7) * 0.2}>
        <path d="M-4.5 -19h9l2.5 19h-14Z" fill={robe} stroke={night ? "none" : "#00000022"} strokeWidth="0.6" />
        <circle cx="0" cy="-23" r="3.6" fill={wrap} />
        {carry && <ellipse cx="0" cy="-29" rx="6" ry="2.6" fill={MUD_DARK} />}
      </Bob>
    </g>
  );
}

function Crowd({ count = 7, spread = 9 }: { count?: number | undefined; spread?: number }) {
  const next = seeded(count + spread);
  return (
    <g>
      {Array.from({ length: count }, (_, index) => (
        <Figure key={index} x={(index - (count - 1) / 2) * spread + (next() - 0.5) * 4} height={22 + next() * 6} seed={index + 1} />
      ))}
    </g>
  );
}

/** Rows standing one behind another, as at prayer or a pledge. */
function Rows({ count = 3 }: { count?: number | undefined }) {
  return (
    <g>
      {Array.from({ length: count }, (_, row) => (
        <g key={row} transform={`translate(${row * 6} ${-row * 9}) scale(${1 - row * 0.12})`}>
          {Array.from({ length: 9 }, (_, index) => (
            <Figure key={index} x={(index - 4) * 9} height={22} seed={row * 9 + index} />
          ))}
        </g>
      ))}
    </g>
  );
}

function Army({ count = 2 }: { count?: number | undefined }) {
  const ink = useInk();
  return (
    <g>
      {Array.from({ length: count }, (_, row) => (
        <g key={row} transform={`translate(${row * 8} ${-row * 6}) scale(${0.7 - row * 0.1})`}>
          {Array.from({ length: 12 }, (_, index) => (
            <Figure key={index} x={(index - 6) * 8} height={22} seed={row * 12 + index} />
          ))}
        </g>
      ))}
      <g transform="translate(-40 -2)">
        <Banner />
      </g>
      <g transform="translate(30 -6) scale(0.9)">
        <Banner color="#7a2e2e" />
      </g>
      <ellipse cx="0" cy="2" rx="70" ry="4" fill={ink} opacity={0.15} />
    </g>
  );
}

function Diggers() {
  return (
    <g>
      {[-60, -25, 15, 50].map((x, index) => (
        <Figure key={x} x={x} height={24} carry={index % 2 === 0} seed={index + 3} />
      ))}
    </g>
  );
}

/** Someone carrying something along a road: a messenger, a traveller. */
function Walker() {
  return <Figure height={26} carry seed={4} />;
}

/** The chiefs of the clans lifting the Black Stone together in a cloth. */
function ClothStone() {
  const reduce = useReducedMotion();
  return (
    <g>
      <motion.g animate={reduce ? {} : { y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
        <path d="M-30 -22q30 10 60 0" stroke="#efe6d2" strokeWidth="5" fill="none" strokeLinecap="round" />
        <ellipse cx="0" cy="-19" rx="6" ry="4" fill="#111" />
      </motion.g>
      {[-34, -14, 14, 34].map((x, index) => (
        <Figure key={x} x={x} height={24} seed={index + 11} />
      ))}
    </g>
  );
}

// ---------------------------------------------------------------------------------------------
// Buildings

function House({ lit = false, floors = 1 }: { lit?: boolean; floors?: number }) {
  const night = useNight();
  const height = 24 * floors;
  return (
    <g>
      <path d={`M-18 0V${-height}h36V0Z`} fill={night ? "#5e4630" : MUD} />
      <path d={`M-20 ${-height}h40v-3h-40Z`} fill={MUD_DARK} />
      {floors > 1 && <path d="M-18 -24h36" stroke={MUD_DARK} strokeWidth="1.5" />}
      <path d="M-5 0v-12a5 5 0 0 1 10 0V0Z" fill={lit ? GOLD_SOFT : "#3d2a18"} />
      <rect x="8" y={-height + 7} width="5" height="5" fill={lit || night ? GOLD : "#3d2a18"} opacity={night ? 0.9 : 1} />
      {lit && (
        <Pulse from={0.25} to={0.5}>
          <ellipse cx="0" cy="-4" rx="16" ry="8" fill={GOLD} opacity={0.4} />
        </Pulse>
      )}
    </g>
  );
}

function Kaaba() {
  return (
    <g>
      <ellipse cx="0" cy="0" rx="46" ry="6" fill={GOLD} opacity={0.15} />
      <path d="M-30 0V-44l24-6 30 6V0l-30 4Z" fill="#111" />
      <path d="M-6 -50l30 6V0l-30 4Z" fill="#1d1d1d" />
      <path d="M-30 -34l24-5 30 5v5l-30-5-24 5Z" fill={GOLD} />
      <path d="M4 -14h10v13l-10 1Z" fill="#9c7a26" />
    </g>
  );
}

/** The Kaaba half-built: walls of stone courses with scaffolding of timber. */
function KaabaBuilding() {
  return (
    <g>
      <path d="M-30 0V-26l24-5 30 5V0l-30 4Z" fill="#6f6658" />
      {[-6, -12, -18].map((y) => (
        <path key={y} d={`M-30 ${y}l24-5 30 5`} stroke="#5a5246" strokeWidth="1" fill="none" />
      ))}
      <path d="M-34 0V-44M28 0V-44M-34 -40h62M-34 -22h62" stroke={WOOD} strokeWidth="2" />
    </g>
  );
}

/** The first mosque: walls of mud brick, palm trunks for pillars, a roof of palm fronds. */
function Mosque({ withRoom = false }: { withRoom?: boolean }) {
  return (
    <g>
      <path d="M-50 0V-26h100V0Z" fill={MUD} />
      <path d="M-55 -26h110l-4-6h-102Z" fill={MUD_DARK} />
      {[-36, -18, 0, 18, 36].map((x) => (
        <rect key={x} x={x - 2} y="-22" width="4" height="22" fill={WOOD} />
      ))}
      {withRoom && (
        <g transform="translate(64 0)">
          <path d="M-14 0V-20h28V0Z" fill="#a37a49" />
          <path d="M-4 0v-10h8V0Z" fill={GOLD_SOFT} />
          <Pulse from={0.2} to={0.5}>
            <ellipse cx="0" cy="-4" rx="12" ry="6" fill={GOLD} />
          </Pulse>
        </g>
      )}
    </g>
  );
}

function Fort() {
  return (
    <g>
      <path d="M-34 0V-40h68V0Z" fill="#8c7b62" />
      <path d="M-34 -45h8v5h-8ZM-17 -45h8v5h-8ZM0 -45h8v5H0ZM17 -45h8v5h-8Z" fill="#7a6a52" />
      <path d="M-6 0v-14a6 6 0 0 1 12 0V0Z" fill="#3d2a18" />
      <rect x="-24" y="-30" width="4" height="7" fill="#3d2a18" />
      <rect x="20" y="-30" width="4" height="7" fill="#3d2a18" />
    </g>
  );
}

/** A king's hall with its seat empty: the court of the Najashi. */
function Court() {
  return (
    <g>
      <path d="M-60 0V-48h120V0Z" fill="#a7805a" />
      <path d="M-66 -48h132l-10-14H-56Z" fill="#7a5233" />
      {[-46, -24, 24, 46].map((x) => (
        <rect key={x} x={x - 3} y="-46" width="6" height="46" fill="#e9dcc0" />
      ))}
      <path d="M-12 0v-22h24V0Z" fill="#7a2e2e" />
      <path d="M-14 -22h28v-6h-28Z" fill={GOLD} />
    </g>
  );
}

function Tent({ blown = false }: { blown?: boolean }) {
  const reduce = useReducedMotion();
  return (
    <motion.g
      style={{ originX: "0px", originY: "0px" }}
      animate={blown && !reduce ? { skewX: [0, -12, -4, -14, 0] } : {}}
      transition={{ duration: 1.6, repeat: Infinity }}
    >
      <path d="M-24 0 -16 -18h32L24 0Z" fill="#2b2420" />
      <path d="M-16 -18 0 -24l16 6Z" fill="#3a302a" />
      <path d="M-4 0v-12h8V0Z" fill="#7a5a3a" />
    </motion.g>
  );
}

/** The shelter of palm fronds built for him at Badr, from which he watched over the army. */
function Arish() {
  return (
    <g>
      <path d="M-22 0V-22M22 0V-22" stroke={WOOD} strokeWidth="3" />
      <path d="M-28 -22q28-12 56 0" stroke={LEAF} strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M-26 -20q26-8 52 0" stroke="#3f7d53" strokeWidth="4" fill="none" />
    </g>
  );
}

function Well() {
  return (
    <g>
      <ellipse cx="0" cy="-2" rx="14" ry="5" fill="#7a6a52" />
      <path d="M-14 -2v-8h28v8" fill="#8c7b62" />
      <path d="M-12 -10V-26M12 -10V-26M-14 -26h28" stroke={WOOD} strokeWidth="2.5" />
      <path d="M0 -26v10" stroke="#3d2a18" strokeWidth="1" />
    </g>
  );
}

function Graves() {
  return (
    <g>
      {[-30, -10, 10, 30].map((x, index) => (
        <g key={x} transform={`translate(${x} ${index % 2 ? -4 : 0})`}>
          <ellipse cx="0" cy="0" rx="9" ry="3" fill="#8a6a45" />
          <rect x="-1.5" y="-8" width="3" height="8" fill="#6f6658" />
        </g>
      ))}
    </g>
  );
}

function Trench() {
  return (
    <g>
      <path d="M-200 -6c60-6 120 4 200-2s140 6 200 0v14c-60 4-120-6-200 2s-140-4-200 0Z" fill="#120c06" />
      {[-160, -100, -40, 20, 80, 140].map((x) => (
        <path key={x} d={`M${x - 20} 12q20-14 40 0Z`} fill="#5a432a" />
      ))}
    </g>
  );
}

/** The boulder in the trench that the pick turned to sand. */
function Rock() {
  const reduce = useReducedMotion();
  return (
    <g>
      <path d="M-22 0q-6-22 10-30t30 6q8 18-4 24Z" fill="#6f6658" />
      <path d="M-4 -26l4 10-6 6 6 10" stroke="#3d362e" strokeWidth="1.5" fill="none" />
      {[0, 1, 2].map((index) => (
        <motion.circle
          key={index}
          cx={-2 + index * 4}
          cy="-28"
          r="1.6"
          fill={GOLD_SOFT}
          animate={
            reduce ? { opacity: 0 } : { opacity: [0, 1, 0], y: [0, -10 - index * 4, -14], x: [0, (index - 1) * 8, (index - 1) * 12] }
          }
          transition={{ duration: 1.4, repeat: Infinity, delay: index * 0.3 }}
        />
      ))}
    </g>
  );
}

// ---------------------------------------------------------------------------------------------
// Land features

/** Jabal al-Nour, the cave of Hira a lit notch near its top. */
function MountNour() {
  return (
    <g>
      <path d="M-110 0 -40 -90l14 10 28 50 60 30Z" fill="#2b2a24" />
      <path d="m-40 -90 14 10 28 50-22-18Z" fill="#3a382f" />
      <Pulse from={0.5} to={1} seconds={4}>
        <ellipse cx="-28" cy="-74" rx="5" ry="3.4" fill={GOLD} />
        <circle cx="-28" cy="-74" r="16" fill={GOLD} opacity={0.18} />
      </Pulse>
    </g>
  );
}

/** Jabal Thawr, the cave's mouth dark in its side. */
function MountThawr() {
  return (
    <g>
      <path d="M-120 0 -50 -70l40 14 50-30 80 86Z" fill="#3a2f26" />
      <path d="M-14 -40q8-10 18 0v6h-18Z" fill="#0b0805" />
    </g>
  );
}

function Uhud() {
  return <path d="M-200 0 -160 -40l40 14 30-40 50 26 40-36 60 34 40-16 50 30 50-10V0Z" fill="#8a4b32" />;
}

/** The small hill of the archers, its flag flying. */
function Rumat() {
  return (
    <g>
      <path d="M-40 0c8-20 26-26 40-26s32 8 40 26Z" fill="#b98a55" />
      <g transform="translate(4 -26)">
        <Banner color={LEAF} />
      </g>
    </g>
  );
}

function Palm() {
  return (
    <g>
      <path d="M0 0c2-26 0-46-3-64" stroke={WOOD} strokeWidth="4" fill="none" />
      <Sway degrees={3} seconds={5} originY={-64}>
        {[-70, -35, 0, 35, 70, 115, 150].map((angle) => {
          const radians = ((angle - 90) * Math.PI) / 180;
          return (
            <path
              key={angle}
              d={`M-3 -64q${20 * Math.cos(radians)} ${-6 + 14 * Math.sin(radians)} ${30 * Math.cos(radians)} ${20 + 16 * Math.sin(radians)}`}
              stroke={LEAF}
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
          );
        })}
      </Sway>
    </g>
  );
}

/** The acacia (samura): a flat crown on a crooked trunk. */
function Acacia() {
  return (
    <g>
      <path
        d="M0 0c-4-24 4-40-2-56M-2 -40c-12-8-22-10-34-16M0 -46c12-6 22-8 34-16"
        stroke={WOOD}
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
      <Sway degrees={1} seconds={7} originY={-56}>
        <ellipse cx="0" cy="-64" rx="64" ry="13" fill="#4f7a3a" />
        <ellipse cx="-20" cy="-69" rx="30" ry="8" fill="#5d8a45" />
        <ellipse cx="24" cy="-68" rx="28" ry="7" fill="#5d8a45" />
      </Sway>
    </g>
  );
}

function Bush() {
  return (
    <g>
      <ellipse cx="-6" cy="-6" rx="10" ry="7" fill="#6b7d3e" />
      <ellipse cx="7" cy="-7" rx="9" ry="7" fill="#7d8f4a" />
    </g>
  );
}

// ---------------------------------------------------------------------------------------------
// Animals and things that move

function Camel({ load = false }: { load?: boolean }) {
  const reduce = useReducedMotion();
  return (
    <g>
      {[-14, -8, 8, 14].map((x, index) => (
        <motion.path
          key={x}
          d={`M${x} -16v16`}
          stroke="#8a6339"
          strokeWidth="3"
          strokeLinecap="round"
          style={{ originX: `${x}px`, originY: "-16px" }}
          animate={reduce ? {} : { rotate: index % 2 ? [12, -12, 12] : [-12, 12, -12] }}
          transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
      <ellipse cx="0" cy="-20" rx="18" ry="8" fill="#a8763f" />
      <path d="M-8 -26q8-14 16 0Z" fill="#a8763f" />
      <path d="M16 -22q6-4 6-16" stroke="#a8763f" strokeWidth="5" strokeLinecap="round" fill="none" />
      <ellipse cx="25" cy="-38" rx="5" ry="3" fill="#a8763f" />
      {load && <path d="M-12 -30h24v7h-24Z" fill="#7a2e2e" />}
    </g>
  );
}

/** A camel couched on the ground: al-Qaswa where she knelt in Madinah. */
function CamelKneeling() {
  return (
    <g>
      <Pulse from={0.15} to={0.4}>
        <ellipse cx="0" cy="-2" rx="34" ry="6" fill={GOLD} />
      </Pulse>
      <ellipse cx="0" cy="-8" rx="20" ry="8" fill="#a8763f" />
      <path d="M-8 -14q8-14 16 0Z" fill="#a8763f" />
      <path d="M17 -10q8-4 8-18" stroke="#a8763f" strokeWidth="5" strokeLinecap="round" fill="none" />
      <ellipse cx="28" cy="-30" rx="5" ry="3" fill="#a8763f" />
      <path d="M-10 -16h20v5h-20Z" fill="#7a2e2e" />
    </g>
  );
}

function Caravan() {
  return (
    <g>
      {[-44, 0, 44].map((x) => (
        <g key={x} transform={`translate(${x} 0)`}>
          <Camel load />
        </g>
      ))}
    </g>
  );
}

/** The white mule, standing firm with a light above it. */
function Mule() {
  return (
    <g>
      {[-12, -7, 7, 12].map((x) => (
        <path key={x} d={`M${x} -14v14`} stroke="#d8d4cb" strokeWidth="3" strokeLinecap="round" />
      ))}
      <ellipse cx="0" cy="-18" rx="16" ry="7" fill="#efece4" />
      <path d="M13 -20q6-2 8-12" stroke="#efece4" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M20 -34l3-6 1 7Z" fill="#efece4" />
      <Pulse from={0.3} to={0.7}>
        <circle cx="0" cy="-44" r="10" fill={GOLD_SOFT} opacity={0.6} />
      </Pulse>
    </g>
  );
}

function Sheep({ count = 5 }: { count?: number | undefined }) {
  const next = seeded(count * 7);
  return (
    <g>
      {Array.from({ length: count }, (_, index) => {
        const x = (index - (count - 1) / 2) * 13 + (next() - 0.5) * 6;
        const y = (next() - 0.5) * 6;
        return (
          <Bob key={index} by={1} seconds={1.6 + next()} delay={next()}>
            <g transform={`translate(${x} ${y})`}>
              <path d="M-4 0v-4M4 0v-4" stroke="#3d2a18" strokeWidth="1.5" />
              <ellipse cx="0" cy="-7" rx="7" ry="4.5" fill="#f1ebdd" />
              <ellipse cx="7" cy="-9" rx="2.6" ry="2" fill="#3d2a18" />
            </g>
          </Bob>
        );
      })}
    </g>
  );
}

function Ship() {
  return (
    <Bob by={3} seconds={4}>
      <path d="M-40 0h80l-12 14h-56Z" fill={WOOD} />
      <path d="M0 0V-70l32 64Z" fill="#fbf8f1" />
      <path d="M0 0V-62l-26 56Z" fill="#efe6d2" />
    </Bob>
  );
}

function Birds({ count = 3 }: { count?: number | undefined }) {
  const reduce = useReducedMotion();
  return (
    <motion.g animate={reduce ? {} : { x: [0, 60], y: [0, -10] }} transition={{ duration: 9, repeat: Infinity, ease: "linear" }}>
      {Array.from({ length: count }, (_, index) => (
        <path key={index} d={`M${index * 14} ${index % 2 ? -6 : 0}q4-4 8 0q4-4 8 0`} stroke="#3b2a1e" strokeWidth="1.5" fill="none" />
      ))}
    </motion.g>
  );
}

function Dust() {
  const reduce = useReducedMotion();
  return (
    <motion.g
      animate={reduce ? { opacity: 0.4 } : { x: [-10, 30], opacity: [0, 0.6, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeOut" }}
    >
      <ellipse cx="0" cy="-8" rx="30" ry="9" fill="#e6d3a8" />
      <ellipse cx="22" cy="-14" rx="18" ry="7" fill="#efe0bd" />
    </motion.g>
  );
}

function Wind() {
  const reduce = useReducedMotion();
  return (
    <g>
      {[0, 30, 60].map((y, index) => (
        <motion.path
          key={y}
          d={`M-120 ${-y}q40-10 80 0t80 0`}
          stroke="#ffffff"
          strokeOpacity={0.35}
          strokeWidth="2"
          fill="none"
          animate={reduce ? {} : { x: [-80, 420] }}
          transition={{ duration: 2.4 + index * 0.6, repeat: Infinity, ease: "linear", delay: index * 0.5 }}
        />
      ))}
    </g>
  );
}

function Arrows() {
  const reduce = useReducedMotion();
  return (
    <g>
      {[0, 1, 2, 3, 4].map((index) => (
        <motion.path
          key={index}
          d={`M${index * 22 - 40} -90l14 22`}
          stroke="#2b2420"
          strokeWidth="1.6"
          animate={reduce ? { opacity: 0.6 } : { opacity: [0, 1, 0], x: [0, 30], y: [0, 50] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: index * 0.25, ease: "easeIn" }}
        />
      ))}
    </g>
  );
}

function Cloud() {
  const reduce = useReducedMotion();
  return (
    <motion.g animate={reduce ? {} : { x: [0, 8, 0] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}>
      <ellipse cx="0" cy="0" rx="40" ry="13" fill="#f4efe6" opacity={0.9} />
      <ellipse cx="-18" cy="-8" rx="20" ry="10" fill="#f8f4ec" />
      <ellipse cx="16" cy="-9" rx="22" ry="11" fill="#f8f4ec" />
    </motion.g>
  );
}

/** A trail of light rising: the night journey and the ascension. */
function Streak() {
  const reduce = useReducedMotion();
  return (
    <g>
      <motion.path
        d="M0 0C10 -60 -10 -120 0 -190"
        stroke={GOLD_SOFT}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: reduce ? 1 : 0, opacity: 0.9 }}
        animate={{ pathLength: 1, opacity: reduce ? 0.9 : [0.9, 0.4, 0.9] }}
        transition={{ pathLength: { duration: 2.4, ease: "easeInOut" }, opacity: { duration: 4, repeat: Infinity } }}
      />
      <circle cx="0" cy="-190" r="14" fill={GOLD_SOFT} opacity={0.35} />
    </g>
  );
}

function Footprints() {
  return (
    <g fill="#8a6a45" opacity={0.6}>
      {Array.from({ length: 7 }, (_, index) => (
        <ellipse key={index} cx={index * 12} cy={index % 2 ? -3 : 0} rx="2.4" ry="1.4" opacity={1 - index * 0.12} />
      ))}
    </g>
  );
}

// ---------------------------------------------------------------------------------------------
// Light and objects

/** A soft light: revelation, or his presence where he is never drawn. */
function Light() {
  const reduce = useReducedMotion();
  return (
    <g>
      <defs>
        <radialGradient id="seerah-light">
          <stop offset="0" stopColor="#fff6d8" stopOpacity="0.95" />
          <stop offset="1" stopColor={GOLD} stopOpacity="0" />
        </radialGradient>
      </defs>
      <motion.circle
        cx="0"
        cy="-20"
        r="26"
        fill="url(#seerah-light)"
        animate={reduce ? {} : { scale: [1, 1.15, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
    </g>
  );
}

function Lantern() {
  return (
    <g>
      <path d="M0 -30v-10" stroke="#3d2a18" strokeWidth="1" />
      <path d="M-4 -30h8l2 10h-12Z" fill="#7a5a3a" />
      <Pulse from={0.6} to={1} seconds={1.6}>
        <ellipse cx="0" cy="-25" rx="3" ry="4" fill={GOLD_SOFT} />
        <circle cx="0" cy="-25" r="10" fill={GOLD} opacity={0.25} />
      </Pulse>
    </g>
  );
}

function Fire() {
  const reduce = useReducedMotion();
  return (
    <g>
      <path d="M-8 0h16M-6 -2l12 2" stroke={WOOD} strokeWidth="2.5" />
      <motion.path
        d="M0 -2c-6-4-6-10 0-16 6 6 6 12 0 16Z"
        fill="#f0a040"
        style={{ originX: "0px", originY: "-2px" }}
        animate={reduce ? {} : { scaleY: [1, 1.25, 0.9, 1.15, 1] }}
        transition={{ duration: 0.9, repeat: Infinity }}
      />
      <circle cx="0" cy="-8" r="14" fill="#f0a040" opacity={0.18} />
    </g>
  );
}

function Banner({ color = "#ffffff" }: { color?: string }) {
  const reduce = useReducedMotion();
  return (
    <g>
      <path d="M0 0V-40" stroke={WOOD} strokeWidth="2" />
      <motion.path
        d="M0 -40h18l-4 6 4 6H0Z"
        fill={color}
        style={{ originX: "0px", originY: "-34px" }}
        animate={reduce ? {} : { skewY: [0, 6, -4, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
    </g>
  );
}

function Idols() {
  return (
    <g>
      {[-60, -40, -22, 22, 40, 60].map((x, index) => (
        <rect key={x} x={x - 3} y={-14 - (index % 3) * 3} width="6" height={14 + (index % 3) * 3} rx="2" fill="#6f6658" />
      ))}
    </g>
  );
}

/** The idols round the House toppling one after another. */
function IdolsFalling() {
  const reduce = useReducedMotion();
  return (
    <g>
      {[-60, -40, -22, 22, 40, 60].map((x, index) => (
        <motion.rect
          key={x}
          x={x - 3}
          y={-16}
          width="6"
          height="16"
          rx="2"
          fill="#6f6658"
          style={{ originX: `${x}px`, originY: "0px" }}
          animate={reduce ? { rotate: 90 } : { rotate: [0, 0, 90, 90] }}
          transition={{ duration: 6, times: [0, 0.15 + index * 0.1, 0.25 + index * 0.1, 1], repeat: Infinity }}
        />
      ))}
    </g>
  );
}

function Scroll() {
  return (
    <g>
      <path d="M-40 0V-70h80V0Z" fill="#f3e6c6" />
      <rect x="-46" y="-76" width="92" height="9" rx="4.5" fill="#d9c08f" />
      <rect x="-46" y="-3" width="92" height="9" rx="4.5" fill="#d9c08f" />
      {[-60, -50, -40, -30].map((y, index) => (
        <path key={y} d={`M${-30 + (index % 2) * 6} ${y}h${60 - (index % 2) * 6}`} stroke="#b39a6a" strokeWidth="2" strokeLinecap="round" />
      ))}
      <circle cx="0" cy="-15" r="8" fill="#c9ccd1" />
    </g>
  );
}

/** The silver ring's seal: three lines, one word each, in the order the hadith names them. */
function Seal() {
  return (
    <g>
      <circle cx="0" cy="-34" r="34" fill="#c9ccd1" />
      <circle cx="0" cy="-34" r="28" fill="none" stroke="#8d939b" strokeWidth="2" />
      {[
        ["محمد", -48],
        ["رسول", -32],
        ["الله", -16],
      ].map(([word, y]) => (
        <text key={word} x="0" y={y} textAnchor="middle" fontSize="12" fill="#4b5058" fontWeight="700">
          {word}
        </text>
      ))}
    </g>
  );
}

// ---------------------------------------------------------------------------------------------
// Characters with faces, drawn simply: ordinary people, Quraysh, and those the rule in CONTENT.md
// allows. Never the Prophet ﷺ, a prophet, or the companions it lists.

const SKINS = ["#d9a77a", "#c48b5c", "#a8744a", "#8a5a3a"];
const HEADCLOTHS = ["#efe6d2", "#7a2e2e", "#c9a878", "#5e6e5a", "#3b2a1e"];

type Pose = "stand" | "wave" | "point" | "carry" | "sit";

function Person({
  x = 0,
  seed = 1,
  pose = "stand",
  beard = true,
  flip = false,
}: {
  x?: number;
  seed?: number;
  pose?: Pose;
  beard?: boolean;
  flip?: boolean;
}) {
  const reduce = useReducedMotion();
  const skin = SKINS[seed % SKINS.length]!;
  const cloth = HEADCLOTHS[(seed * 3) % HEADCLOTHS.length]!;
  const robe = ROBES[(seed * 5) % ROBES.length]!;
  const sitting = pose === "sit";
  const body = sitting ? "M-6 -16h12l4 10h-20Z" : "M-6 -22h12l3 22h-18Z";
  const headY = sitting ? -21 : -27;
  return (
    <g transform={`translate(${x} 0) scale(${flip ? -1 : 1} 1)`}>
      <Bob by={0.6} seconds={2.2 + (seed % 4) * 0.4} delay={(seed % 5) * 0.3}>
        {sitting && <ellipse cx="0" cy="-5" rx="11" ry="4" fill={robe} />}
        <path d={body} fill={robe} stroke="#00000026" strokeWidth="0.6" />
        {/* Arms in the robe's shade. */}
        {pose === "stand" && <path d="M-5 -19l-3 11M5 -19l3 11" stroke="#00000030" strokeWidth="2.6" strokeLinecap="round" />}
        {pose === "point" && <path d="M-5 -19l-3 11M5 -19l11 -3" stroke="#00000030" strokeWidth="2.6" strokeLinecap="round" />}
        {pose === "carry" && (
          <g>
            <path d="M-5 -19l-2 -10M5 -19l2 -10" stroke="#00000030" strokeWidth="2.6" strokeLinecap="round" />
            <rect x="-7" y="-37" width="14" height="5" rx="1" fill={MUD} stroke={MUD_DARK} strokeWidth="0.6" />
          </g>
        )}
        {pose === "wave" && (
          <>
            <path d="M-5 -19l-3 11" stroke="#00000030" strokeWidth="2.6" strokeLinecap="round" />
            <motion.path
              d="M5 -19l6 -10"
              stroke="#00000030"
              strokeWidth="2.6"
              strokeLinecap="round"
              style={{ originX: "5px", originY: "-19px" }}
              animate={reduce ? {} : { rotate: [-15, 20, -15] }}
              transition={{ duration: 0.9 + (seed % 3) * 0.2, repeat: Infinity, ease: "easeInOut" }}
            />
          </>
        )}
        {sitting && <path d="M-5 -14l-5 6M5 -14l5 6" stroke="#00000030" strokeWidth="2.6" strokeLinecap="round" />}
        {/* The head: a face of a few strokes, under a headcloth. */}
        <circle cx="0" cy={headY} r="4.6" fill={skin} />
        <circle cx="-1.7" cy={headY - 0.3} r="0.6" fill="#2b1d14" />
        <circle cx="1.7" cy={headY - 0.3} r="0.6" fill="#2b1d14" />
        <path d={`M-2.6 ${headY - 1.8}h1.8M0.8 ${headY - 1.8}h1.8`} stroke="#2b1d14" strokeWidth="0.5" strokeLinecap="round" />
        {beard ? (
          <path d={`M-3.8 ${headY + 1.2}q3.8 6 7.6 0q-0.8 4-3.8 4.2q-3-0.2-3.8-4.2Z`} fill="#2b1d14" />
        ) : (
          <path d={`M-1 ${headY + 2}h2`} stroke="#7a3b2a" strokeWidth="0.6" strokeLinecap="round" />
        )}
        <path d={`M-5.4 ${headY + 1}q0-8 5.4-8q5.4 0 5.4 8l1 5h-2.2l-0.6-4.4q-3.6-4-7.2 0l-0.6 4.4h-2.2Z`} fill={cloth} />
        <path d={`M-4.6 ${headY - 3}h9.2`} stroke="#00000040" strokeWidth="0.9" />
      </Bob>
    </g>
  );
}

function People({ count = 5, pose = "stand" }: { count?: number | undefined; pose?: Pose }) {
  return (
    <g>
      {Array.from({ length: count }, (_, index) => (
        <Person
          key={index}
          x={(index - (count - 1) / 2) * 13}
          seed={index + 2}
          pose={pose}
          beard={index % 3 !== 2}
          flip={index % 2 === 1}
        />
      ))}
    </g>
  );
}

/** The people of Madinah who came out each morning to wait, and welcomed him. */
function Wavers({ count = 6 }: { count?: number | undefined }) {
  return (
    <g>
      {Array.from({ length: count }, (_, index) => (
        <Person
          key={index}
          x={(index - (count - 1) / 2) * 13}
          seed={index + 7}
          pose={index % 2 ? "wave" : "stand"}
          beard={index % 3 !== 1}
        />
      ))}
    </g>
  );
}

/** Quraysh's elders sitting in council, one of them standing to speak. */
function Council() {
  return (
    <g>
      {[-30, -15, 15, 30].map((x, index) => (
        <Person key={x} x={x} seed={index + 21} pose="sit" flip={x > 0} />
      ))}
      <Person x={0} seed={25} pose="point" />
    </g>
  );
}

/** The pursuers searching the mountain, one pointing at the ground. */
function Searchers() {
  return (
    <g>
      <Person x={-14} seed={31} pose="point" />
      <Person x={2} seed={32} />
      <Person x={16} seed={33} pose="point" flip />
    </g>
  );
}

/** A watchtower (utum) of Madinah, the man on it calling out that the travellers had come. */
function Lookout() {
  return (
    <g>
      <path d="M-14 0V-64h28V0Z" fill="#7d7468" />
      <path d="M-17 -64h34v-4h-34Z" fill="#6a6257" />
      <path d="M-4 0v-12h8V0Z" fill="#3d2a18" />
      <g transform="translate(0 -68)">
        <Person seed={41} pose="wave" />
      </g>
    </g>
  );
}

/** Suraqa's mare sunk to her knees in the sand, Suraqa still in the saddle. */
function Suraqa() {
  const reduce = useReducedMotion();
  return (
    <g>
      <motion.g animate={reduce ? {} : { y: [0, 3, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}>
        <ellipse cx="0" cy="-12" rx="17" ry="7" fill="#6b3f22" />
        <path d="M14 -14q7-3 9-14" stroke="#6b3f22" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M21 -30l5-2-1 6Z" fill="#6b3f22" />
        <path d="M-17 -12q-6 2-8 8" stroke="#3b2a1e" strokeWidth="2" fill="none" />
        <g transform="translate(-2 -16)">
          <Person seed={51} pose="sit" />
        </g>
      </motion.g>
      <path d="M-30 0q30-12 60 0Z" fill="#d9b874" />
      <Dust />
    </g>
  );
}

/**
 * The travellers: the guide leading on his camel, and the two camels behind him with a light above
 * each saddle, for those who are never drawn.
 */
function Party() {
  return (
    <g>
      <g transform="translate(48 0)">
        <Camel load />
        <g transform="translate(-1 -28)">
          <Person seed={61} pose="sit" />
        </g>
      </g>
      {[0, -48].map((x) => (
        <g key={x} transform={`translate(${x} 0)`}>
          <Camel load />
          <Pulse from={0.45} to={0.85} seconds={3}>
            <circle cx="0" cy="-42" r="8" fill={GOLD_SOFT} />
            <circle cx="0" cy="-42" r="16" fill={GOLD} opacity={0.2} />
          </Pulse>
        </g>
      ))}
    </g>
  );
}

function BrickCarriers() {
  return (
    <g>
      {[-36, -12, 12, 36].map((x, index) => (
        <Person key={x} x={x} seed={index + 71} pose={index % 2 ? "carry" : "stand"} flip={index % 2 === 0} />
      ))}
      <path d="M-60 0h16v-8h-16ZM44 0h16v-10H44Z" fill={MUD} stroke={MUD_DARK} strokeWidth="0.8" />
    </g>
  );
}

/** The harra: Madinah's fields of black volcanic stone. */
function Harrah() {
  const next = seeded(83);
  return (
    <g>
      {Array.from({ length: 22 }, (_, index) => (
        <ellipse
          key={index}
          cx={(next() - 0.5) * 220}
          cy={-next() * 10}
          rx={4 + next() * 9}
          ry={2 + next() * 4}
          fill={index % 3 ? "#3a3530" : "#2b2622"}
        />
      ))}
    </g>
  );
}

/** The Red Sea along the horizon, for the coastal road. */
function Coast() {
  return (
    <g>
      <rect x="-320" y="-16" width="640" height="16" fill="#2a7f9e" />
      <path
        d="M-300 -10q20-4 40 0t40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0"
        stroke="#cfe8ef"
        strokeOpacity={0.5}
        strokeWidth="1.5"
        fill="none"
      />
    </g>
  );
}

// ---------------------------------------------------------------------------------------------
// The registry: how to draw each part, and how tall it stands (for its tap marker).

export const PARTS: Record<ScenePart, { draw: (item: SceneItem) => ReactNode; height: number }> = {
  house: { draw: () => <House />, height: 28 },
  "house-2": { draw: () => <House floors={2} />, height: 52 },
  "house-lit": { draw: () => <House lit />, height: 28 },
  kaaba: { draw: () => <Kaaba />, height: 52 },
  "kaaba-building": { draw: () => <KaabaBuilding />, height: 46 },
  mosque: { draw: () => <Mosque />, height: 32 },
  fort: { draw: () => <Fort />, height: 46 },
  court: { draw: () => <Court />, height: 62 },
  tent: { draw: () => <Tent />, height: 24 },
  "tent-blown": { draw: () => <Tent blown />, height: 24 },
  arish: { draw: () => <Arish />, height: 30 },
  well: { draw: () => <Well />, height: 28 },
  graves: { draw: () => <Graves />, height: 12 },
  trench: { draw: () => <Trench />, height: 10 },
  rock: { draw: () => <Rock />, height: 32 },
  "mount-nour": { draw: () => <MountNour />, height: 92 },
  "mount-thawr": { draw: () => <MountThawr />, height: 60 },
  uhud: { draw: () => <Uhud />, height: 60 },
  rumat: { draw: () => <Rumat />, height: 64 },
  palm: { draw: () => <Palm />, height: 80 },
  acacia: { draw: () => <Acacia />, height: 78 },
  bush: { draw: () => <Bush />, height: 14 },
  camel: { draw: () => <Camel />, height: 42 },
  "camel-kneeling": { draw: () => <CamelKneeling />, height: 34 },
  caravan: { draw: () => <Caravan />, height: 42 },
  mule: { draw: () => <Mule />, height: 54 },
  sheep: { draw: (item) => <Sheep count={item.count} />, height: 14 },
  ship: { draw: () => <Ship />, height: 70 },
  birds: { draw: (item) => <Birds count={item.count} />, height: 8 },
  dust: { draw: () => <Dust />, height: 20 },
  wind: { draw: () => <Wind />, height: 60 },
  arrows: { draw: () => <Arrows />, height: 90 },
  cloud: { draw: () => <Cloud />, height: 20 },
  streak: { draw: () => <Streak />, height: 200 },
  footprints: { draw: () => <Footprints />, height: 6 },
  crowd: { draw: (item) => <Crowd count={item.count} />, height: 30 },
  rows: { draw: (item) => <Rows count={item.count} />, height: 44 },
  army: { draw: (item) => <Army count={item.count} />, height: 44 },
  diggers: { draw: () => <Diggers />, height: 34 },
  walker: { draw: () => <Walker />, height: 32 },
  "cloth-stone": { draw: () => <ClothStone />, height: 34 },
  light: { draw: () => <Light />, height: 46 },
  lantern: { draw: () => <Lantern />, height: 42 },
  fire: { draw: () => <Fire />, height: 22 },
  banner: { draw: () => <Banner />, height: 42 },
  idols: { draw: () => <Idols />, height: 22 },
  "idols-falling": { draw: () => <IdolsFalling />, height: 18 },
  scroll: { draw: () => <Scroll />, height: 78 },
  seal: { draw: () => <Seal />, height: 70 },
  people: { draw: (item) => <People count={item.count} />, height: 34 },
  wavers: { draw: (item) => <Wavers count={item.count} />, height: 36 },
  council: { draw: () => <Council />, height: 34 },
  searchers: { draw: () => <Searchers />, height: 34 },
  lookout: { draw: () => <Lookout />, height: 102 },
  suraqa: { draw: () => <Suraqa />, height: 44 },
  party: { draw: () => <Party />, height: 58 },
  "brick-carriers": { draw: () => <BrickCarriers />, height: 40 },
  harrah: { draw: () => <Harrah />, height: 14 },
  coast: { draw: () => <Coast />, height: 16 },
};

// ---------------------------------------------------------------------------------------------
// Sky and land

const SKIES: Record<Sky, [string, string]> = {
  day: ["#bfdcea", "#f6e7c4"],
  dawn: ["#38507a", "#f2b880"],
  dusk: ["#6b4a7a", "#f0a060"],
  night: ["#011a15", "#003e32"],
};

function stars(count: number, seed: number) {
  const next = seeded(seed);
  return Array.from({ length: count }, () => ({ x: next() * 400, y: next() * 180, r: 0.4 + next() * 1.1, delay: next() * 4 }));
}

function SkyLayer({ sky }: { sky: Sky }) {
  const reduce = useReducedMotion();
  const [top, bottom] = SKIES[sky];
  return (
    <>
      <defs>
        <linearGradient id={`seerah-sky-${sky}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={bottom} />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill={`url(#seerah-sky-${sky})`} />
      {sky === "night" && (
        <>
          <g fill="#ffffff">
            {stars(60, 17).map((star, index) => (
              <motion.circle
                key={index}
                cx={star.x}
                cy={star.y}
                r={star.r}
                initial={{ opacity: 0.8 }}
                animate={reduce ? {} : { opacity: [0.8, 0.2, 0.8] }}
                transition={{ duration: 3 + star.delay, repeat: Infinity, delay: star.delay }}
              />
            ))}
          </g>
          <path d="M330 48a20 20 0 1 0 17 31 16 16 0 1 1-17-31Z" fill={GOLD_SOFT} />
        </>
      )}
      {sky === "day" && <circle cx="330" cy="62" r="22" fill="#fbe7a8" />}
      {sky === "dawn" && (
        <motion.circle
          cx="90"
          r="26"
          fill="#f9d48a"
          initial={{ cy: reduce ? 170 : 205 }}
          animate={{ cy: 170 }}
          transition={{ duration: 5, ease: "easeOut" }}
        />
      )}
      {sky === "dusk" && (
        <motion.circle
          cx="320"
          r="26"
          fill="#f9c070"
          initial={{ cy: 168 }}
          animate={{ cy: reduce ? 168 : 196 }}
          transition={{ duration: 6, ease: "easeIn" }}
        />
      )}
    </>
  );
}

function Waves() {
  const reduce = useReducedMotion();
  return (
    <>
      {[226, 250, 274].map((y, index) => (
        <motion.path
          key={y}
          d={`M-40 ${y}q25-7 50 0t50 0 50 0 50 0 50 0 50 0 50 0 50 0 50 0 50 0`}
          stroke="#cfe8ef"
          strokeOpacity={0.45}
          strokeWidth="2"
          fill="none"
          animate={reduce ? {} : { x: index % 2 ? [0, -25, 0] : [0, 25, 0] }}
          transition={{ duration: 6 + index, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </>
  );
}

function LandLayer({ land }: { land: Land }) {
  switch (land) {
    case "desert":
      return (
        <>
          <path d="M0 214q100-30 200 0t200 0v86H0Z" fill="#e8cf99" />
          <path d="M0 240q120-36 240-4t160 4v60H0Z" fill="#d9b874" />
        </>
      );
    case "plain":
      return <path d="M0 216h400v84H0Z" fill={SAND} />;
    case "town":
      return (
        <>
          <g fill="#c2a172">
            {[20, 60, 95, 140, 250, 290, 330, 370].map((x, index) => (
              <rect key={x} x={x} y={200 - (index % 3) * 6} width={26 + (index % 2) * 10} height={18 + (index % 3) * 6} />
            ))}
          </g>
          <path d="M0 216h400v84H0Z" fill={SAND} />
        </>
      );
    case "mountains":
      return (
        <>
          <path d="M0 216 50 170l40 20 60-50 50 40 50-30 60 46 50-20 40 40Z" fill="#8c7258" />
          <path d="M0 216h400v84H0Z" fill={SAND} />
        </>
      );
    case "valley":
      return (
        <>
          <path d="M0 230V120l60 30 40 80Z" fill="#7a6048" />
          <path d="M400 230V110l-70 40-40 80Z" fill="#7a6048" />
          <path d="M0 230h400v70H0Z" fill="#cdb07c" />
        </>
      );
    case "oasis":
      return (
        <>
          <g fill="#3f6b4a">
            {[30, 70, 110, 290, 330, 370].map((x) => (
              <ellipse key={x} cx={x} cy={204} rx="16" ry="7" />
            ))}
          </g>
          <path d="M0 214h400v86H0Z" fill="#cfb684" />
        </>
      );
    case "sea":
      return (
        <>
          <path d="M0 196q60-8 120 0v10H0Z" fill="#c9b07e" />
          <rect y="204" width="400" height="96" fill="#2a7f9e" />
          <Waves />
        </>
      );
  }
}

// ---------------------------------------------------------------------------------------------
// Composing a scene

/** Far things sit small near the horizon, near things large at the bottom. */
export function depthOf(y: number) {
  return Math.min(1, Math.max(0, (y - 200) / 90));
}

function Placed({
  item,
  pointer,
  onNote,
  active,
}: {
  item: SceneItem;
  pointer: MotionValue<number>;
  onNote: (note: string) => void;
  active: boolean;
}) {
  const reduce = useReducedMotion();
  const y = item.y ?? 250;
  const depth = depthOf(y);
  const scale = (0.8 + depth * 1.2) * (item.size ?? 1);
  // Near things drift further than far ones as the pointer moves: the scene's depth.
  const drift = useTransform(pointer, (value) => value * (2 + depth * 14));
  const part = PARTS[item.part];
  const top = (-part.height - 8) * scale;
  const note = item.note;

  return (
    <motion.g style={{ x: drift }}>
      <g transform={`translate(${item.x} ${y})`}>
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
              onClick={() => onNote(note)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onNote(note);
                }
              }}
            >
              {/* A generous hit area around a small marker. */}
              <circle cx="0" cy={top} r="16" fill="transparent" />
              <motion.circle
                cx="0"
                cy={top}
                fill="none"
                stroke={GOLD}
                strokeWidth="2"
                initial={{ r: 7, opacity: 0.9 }}
                animate={reduce ? {} : { r: [5, 12], opacity: [0.9, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
              />
              <circle cx="0" cy={top} r="4.5" fill={active ? "#ffffff" : GOLD} stroke="#ffffff" strokeWidth="1.5" />
            </g>
          )}
        </motion.g>
      </g>
    </motion.g>
  );
}

export function SeerahScene({ sky, land, items }: { sky: Sky; land: Land; items: SceneItem[] }) {
  const [note, setNote] = useState<string | null>(null);
  const raw = useMotionValue(0);
  const pointer = useSpring(raw, { stiffness: 40, damping: 14 });
  const night = sky === "night";
  const sorted = [...items].sort((a, b) => (a.y ?? 250) - (b.y ?? 250));
  const hasNotes = items.some((item) => item.note);

  return (
    <div
      className="relative size-full"
      onPointerMove={(event) => {
        const box = event.currentTarget.getBoundingClientRect();
        raw.set(((event.clientX - box.left) / box.width - 0.5) * 2);
      }}
      onPointerLeave={() => raw.set(0)}
    >
      <svg
        viewBox="0 0 400 300"
        preserveAspectRatio="xMidYMid slice"
        className="size-full"
        role="img"
        aria-label="مشهد يصوّر هذا الجزء من القصة"
      >
        <NightContext.Provider value={night}>
          <SkyLayer sky={sky} />
          <LandLayer land={land} />
          {(night || sky === "dusk") && <rect y="196" width="400" height="104" fill="#000" opacity={night ? 0.45 : 0.15} />}
          {sorted.map((item, index) => (
            <Placed
              key={`${item.part}-${index}`}
              item={item}
              pointer={pointer}
              onNote={(text) => setNote((current) => (current === text ? null : text))}
              active={note === item.note}
            />
          ))}
        </NightContext.Provider>
      </svg>
      <AnimatePresence mode="wait">
        {note ? (
          <motion.button
            key={note}
            type="button"
            onClick={() => setNote(null)}
            className="absolute inset-x-3 bottom-3 rounded-2xl bg-white/95 px-4 py-3 text-start text-sm leading-7 text-ink shadow-lg backdrop-blur"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
          >
            {note}
          </motion.button>
        ) : hasNotes ? (
          <motion.span
            key="hint"
            className="pointer-events-none absolute bottom-3 start-3 rounded-full bg-black/35 px-3 py-1 text-xs text-white backdrop-blur"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            المس النقاط المضيئة لتعرف أكثر
          </motion.span>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
