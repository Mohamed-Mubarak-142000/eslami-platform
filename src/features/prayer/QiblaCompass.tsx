"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Compass, Navigation } from "lucide-react";
import { toArabicDigits } from "@/lib/arabic";
import { computeQiblaBearing } from "./qibla";

type OrientationEventCtor = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<"granted" | "denied"> };
type CompassEvent = DeviceOrientationEvent & { webkitCompassHeading?: number };

const TICKS = Array.from({ length: 72 }, (_, i) => i * 5);
const CARDINALS = [
  { deg: 0, label: "ش" },
  { deg: 90, label: "ق" },
  { deg: 180, label: "ج" },
  { deg: 270, label: "غ" },
];

export function QiblaCompass({ latitude, longitude }: { latitude: number | null; longitude: number | null }) {
  const [heading, setHeading] = useState<number | null>(null);
  const [status, setStatus] = useState<"off" | "on" | "unsupported" | "denied">("off");
  const bearing = latitude !== null && longitude !== null ? computeQiblaBearing(latitude, longitude) : null;

  useEffect(() => {
    if (status !== "on") return;
    const onOrientation = (event: Event) => {
      const e = event as CompassEvent;
      if (typeof e.webkitCompassHeading === "number") setHeading(e.webkitCompassHeading);
      else if (e.absolute && typeof e.alpha === "number") setHeading(360 - e.alpha);
    };
    window.addEventListener("deviceorientationabsolute", onOrientation);
    window.addEventListener("deviceorientation", onOrientation);
    return () => {
      window.removeEventListener("deviceorientationabsolute", onOrientation);
      window.removeEventListener("deviceorientation", onOrientation);
    };
  }, [status]);

  async function enable() {
    if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) {
      setStatus("unsupported");
      return;
    }
    const Ctor = window.DeviceOrientationEvent as OrientationEventCtor;
    if (typeof Ctor.requestPermission === "function") {
      try {
        const result = await Ctor.requestPermission();
        setStatus(result === "granted" ? "on" : "denied");
      } catch {
        setStatus("denied");
      }
      return;
    }
    setStatus("on");
  }

  // Rotate the dial against the device heading so north stays true north.
  const dialRotation = heading !== null ? -heading : 0;

  return (
    <section className="rounded-[2rem] bg-white p-6 shadow-soft ring-1 ring-line sm:p-8" aria-label="اتجاه القبلة">
      <h2 className="inline-flex items-center gap-2 text-2xl font-bold text-emerald-deep">
        <Compass className="size-6 text-gold" aria-hidden /> اتجاه القبلة
      </h2>
      <p className="mt-1 text-sm text-muted">
        {bearing !== null ? `${toArabicDigits(Math.round(bearing))}° من الشمال باتجاه عقارب الساعة` : "يُحسب بعد تحديد موقعك"}
      </p>

      <div className="relative mx-auto mt-6 aspect-square w-full max-w-xs">
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: dialRotation }}
          transition={{ type: "spring", stiffness: 60, damping: 16 }}
        >
          <svg viewBox="0 0 200 200" className="size-full" aria-hidden>
            <circle cx="100" cy="100" r="96" fill="var(--color-emerald-mist)" stroke="var(--color-gold)" strokeWidth="2" />
            <circle cx="100" cy="100" r="78" fill="white" stroke="var(--color-line)" />
            {TICKS.map((deg) => (
              <line
                key={deg}
                x1="100"
                y1="6"
                x2="100"
                y2={deg % 45 === 0 ? 18 : 12}
                stroke={deg % 90 === 0 ? "var(--color-emerald)" : "var(--color-gold)"}
                strokeWidth={deg % 45 === 0 ? 2 : 1}
                transform={`rotate(${deg} 100 100)`}
              />
            ))}
            {CARDINALS.map((cardinal) => (
              <text
                key={cardinal.deg}
                x="100"
                y="36"
                textAnchor="middle"
                fontSize="13"
                fontWeight="700"
                fill="var(--color-emerald-deep)"
                transform={`rotate(${cardinal.deg} 100 100)`}
              >
                {cardinal.label}
              </text>
            ))}
            {bearing !== null && (
              <g transform={`rotate(${bearing.toFixed(1)} 100 100)`}>
                <path d="M100 30 L108 100 L100 92 L92 100 Z" fill="var(--color-gold)" />
                <rect x="92" y="22" width="16" height="12" rx="2" fill="var(--color-emerald-night)" />
                <rect x="92" y="25" width="16" height="2.5" fill="var(--color-gold)" />
              </g>
            )}
            <circle cx="100" cy="100" r="6" fill="var(--color-emerald)" />
          </svg>
        </motion.div>
      </div>

      <div className="mt-6 text-center">
        {status === "off" && (
          <button
            type="button"
            onClick={enable}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-line px-5 text-sm font-bold hover:border-emerald/40"
          >
            <Navigation className="size-4" aria-hidden /> فعّل البوصلة (على الجوال)
          </button>
        )}
        {status === "on" && (
          <p className="text-sm text-muted">
            {heading === null ? "حرّك جهازك قليلًا لمعايرة البوصلة…" : "وجّه أعلى الجوال نحو رمز الكعبة."}
          </p>
        )}
        {status === "unsupported" && <p className="text-sm text-muted">جهازك لا يدعم البوصلة — استخدم الزاوية المكتوبة أعلاه.</p>}
        {status === "denied" && <p className="text-sm text-muted">لم يُسمح باستخدام مستشعر الاتجاه.</p>}
      </div>
    </section>
  );
}
