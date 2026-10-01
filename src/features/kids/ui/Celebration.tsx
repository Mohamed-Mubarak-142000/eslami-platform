"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Star } from "lucide-react";
import { useKidsProgress } from "../progress/KidsProgressProvider";
import { Companion } from "../companion/Companion";

// Deterministic "random" spread so the burst never differs between renders.
const PARTICLES = Array.from({ length: 26 }, (_, i) => {
  const angle = (i / 26) * Math.PI * 2;
  const distance = 140 + ((i * 53) % 110);
  return {
    x: Math.round(Math.cos(angle) * distance),
    y: Math.round(Math.sin(angle) * distance),
    size: 14 + ((i * 7) % 16),
    color: ["#cda23e", "#e0526b", "#2f9bd6", "#005544", "#f5c542"][i % 5]!,
    delay: (i % 6) * 0.03,
  };
});

interface CelebrationProps {
  open: boolean;
  title: string;
  message?: string;
  stars?: number;
  children?: ReactNode;
}

export function Celebration({ open, title, message, stars, children }: CelebrationProps) {
  const { companion } = useKidsProgress().state;
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-emerald-night/45 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <div className="pointer-events-none absolute inset-0 grid place-items-center" aria-hidden>
            {PARTICLES.map((particle, index) => (
              <motion.span
                key={index}
                className="absolute"
                initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                animate={{ x: particle.x, y: particle.y, scale: 1, opacity: 0, rotate: 180 }}
                transition={{ duration: 1.4, delay: particle.delay, ease: "easeOut" }}
              >
                <Star style={{ width: particle.size, height: particle.size, color: particle.color, fill: particle.color }} />
              </motion.span>
            ))}
          </div>
          <motion.div
            initial={{ scale: 0.6, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            className="relative w-full max-w-sm rounded-[2.5rem] bg-white p-8 text-center font-kids shadow-lift"
          >
            {companion && (
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 260, damping: 14 }}
                className={`mx-auto size-32 ${stars !== undefined ? "-mt-28" : "-mt-24"}`}
              >
                <Companion animal={companion.animal} equipped={companion.equipped} mood="cheer" className="size-full drop-shadow-lg" />
              </motion.div>
            )}
            {stars !== undefined && (
              <div className={`mb-4 flex justify-center gap-1 ${companion ? "mt-1" : "-mt-16"}`} aria-label={`${stars} من ٣ نجوم`}>
                {[0, 1, 2].map((index) => (
                  <motion.span
                    key={index}
                    initial={{ scale: 0, rotate: -40 }}
                    animate={{ scale: index < stars ? 1 : 0.8, rotate: 0 }}
                    transition={{ delay: 0.25 + index * 0.18, type: "spring", stiffness: 300, damping: 14 }}
                  >
                    <Star
                      className={index < stars ? "size-14 fill-[#f5c542] text-[#e0a800] drop-shadow" : "size-12 fill-line text-line"}
                      aria-hidden
                    />
                  </motion.span>
                ))}
              </div>
            )}
            <h2 className="font-kids text-3xl font-extrabold text-emerald-deep">{title}</h2>
            {message && <p className="mt-2 text-lg text-muted">{message}</p>}
            {children && <div className="mt-6 flex flex-wrap justify-center gap-3">{children}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
