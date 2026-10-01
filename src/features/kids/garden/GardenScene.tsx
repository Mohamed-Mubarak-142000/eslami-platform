"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { getRewardItem } from "../rewards/catalog";
import { GARDEN_DECOR_SLOTS, GARDEN_STAGES } from "./garden";

function Piece({ shown, delay, children, origin }: { shown: boolean; delay: number; children: ReactNode; origin: string }) {
  if (!shown)
    // A faint silhouette shows what is still to come.
    return <g style={{ filter: "grayscale(1)", opacity: 0.22 }}>{children}</g>;
  return (
    <motion.g
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay, type: "spring", stiffness: 180, damping: 14 }}
      style={{ transformOrigin: origin, transformBox: "view-box" }}
    >
      {children}
    </motion.g>
  );
}

const ARTWORK: Record<string, { origin: string; art: ReactNode }> = {
  sprout: {
    origin: "200px 222px",
    art: (
      <g>
        <path d="M200 222 Q198 206 200 196" stroke="#3f8f2f" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M200 204 Q186 194 182 200 Q190 210 200 204 Z" fill="#7bd389" stroke="#3f8f2f" strokeWidth="2" />
        <path d="M200 198 Q214 186 220 194 Q210 204 200 198 Z" fill="#7bd389" stroke="#3f8f2f" strokeWidth="2" />
      </g>
    ),
  },
  tree: {
    origin: "92px 214px",
    art: (
      <g>
        <rect x="84" y="160" width="16" height="56" rx="5" fill="#9a6a3f" stroke="#6b4423" strokeWidth="2" />
        <circle cx="92" cy="146" r="30" fill="#4fb35a" stroke="#2f7d39" strokeWidth="2" />
        <circle cx="70" cy="160" r="20" fill="#5cc267" stroke="#2f7d39" strokeWidth="2" />
        <circle cx="114" cy="160" r="20" fill="#5cc267" stroke="#2f7d39" strokeWidth="2" />
        <circle cx="82" cy="140" r="4" fill="#4b5d2a" />
        <circle cx="102" cy="152" r="4" fill="#4b5d2a" />
      </g>
    ),
  },
  flowers: {
    origin: "220px 236px",
    art: (
      <g>
        {[
          [160, 236, "#ff8fb1"],
          [182, 242, "#ffd66b"],
          [236, 240, "#9ad7ff"],
          [258, 234, "#ff8fb1"],
          [280, 242, "#c9a2ff"],
        ].map(([x, y, color]) => (
          <g key={`${x}`}>
            <path d={`M${x} ${y} L${x} ${(y as number) + 14}`} stroke="#3f8f2f" strokeWidth="3" />
            <circle cx={x as number} cy={y as number} r="7" fill={color as string} stroke="#ffffff" strokeWidth="2" />
            <circle cx={x as number} cy={y as number} r="2.5" fill="#f5a623" />
          </g>
        ))}
      </g>
    ),
  },
  fountain: {
    origin: "300px 216px",
    art: (
      <g>
        <ellipse cx="300" cy="214" rx="34" ry="9" fill="#9ad7ff" stroke="#3d8fc4" strokeWidth="2" />
        <rect x="294" y="186" width="12" height="28" rx="3" fill="#dfe7ef" stroke="#8a9bb0" strokeWidth="2" />
        <ellipse cx="300" cy="186" rx="18" ry="5" fill="#dfe7ef" stroke="#8a9bb0" strokeWidth="2" />
        <path d="M300 182 Q290 160 280 184 M300 182 Q310 160 320 184 M300 182 L300 162" stroke="#6cc3f5" strokeWidth="3" fill="none" />
      </g>
    ),
  },
  birds: {
    origin: "250px 60px",
    art: (
      <g stroke="#3a4a5c" strokeWidth="3" fill="none" strokeLinecap="round">
        <path d="M230 60 q8 -8 16 0 q8 -8 16 0" />
        <path d="M270 44 q6 -6 12 0 q6 -6 12 0" />
        <path d="M300 70 q5 -5 10 0 q5 -5 10 0" />
      </g>
    ),
  },
  library: {
    origin: "336px 176px",
    art: (
      <g stroke="#7a4e2a" strokeWidth="2" strokeLinejoin="round">
        <path d="M306 140 L336 118 L366 140 Z" fill="#e8774a" />
        <rect x="310" y="140" width="52" height="38" fill="#fff4d6" />
        <rect x="330" y="156" width="12" height="22" fill="#9a6a3f" />
        <rect x="314" y="146" width="12" height="8" fill="#9ad7ff" />
        <rect x="346" y="146" width="12" height="8" fill="#9ad7ff" />
      </g>
    ),
  },
  bridge: {
    origin: "200px 250px",
    art: (
      <g>
        <path d="M0 252 Q100 240 200 252 T400 250 L400 262 L0 262 Z" fill="#6cc3f5" opacity="0.8" />
        <path d="M170 252 Q200 228 230 252" stroke="#9a6a3f" strokeWidth="6" fill="none" strokeLinecap="round" />
        <path
          d="M176 244 L176 252 M188 236 L188 252 M200 233 L200 252 M212 236 L212 252 M224 244 L224 252"
          stroke="#9a6a3f"
          strokeWidth="3"
        />
      </g>
    ),
  },
  house: {
    origin: "40px 186px",
    art: (
      <g stroke="#7a4e2a" strokeWidth="2" strokeLinejoin="round">
        <path d="M14 152 L40 128 L66 152 Z" fill="#e84a67" />
        <rect x="18" y="152" width="44" height="34" fill="#fff6ec" />
        <rect x="34" y="166" width="12" height="20" fill="#9a6a3f" />
        <rect x="22" y="158" width="9" height="9" fill="#ffd66b" />
      </g>
    ),
  },
  mosque: {
    origin: "200px 186px",
    art: (
      <g stroke="#b07a00" strokeWidth="2" strokeLinejoin="round">
        <rect x="244" y="104" width="12" height="82" fill="#ffffff" />
        <path d="M244 104 L250 88 L256 104 Z" fill="#f5c542" />
        <rect x="160" y="146" width="80" height="40" fill="#ffffff" />
        <path d="M168 146 Q200 92 232 146 Z" fill="#f5c542" />
        <path d="M200 98 L200 88" />
        <path d="M196 88 Q200 82 204 88" fill="none" />
        <path d="M190 186 L190 166 Q200 156 210 166 L210 186 Z" fill="#12a15b" />
      </g>
    ),
  },
};

export function GardenScene({ doneStations, ownedItems }: { doneStations: number; ownedItems: string[] }) {
  const decor = ownedItems.filter((id) => getRewardItem(id)?.kind === "garden");
  return (
    <svg viewBox="0 0 400 262" className="w-full" role="img" aria-label="حديقتك">
      <defs>
        <linearGradient id="garden-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a9e1ff" />
          <stop offset="1" stopColor="#e8f8ff" />
        </linearGradient>
      </defs>
      <rect width="400" height="262" fill="url(#garden-sky)" />
      <circle cx="350" cy="40" r="22" fill="#ffd66b" />
      <ellipse cx="80" cy="44" rx="34" ry="12" fill="#ffffff" opacity="0.9" />
      <ellipse cx="150" cy="30" rx="24" ry="9" fill="#ffffff" opacity="0.8" />
      {decor.includes("rainbow") && (
        <g fill="none" strokeWidth="7" opacity="0.75">
          <path d="M110 180 A90 90 0 0 1 290 180" stroke="#e84a67" />
          <path d="M117 180 A83 83 0 0 1 283 180" stroke="#f5b92e" />
          <path d="M124 180 A76 76 0 0 1 276 180" stroke="#12a15b" />
          <path d="M131 180 A69 69 0 0 1 269 180" stroke="#1f9be0" />
        </g>
      )}
      <path d="M0 196 Q90 150 200 186 T400 176 L400 262 L0 262 Z" fill="#9ddc7a" />
      <path d="M0 222 Q120 196 240 220 T400 214 L400 262 L0 262 Z" fill="#7cc95c" />
      {GARDEN_STAGES.map((stage, index) => {
        const artwork = ARTWORK[stage.id];
        if (!artwork) return null;
        return (
          <Piece key={stage.id} shown={doneStations >= stage.stations} delay={0.15 + index * 0.08} origin={artwork.origin}>
            {artwork.art}
          </Piece>
        );
      })}
      {decor
        .filter((id) => id !== "rainbow")
        .map((id, index) => {
          const slot = GARDEN_DECOR_SLOTS[id];
          const item = getRewardItem(id);
          if (!slot || !item) return null;
          return (
            <motion.text
              key={id}
              x={slot.x}
              y={slot.y}
              fontSize={slot.size}
              textAnchor="middle"
              initial={{ opacity: 0, y: slot.y - 20 }}
              animate={{ opacity: 1, y: slot.y }}
              transition={{ delay: 0.6 + index * 0.1 }}
            >
              {item.emoji}
            </motion.text>
          );
        })}
    </svg>
  );
}
