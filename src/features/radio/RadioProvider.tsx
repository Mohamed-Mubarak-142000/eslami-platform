"use client";

import { createContext, useContext, useRef, useState, type ReactNode } from "react";

export interface QuranRadioStation {
  name: string;
  streamUrl: string;
  providerName: string;
  providerUrl: string;
}

export const RADIO_STATION: QuranRadioStation = {
  name: "إذاعة القرآن الكريم من القاهرة — مصر",
  streamUrl: process.env.NEXT_PUBLIC_QURAN_RADIO_URL ?? "https://stream.radiojar.com/8s5u5tpdtwzuv",
  providerName: "إذاعة القرآن الكريم المصرية — الموقع الرسمي",
  providerUrl: "https://misrquran.gov.eg/",
};

interface RadioContextValue {
  station: QuranRadioStation;
  playing: boolean;
  loading: boolean;
  error: string;
  volume: number;
  sectionVisible: boolean;
  togglePlayback: () => Promise<void>;
  updateVolume: (value: number) => void;
  setSectionVisible: (visible: boolean) => void;
}

const RadioContext = createContext<RadioContextValue | null>(null);

export function RadioProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [volume, setVolume] = useState(70);
  const [sectionVisible, setSectionVisible] = useState(false);

  async function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) return;
    setError("");
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    setLoading(true);
    try {
      await audio.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
      setError("تعذر تشغيل البث الآن. تحقق من اتصالك ثم حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  }

  function updateVolume(value: number) {
    setVolume(value);
    if (audioRef.current) audioRef.current.volume = value / 100;
  }

  return (
    <RadioContext.Provider value={{ station: RADIO_STATION, playing, loading, error, volume, sectionVisible, togglePlayback, updateVolume, setSectionVisible }}>
      {children}
      <audio
        ref={audioRef}
        src={RADIO_STATION.streamUrl}
        preload="none"
        onPause={() => setPlaying(false)}
        onError={() => { setPlaying(false); setLoading(false); setError("البث غير متاح مؤقتًا. حاول مرة أخرى لاحقًا."); }}
      />
    </RadioContext.Provider>
  );
}

export function useRadio(): RadioContextValue {
  const context = useContext(RadioContext);
  if (!context) throw new Error("useRadio must be used within a RadioProvider");
  return context;
}
