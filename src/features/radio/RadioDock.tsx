"use client";

import { Pause, Radio, Volume2, X } from "lucide-react";
import { useRadio } from "./RadioProvider";
import "@/features/landing/landing.css";

export function RadioDock() {
  const { station, playing, sectionVisible, volume, togglePlayback, updateVolume } = useRadio();

  if (!playing || sectionVisible) return null;

  return (
    <div className="radio-dock" role="region" aria-label="مشغل إذاعة القرآن الكريم المصغر">
      <div className="radio-dock__inner">
        <span className="radio-dock__live"><Radio aria-hidden /> مباشر</span>
        <div className="radio-dock__station"><strong>{station.name}</strong><small>إذاعة القرآن الكريم المصرية</small></div>
        <button type="button" className="radio-dock__control" onClick={togglePlayback} aria-label="إيقاف إذاعة القرآن مؤقتًا"><Pause fill="currentColor" /></button>
        <label className="radio-dock__volume">
          <Volume2 aria-hidden />
          <span className="sr-only">مستوى صوت الإذاعة</span>
          <input type="range" min="0" max="100" value={volume} onChange={(event) => updateVolume(Number(event.currentTarget.value))} />
        </label>
        <button type="button" className="radio-dock__close" onClick={togglePlayback} aria-label="إغلاق مشغل الإذاعة"><X aria-hidden /></button>
      </div>
    </div>
  );
}
