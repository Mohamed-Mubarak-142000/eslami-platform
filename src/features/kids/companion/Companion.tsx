"use client";

import { motion, type TargetAndTransition } from "framer-motion";
import type { CompanionAnimal } from "@/lib/supabase/database.types";
import { getRewardItem } from "../rewards/catalog";
import { companionInfo } from "./companionLines";

export type CompanionMood = "idle" | "happy" | "cheer" | "thinking" | "sleepy";

interface Palette {
  fur: string;
  dark: string;
  belly: string;
  inner: string;
}

const PALETTES: Record<CompanionAnimal, Palette> = {
  bear: { fur: "#b9824f", dark: "#7a4e2a", belly: "#f1d7b3", inner: "#e2a77a" },
  panda: { fur: "#ffffff", dark: "#2f2f3a", belly: "#ffffff", inner: "#ffb3c7" },
  rabbit: { fur: "#f4ecf2", dark: "#8b6f80", belly: "#ffffff", inner: "#ffa9c6" },
  fox: { fur: "#f2873a", dark: "#7b3a12", belly: "#fff6ec", inner: "#ffd2ae" },
};

const BODY_MOTION: Record<CompanionMood, TargetAndTransition> = {
  idle: { y: [0, -4, 0], rotate: 0, transition: { duration: 2.6, repeat: Infinity, ease: "easeInOut" } },
  happy: { y: [0, -6, 0], rotate: [0, -4, 4, 0], transition: { duration: 0.9, repeat: Infinity, ease: "easeInOut" } },
  cheer: { y: [0, -26, 0], scale: [1, 1.05, 1], transition: { duration: 0.6, repeat: Infinity, ease: "easeOut" } },
  thinking: { rotate: [0, -6, -6, 0], transition: { duration: 3, repeat: Infinity, ease: "easeInOut" } },
  sleepy: { y: [0, 2, 0], rotate: 0, transition: { duration: 3.4, repeat: Infinity, ease: "easeInOut" } },
};

function Ears({ animal, palette }: { animal: CompanionAnimal; palette: Palette }) {
  if (animal === "rabbit")
    return (
      <g>
        <ellipse cx="74" cy="0" rx="15" ry="42" fill={palette.fur} stroke={palette.dark} strokeWidth="3" transform="rotate(-10 74 0)" />
        <ellipse cx="74" cy="4" rx="7" ry="30" fill={palette.inner} transform="rotate(-10 74 4)" />
        <ellipse cx="126" cy="0" rx="15" ry="42" fill={palette.fur} stroke={palette.dark} strokeWidth="3" transform="rotate(10 126 0)" />
        <ellipse cx="126" cy="4" rx="7" ry="30" fill={palette.inner} transform="rotate(10 126 4)" />
      </g>
    );
  if (animal === "fox")
    return (
      <g stroke={palette.dark} strokeWidth="3" strokeLinejoin="round">
        <path d="M48 58 L58 4 L98 36 Z" fill={palette.fur} />
        <path d="M60 46 L63 18 L84 36 Z" fill={palette.dark} stroke="none" />
        <path d="M152 58 L142 4 L102 36 Z" fill={palette.fur} />
        <path d="M140 46 L137 18 L116 36 Z" fill={palette.dark} stroke="none" />
      </g>
    );
  const earFill = animal === "panda" ? palette.dark : palette.fur;
  return (
    <g stroke={palette.dark} strokeWidth="3">
      <circle cx="56" cy="36" r="19" fill={earFill} />
      <circle cx="144" cy="36" r="19" fill={earFill} />
      {animal === "bear" && (
        <>
          <circle cx="56" cy="36" r="9" fill={palette.inner} stroke="none" />
          <circle cx="144" cy="36" r="9" fill={palette.inner} stroke="none" />
        </>
      )}
    </g>
  );
}

function Eyes({ mood, animal, palette }: { mood: CompanionMood; animal: CompanionAnimal; palette: Palette }) {
  const ink = "#2b2230";
  const patches = animal === "panda" && (
    <g fill={palette.dark}>
      <ellipse cx="78" cy="82" rx="15" ry="19" transform="rotate(-25 78 82)" />
      <ellipse cx="122" cy="82" rx="15" ry="19" transform="rotate(25 122 82)" />
    </g>
  );
  const pupil = animal === "panda" ? "#ffffff" : ink;
  if (mood === "happy" || mood === "cheer")
    return (
      <g>
        {patches}
        <path d="M70 84 Q79 72 88 84" fill="none" stroke={pupil} strokeWidth="5" strokeLinecap="round" />
        <path d="M112 84 Q121 72 130 84" fill="none" stroke={pupil} strokeWidth="5" strokeLinecap="round" />
      </g>
    );
  if (mood === "sleepy")
    return (
      <g>
        {patches}
        <path d="M70 82 Q79 88 88 82" fill="none" stroke={pupil} strokeWidth="5" strokeLinecap="round" />
        <path d="M112 82 Q121 88 130 82" fill="none" stroke={pupil} strokeWidth="5" strokeLinecap="round" />
      </g>
    );
  const lookY = mood === "thinking" ? 76 : 81;
  return (
    <g>
      {patches}
      <motion.g
        style={{ originY: "81px" }}
        animate={{ scaleY: [1, 1, 0.1, 1] }}
        transition={{ duration: 0.35, times: [0, 0.4, 0.6, 1], repeat: Infinity, repeatDelay: 3.2 }}
      >
        <circle cx="79" cy={lookY} r="7" fill={pupil} />
        <circle cx="121" cy={lookY} r="7" fill={pupil} />
        <circle cx="81.5" cy={lookY - 2.5} r="2.4" fill={animal === "panda" ? ink : "#ffffff"} />
        <circle cx="123.5" cy={lookY - 2.5} r="2.4" fill={animal === "panda" ? ink : "#ffffff"} />
      </motion.g>
    </g>
  );
}

function Mouth({ mood, animal }: { mood: CompanionMood; animal: CompanionAnimal }) {
  const ink = "#2b2230";
  return (
    <g>
      <ellipse cx="100" cy="97" rx="7" ry="5" fill={ink} />
      {mood === "cheer" ? (
        <path d="M88 105 Q100 124 112 105 Z" fill="#c2304f" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
      ) : mood === "thinking" ? (
        <circle cx="104" cy="110" r="4" fill="none" stroke={ink} strokeWidth="3" />
      ) : (
        <path d="M90 104 Q95 111 100 104 Q105 111 110 104" fill="none" stroke={ink} strokeWidth="3" strokeLinecap="round" />
      )}
      {animal === "rabbit" && mood !== "cheer" && (
        <rect x="96" y="106" width="8" height="8" rx="2" fill="#ffffff" stroke={ink} strokeWidth="2" />
      )}
    </g>
  );
}

function BackItems({ equipped }: { equipped: string[] }) {
  return (
    <g>
      {equipped.includes("cape") && (
        <path d="M58 128 Q100 120 142 128 L158 214 Q100 226 42 214 Z" fill="#e84a67" stroke="#a52640" strokeWidth="3" />
      )}
      {equipped.includes("backpack") && (
        <g stroke="#7a4e2a" strokeWidth="3">
          <rect x="132" y="138" width="40" height="54" rx="12" fill="#f5b92e" />
          <rect x="140" y="160" width="24" height="16" rx="5" fill="#ffd66b" />
        </g>
      )}
    </g>
  );
}

function FrontItems({ equipped }: { equipped: string[] }) {
  return (
    <g>
      {equipped.includes("scarf") && (
        <g stroke="#1f6f9e" strokeWidth="3" strokeLinejoin="round">
          <path d="M62 126 Q100 142 138 126 L138 140 Q100 156 62 140 Z" fill="#1f9be0" />
          <path d="M116 142 L128 176 L112 178 L106 146 Z" fill="#1f9be0" />
        </g>
      )}
      {equipped.includes("bowtie") && (
        <g stroke="#a52640" strokeWidth="3" strokeLinejoin="round" fill="#e84a67">
          <path d="M100 136 L80 126 L80 148 Z" />
          <path d="M100 136 L120 126 L120 148 Z" />
          <circle cx="100" cy="137" r="5" />
        </g>
      )}
      {equipped.includes("glasses") && (
        <g fill="rgb(255 255 255 / 35%)" stroke="#2b2230" strokeWidth="3.5">
          <circle cx="79" cy="81" r="15" />
          <circle cx="121" cy="81" r="15" />
          <path d="M94 80 Q100 75 106 80" fill="none" />
        </g>
      )}
      {equipped.includes("cap") && (
        <g stroke="#a52640" strokeWidth="3" strokeLinejoin="round">
          <path d="M54 52 Q100 -2 146 52 Z" fill="#e84a67" />
          <path d="M100 52 Q140 44 172 56 Q140 64 100 58 Z" fill="#c9304f" />
          <circle cx="100" cy="22" r="6" fill="#ffd66b" />
        </g>
      )}
      {equipped.includes("crown") && (
        <g stroke="#b07a00" strokeWidth="3" strokeLinejoin="round">
          <path d="M64 42 L64 12 L82 28 L100 4 L118 28 L136 12 L136 42 Z" fill="#f5c542" />
          <circle cx="100" cy="30" r="5" fill="#e84a67" stroke="none" />
          <circle cx="78" cy="34" r="4" fill="#1f9be0" stroke="none" />
          <circle cx="122" cy="34" r="4" fill="#12a15b" stroke="none" />
        </g>
      )}
      {equipped.includes("flower-crown") && (
        <g>
          {[
            [60, 44, "#ff8fb1"],
            [78, 30, "#ffd66b"],
            [100, 25, "#ff8fb1"],
            [122, 30, "#9ad7ff"],
            [140, 44, "#ffd66b"],
          ].map(([x, y, color]) => (
            <g key={`${x}`}>
              <circle cx={x as number} cy={y as number} r="9" fill={color as string} stroke="#ffffff" strokeWidth="2" />
              <circle cx={x as number} cy={y as number} r="3.5" fill="#f5a623" />
            </g>
          ))}
        </g>
      )}
    </g>
  );
}

interface CompanionProps {
  animal: CompanionAnimal;
  equipped?: string[];
  mood?: CompanionMood;
  className?: string;
}

/** The child's companion: one shared rig, four animals, with the worn items layered on. */
export function Companion({ animal, equipped = [], mood = "idle", className }: CompanionProps) {
  const palette = PALETTES[animal];
  const worn = equipped.filter((id) => getRewardItem(id)?.kind === "companion");
  const stroke = palette.dark;
  return (
    <svg viewBox="0 -46 200 270" className={className} role="img" aria-label={companionInfo(animal).name}>
      <motion.g animate={BODY_MOTION[mood]} style={{ originX: "100px", originY: "200px" }}>
        <BackItems equipped={worn} />
        {animal === "fox" && (
          <g stroke={stroke} strokeWidth="3" strokeLinejoin="round">
            <path d="M136 196 Q196 190 184 130 Q176 160 140 170 Z" fill={palette.fur} />
            <path d="M184 130 Q192 150 178 160 Q172 146 184 130 Z" fill="#ffffff" />
          </g>
        )}
        {animal === "rabbit" && <circle cx="146" cy="196" r="13" fill="#ffffff" stroke={stroke} strokeWidth="3" />}
        {/* body */}
        <ellipse cx="100" cy="172" rx="50" ry="46" fill={animal === "panda" ? palette.dark : palette.fur} stroke={stroke} strokeWidth="3" />
        <ellipse cx="100" cy="180" rx="32" ry="30" fill={palette.belly} />
        {/* feet */}
        <ellipse cx="76" cy="214" rx="18" ry="11" fill={animal === "panda" ? palette.dark : palette.fur} stroke={stroke} strokeWidth="3" />
        <ellipse cx="124" cy="214" rx="18" ry="11" fill={animal === "panda" ? palette.dark : palette.fur} stroke={stroke} strokeWidth="3" />
        {/* arms: raised when cheering */}
        <motion.ellipse
          cx="54"
          cy="164"
          rx="13"
          ry="24"
          fill={animal === "panda" ? palette.dark : palette.fur}
          stroke={stroke}
          strokeWidth="3"
          style={{ originX: "60px", originY: "146px" }}
          animate={{ rotate: mood === "cheer" ? 140 : 20 }}
          transition={{ type: "spring", stiffness: 200, damping: 12 }}
        />
        <motion.ellipse
          cx="146"
          cy="164"
          rx="13"
          ry="24"
          fill={animal === "panda" ? palette.dark : palette.fur}
          stroke={stroke}
          strokeWidth="3"
          style={{ originX: "140px", originY: "146px" }}
          animate={{ rotate: mood === "cheer" ? -140 : mood === "thinking" ? -150 : -20 }}
          transition={{ type: "spring", stiffness: 200, damping: 12 }}
        />
        {/* head */}
        <Ears animal={animal} palette={palette} />
        <circle cx="100" cy="82" r="56" fill={palette.fur} stroke={stroke} strokeWidth="3" />
        {animal === "fox" && <path d="M48 92 Q70 126 100 112 Q130 126 152 92 Q130 108 100 100 Q70 108 48 92 Z" fill={palette.belly} />}
        <ellipse
          cx="100"
          cy="103"
          rx="22"
          ry="15"
          fill={animal === "fox" ? palette.belly : animal === "bear" ? palette.belly : "#ffffff"}
        />
        <circle cx="64" cy="100" r="8" fill="#ff8fa8" opacity="0.55" />
        <circle cx="136" cy="100" r="8" fill="#ff8fa8" opacity="0.55" />
        <Eyes mood={mood} animal={animal} palette={palette} />
        <Mouth mood={mood} animal={animal} />
        {mood === "sleepy" && (
          <text x="150" y="30" fontSize="26" fontWeight="800" fill="#7a5af5">
            z
          </text>
        )}
        <FrontItems equipped={worn} />
      </motion.g>
    </svg>
  );
}
