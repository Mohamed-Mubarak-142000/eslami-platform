"use client";

import { useState } from "react";
import { Clock, Compass, LocateFixed } from "lucide-react";
import { getPrayerTimes, type PrayerTimes } from "./prayerTimesApi";
import { computeQiblaBearing } from "./qibla";
import "../quran-extras.css";

type Status = "idle" | "loading" | "loaded" | "denied" | "error" | "unsupported";

const PRAYER_LABELS: { key: keyof Omit<PrayerTimes, "gregorianDate">; label: string }[] = [
  { key: "fajr", label: "الفجر" },
  { key: "sunrise", label: "الشروق" },
  { key: "dhuhr", label: "الظهر" },
  { key: "asr", label: "العصر" },
  { key: "maghrib", label: "المغرب" },
  { key: "isha", label: "العشاء" },
];

export function PrayerTimesWidget() {
  const [status, setStatus] = useState<Status>("idle");
  const [timings, setTimings] = useState<PrayerTimes | null>(null);
  const [qiblaBearing, setQiblaBearing] = useState<number | null>(null);

  function requestLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unsupported");
      return;
    }
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setQiblaBearing(computeQiblaBearing(latitude, longitude));
        const result = await getPrayerTimes(latitude, longitude);
        if (!result) {
          setStatus("error");
          return;
        }
        setTimings(result);
        setStatus("loaded");
      },
      () => setStatus("denied"),
      { timeout: 10_000 },
    );
  }

  return (
    <section className="quran-extras-card">
      <h2><Clock size={18} aria-hidden /> مواقيت الصلاة واتجاه القبلة</h2>
      <p className="quran-extras-card__hint">
        تُحسب المواقيت من موقعك الحالي عبر خدمة عامة، وقد تختلف بضع دقائق عن الحساب المعتمد محليًا. اتجاه القبلة تقريبي أيضًا.
      </p>

      {status === "idle" && (
        <button type="button" className="quran-extras-card__action" onClick={requestLocation}>
          <LocateFixed size={16} aria-hidden /> استخدم موقعي الحالي
        </button>
      )}

      {status === "loading" && <p className="quran-empty">جارِ تحديد موقعك وحساب المواقيت...</p>}
      {status === "unsupported" && <p className="quran-empty">المتصفح ده مش بيدعم تحديد الموقع.</p>}
      {status === "denied" && (
        <p className="quran-empty">
          محتاجين إذن الموقع عشان نحسب المواقيت والقبلة بدقة. تقدر تسمح من إعدادات المتصفح وتجرّب تاني.
        </p>
      )}
      {status === "error" && <p className="quran-empty">تعذّر تحميل المواقيت حاليًا. حاول لاحقًا.</p>}

      {status === "loaded" && qiblaBearing !== null && (
        <p className="quran-extras-qibla"><Compass size={16} aria-hidden /> اتجاه القبلة: {Math.round(qiblaBearing)}° من الشمال (باتجاه عقارب الساعة)</p>
      )}

      {status === "loaded" && timings && (
        <>
          <p className="quran-extras-card__hint">{timings.gregorianDate}</p>
          <ul className="quran-extras-prayer-grid">
            {PRAYER_LABELS.map(({ key, label }) => (
              <li key={key}>
                <span>{label}</span>
                <strong>{timings[key]}</strong>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
