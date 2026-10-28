"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { SceneId } from "./seerahContent";

/*
 * The stage when a beat isn't on the map: places and skies, drawn in a 400×300 frame. No figure
 * appears in any of them.
 */

/** The same sky every time: a small seeded generator instead of Math.random. */
function stars(count: number, seed: number, maxY: number) {
  let state = seed;
  const next = () => ((state = (state * 16807) % 2147483647) - 1) / 2147483646;
  return Array.from({ length: count }, () => ({ x: next() * 400, y: next() * maxY, r: 0.4 + next() * 1.1, delay: next() * 4 }));
}

function Stars({ count, seed, maxY }: { count: number; seed: number; maxY: number }) {
  const reduce = useReducedMotion();
  return (
    <g fill="white">
      {stars(count, seed, maxY).map((star, index) => (
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
  );
}

function NightSky({ id }: { id: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#011a15" />
          <stop offset="1" stopColor="var(--color-emerald-deep)" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill={`url(#${id}-sky)`} />
      <Stars count={70} seed={id.length * 7919} maxY={220} />
    </>
  );
}

function Night() {
  const reduce = useReducedMotion();
  return (
    <>
      <NightSky id="night" />
      <motion.path
        d="M318 58a26 26 0 1 0 22 40 21 21 0 1 1-22-40Z"
        fill="var(--color-gold-soft)"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduce ? 0 : 2 }}
      />
      <path d="M0 250 70 205l60 30 70-50 80 45 60-25 60 30v65H0Z" fill="#011a15" />
    </>
  );
}

function Kaaba() {
  const reduce = useReducedMotion();
  return (
    <>
      <NightSky id="kaaba" />
      <path d="M0 262h400v38H0Z" fill="#0b2a22" />
      <motion.g initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduce ? 0 : 1.6 }}>
        <ellipse cx="200" cy="262" rx="120" ry="10" fill="var(--color-gold)" opacity={0.12} />
        <path d="M150 150 210 138l50 14v110l-50 8-60-8Z" fill="#0d0d0d" />
        <path d="m210 138 50 14v110l-50 8Z" fill="#1c1c1c" />
        <path d="m150 172 60-8 50 10v8l-50-10-60 8Z" fill="var(--color-gold)" />
        <path d="M222 205h18v52l-18 2Z" fill="var(--color-gold-deep)" opacity={0.8} />
      </motion.g>
    </>
  );
}

function Cave() {
  const reduce = useReducedMotion();
  return (
    <>
      <NightSky id="cave" />
      {/* Looking out from inside: the mouth of the cave framing the night. */}
      <path d="M0 0h400v300H0Z M120 250c-6-60 10-120 40-150 30-28 70-30 100-6 34 28 44 90 34 156Z" fill="#14100b" fillRule="evenodd" />
      <path d="M120 250c-6-60 10-120 40-150 30-28 70-30 100-6 34 28 44 90 34 156" fill="none" stroke="#2a2117" strokeWidth="10" />
      <motion.ellipse
        cx="210"
        cy="270"
        rx="110"
        ry="40"
        fill="var(--color-gold)"
        initial={{ opacity: 0.08 }}
        animate={reduce ? {} : { opacity: [0.08, 0.16, 0.08] }}
        transition={{ duration: 5, repeat: Infinity }}
      />
    </>
  );
}

function Masjid() {
  const reduce = useReducedMotion();
  // The first mosque: walls of mud brick, palm trunks for pillars, a roof of palm fronds.
  const pillars = [150, 185, 220, 255];
  return (
    <>
      <defs>
        <linearGradient id="masjid-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6e7c4" />
          <stop offset="1" stopColor="var(--color-gold-mist)" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#masjid-sky)" />
      <circle cx="320" cy="70" r="26" fill="var(--color-gold-soft)" />
      <path d="M0 250h400v50H0Z" fill="#d9c08f" />
      <motion.g initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduce ? 0 : 1.4 }}>
        <path d="M110 250v-70h190v70Z" fill="#b98d5a" />
        <path d="M100 182h210l-6-12H106Z" fill="#7b5b33" />
        {pillars.map((x) => (
          <rect key={x} x={x} y={190} width="8" height="60" fill="#6b4a26" />
        ))}
        <path d="M110 214h190" stroke="#a37a49" strokeWidth="2" />
      </motion.g>
      {[60, 345].map((x, index) => (
        <motion.g
          key={x}
          style={{ originX: `${x}px`, originY: "250px" }}
          animate={reduce ? {} : { rotate: [0, index ? -1.5 : 1.5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          <path d={`M${x} 250c2-40 0-70-4-100`} stroke="#6b4a26" strokeWidth="6" fill="none" />
          {[-70, -35, 0, 35, 70, 110, 150].map((angle) => (
            <path
              key={angle}
              d={`M${x - 4} 150q${30 * Math.cos(((angle - 90) * Math.PI) / 180)} ${-10 + 20 * Math.sin(((angle - 90) * Math.PI) / 180)} ${44 * Math.cos(((angle - 90) * Math.PI) / 180)} ${30 + 24 * Math.sin(((angle - 90) * Math.PI) / 180)}`}
              stroke="var(--color-emerald)"
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
            />
          ))}
        </motion.g>
      ))}
    </>
  );
}

function Dunes() {
  const reduce = useReducedMotion();
  const layers = [
    { d: "M0 200q100-40 200 0t200 0v100H0Z", fill: "#e8cf99", drift: 6 },
    { d: "M0 230q120-50 240-5t160 5v70H0Z", fill: "#d9b874", drift: 12 },
    { d: "M0 262q90-30 200 0t200-6v44H0Z", fill: "#c79d55", drift: 20 },
  ];
  return (
    <>
      <defs>
        <linearGradient id="dunes-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f3d9a4" />
          <stop offset="1" stopColor="#fbf0d9" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#dunes-sky)" />
      <motion.circle
        cx="110"
        cy="120"
        r="34"
        fill="#f7e2ae"
        initial={{ cy: 150 }}
        animate={{ cy: 120 }}
        transition={{ duration: reduce ? 0 : 3, ease: "easeOut" }}
      />
      {layers.map((layer) => (
        <motion.path
          key={layer.fill}
          d={layer.d}
          fill={layer.fill}
          initial={{ x: 0 }}
          animate={reduce ? {} : { x: [0, -layer.drift, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </>
  );
}

function Mountain() {
  const reduce = useReducedMotion();
  // Jabal al-Nour at night, the cave of Hira a lit notch near its top.
  return (
    <>
      <NightSky id="mountain" />
      <path d="M0 300V230l90-40 70-110 30 20 60 90 70 30 80-10v110Z" fill="#071a14" />
      <path d="m160 80 30 20 60 90-40-30-25-55Z" fill="#0d2a21" />
      <motion.ellipse
        cx="176"
        cy="104"
        rx="9"
        ry="6"
        fill="var(--color-gold)"
        initial={{ opacity: 0.4 }}
        animate={reduce ? {} : { opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      <motion.circle
        cx="176"
        cy="104"
        r="30"
        fill="var(--color-gold)"
        initial={{ opacity: 0.08 }}
        animate={reduce ? {} : { opacity: [0.08, 0.2, 0.08] }}
        transition={{ duration: 4, repeat: Infinity }}
      />
    </>
  );
}

function Sea() {
  const reduce = useReducedMotion();
  const waves = [210, 235, 260, 285];
  return (
    <>
      <defs>
        <linearGradient id="sea-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6dfb0" />
          <stop offset="1" stopColor="#fbefd6" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#sea-sky)" />
      <circle cx="300" cy="150" r="30" fill="#f7d58c" />
      <rect y="185" width="400" height="115" fill="#2a7f9e" />
      {/* An empty boat with its sail up, riding the swell. */}
      <motion.g
        initial={{ y: 0 }}
        animate={reduce ? {} : { y: [0, -4, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <path d="M150 196h90l-14 18h-62Z" fill="#6b4a26" />
        <path d="M195 196V120l38 70Z" fill="#fbf8f1" />
        <path d="M195 196V128l-30 62Z" fill="#efe6d2" />
      </motion.g>
      {waves.map((y, index) => (
        <motion.path
          key={y}
          d={`M-20 ${y}q25-8 50 0t50 0 50 0 50 0 50 0 50 0 50 0 50 0 50 0`}
          stroke="#cfe8ef"
          strokeOpacity={0.5}
          strokeWidth="2"
          fill="none"
          initial={{ x: 0 }}
          animate={reduce ? {} : { x: index % 2 ? [0, -25, 0] : [0, 25, 0] }}
          transition={{ duration: 6 + index, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </>
  );
}

function Uhud() {
  return (
    <>
      <defs>
        <linearGradient id="uhud-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e9b07a" />
          <stop offset="1" stopColor="#f6dcb6" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#uhud-sky)" />
      {/* Uhud's long red ridge behind, the archers' small hill before it with its flag. */}
      <path d="M0 210 40 150l50 20 40-60 60 40 50-50 60 50 50-20 50 50v80H0Z" fill="#8a4b32" />
      <path d="M0 220 60 190l70 10 80-30 70 30 120-10v90H0Z" fill="#a35d3d" opacity={0.8} />
      <path d="M0 260h400v40H0Z" fill="#d9b874" />
      <path d="M230 262c10-28 40-40 70-40s50 20 60 40Z" fill="#b98a55" />
      <path d="M296 222v-22" stroke="#6b4a26" strokeWidth="2" />
      <path d="M296 200h16l-4 5 4 5h-16Z" fill="var(--color-emerald)" />
    </>
  );
}

function Trench() {
  const reduce = useReducedMotion();
  return (
    <>
      <NightSky id="trench" />
      <path d="M0 200h400v100H0Z" fill="#3b2c1c" />
      {/* The ditch running across the plain, the dug earth heaped along its near side. */}
      <path d="M0 232c80-8 160 6 240-2s120 6 160 0v26c-60 4-100-6-160 2S80 252 0 260Z" fill="#120c06" />
      {[30, 95, 160, 225, 290, 355].map((x) => (
        <path key={x} d={`M${x - 26} 268q26-18 52 0Z`} fill="#5a432a" />
      ))}
      {/* The wind that drove the confederates away. */}
      {[70, 120, 170].map((y, index) => (
        <motion.path
          key={y}
          d={`M-60 ${y}q40-10 80 0t80 0 80 0`}
          stroke="#ffffff"
          strokeOpacity={0.25}
          strokeWidth="2"
          fill="none"
          initial={{ x: 0 }}
          animate={reduce ? {} : { x: [0, 460] }}
          transition={{ duration: 3 + index, repeat: Infinity, ease: "linear", delay: index }}
        />
      ))}
    </>
  );
}

function Tree() {
  const reduce = useReducedMotion();
  // The acacia (samura) of the pledge of Ridwan: a flat crown on a crooked trunk.
  return (
    <>
      <defs>
        <linearGradient id="tree-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f3d9a4" />
          <stop offset="1" stopColor="#fbf0d9" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#tree-sky)" />
      <path d="M0 250q100-20 200 0t200 0v50H0Z" fill="#d9b874" />
      <path
        d="M200 255c-6-40 6-70-4-100M198 175c-20-14-40-18-60-30M200 165c22-10 40-16 64-30"
        stroke="#6b4a26"
        strokeWidth="7"
        fill="none"
        strokeLinecap="round"
      />
      <motion.g
        style={{ originX: "200px", originY: "160px" }}
        animate={reduce ? {} : { rotate: [0, 0.8, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      >
        <ellipse cx="200" cy="128" rx="120" ry="26" fill="#4f7a3a" />
        <ellipse cx="160" cy="118" rx="60" ry="16" fill="#5d8a45" />
        <ellipse cx="250" cy="120" rx="54" ry="14" fill="#5d8a45" />
      </motion.g>
    </>
  );
}

function Letter() {
  const reduce = useReducedMotion();
  // A letter unrolled, sealed with the ring's impression.
  return (
    <>
      <rect width="400" height="300" fill="var(--color-emerald-deep)" />
      <motion.g initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduce ? 0 : 1.2 }}>
        <path d="M110 60h180v180H110Z" fill="#f3e6c6" />
        <rect x="98" y="50" width="204" height="18" rx="9" fill="#d9c08f" />
        <rect x="98" y="232" width="204" height="18" rx="9" fill="#d9c08f" />
        {[90, 110, 130, 150, 170].map((y, index) => (
          <path
            key={y}
            d={`M${130 + (index % 2) * 14} ${y}h${140 - (index % 2) * 14}`}
            stroke="#b39a6a"
            strokeWidth="3"
            strokeLinecap="round"
          />
        ))}
        <circle cx="200" cy="205" r="18" fill="#c9ccd1" />
        <circle cx="200" cy="205" r="13" fill="none" stroke="#9aa0a8" strokeWidth="2" />
      </motion.g>
    </>
  );
}

function Arafah() {
  const reduce = useReducedMotion();
  // The plain of Arafah toward sunset, Jabal al-Rahmah rising from it.
  return (
    <>
      <defs>
        <linearGradient id="arafah-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e7a86c" />
          <stop offset="1" stopColor="#f8dcb0" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#arafah-sky)" />
      <motion.circle
        cx="90"
        r="30"
        fill="#f9d48a"
        initial={{ cy: 150 }}
        animate={{ cy: reduce ? 150 : 175 }}
        transition={{ duration: 6, ease: "easeInOut" }}
      />
      <path d="M0 200 80 170l60 14 70-24 80 20 110-10v130H0Z" fill="#9c6b45" opacity={0.6} />
      <path d="M150 240c20-50 40-70 60-70s40 20 60 70Z" fill="#7a5233" />
      <path d="M208 172v-20" stroke="#f3e6c6" strokeWidth="4" strokeLinecap="round" />
      <path d="M0 240h400v60H0Z" fill="#d9b874" />
    </>
  );
}

const SCENES: Record<SceneId, () => React.JSX.Element> = {
  night: Night,
  cave: Cave,
  mountain: Mountain,
  kaaba: Kaaba,
  masjid: Masjid,
  dunes: Dunes,
  sea: Sea,
  uhud: Uhud,
  trench: Trench,
  tree: Tree,
  letter: Letter,
  arafah: Arafah,
};

export function SeerahScene({ scene }: { scene: SceneId }) {
  const Scene = SCENES[scene];
  return (
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" className="size-full" aria-hidden>
      <Scene />
    </svg>
  );
}
