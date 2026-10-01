"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import type HlsType from "hls.js";
import { createRadioFailover, type RadioFailover } from "./radioFailover";
import { loadHls, loadedHls, playsHlsNatively } from "./hlsSource";

export const RADIO_STATION = {
  name: "إذاعة القرآن الكريم من القاهرة",
  /** Tried in order: the official stream first, then relays of the same station. */
  streams: [
    process.env.NEXT_PUBLIC_QURAN_RADIO_URL ?? "https://stream.radiojar.com/8s5u5tpdtwzuv",
    "https://radio.xecod.com/station/quran-cairo",
  ],
  providerName: "إذاعة القرآن الكريم المصرية",
  providerUrl: "https://misrquran.gov.eg/",
} as const;

export type TrackKind = "radio" | "surah" | "ayah" | "clip";

export interface AudioTrack {
  id: string;
  kind: TrackKind;
  title: string;
  subtitle: string;
  src: string;
  /** An HLS stream rather than a plain audio file. */
  hls?: boolean;
  href?: string;
}

interface PlayOptions {
  queue?: AudioTrack[];
  onEnded?: () => void;
}

export type RepeatMode = "off" | "one" | "all";

interface AudioContextValue {
  track: AudioTrack | null;
  queue: AudioTrack[];
  playing: boolean;
  loading: boolean;
  error: string;
  /** The radio is playing from a backup stream while the official one is down. */
  radioOnBackup: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  rate: number;
  repeat: RepeatMode;
  play: (track: AudioTrack, options?: PlayOptions) => void;
  playRadio: () => void;
  toggle: () => void;
  pause: () => void;
  stop: () => void;
  seek: (seconds: number) => void;
  next: () => void;
  previous: () => void;
  setVolume: (value: number) => void;
  setRate: (value: number) => void;
  setRepeat: (mode: RepeatMode) => void;
  isCurrent: (id: string) => boolean;
}

const AudioContext = createContext<AudioContextValue | null>(null);

const RADIO_TRACK: AudioTrack = {
  id: "radio",
  kind: "radio",
  title: RADIO_STATION.name,
  subtitle: "بث مباشر",
  src: RADIO_STATION.streams[0],
  href: "/radio",
};

export function AudioProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const endedCallbackRef = useRef<(() => void) | undefined>(undefined);
  const [track, setTrack] = useState<AudioTrack | null>(null);
  const [queue, setQueue] = useState<AudioTrack[]>([]);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(80);
  const [rate, setRateState] = useState(1);
  const [repeat, setRepeat] = useState<RepeatMode>("off");
  const [radioOnBackup, setRadioOnBackup] = useState(false);
  const radioRef = useRef<RadioFailover | null>(null);
  const hlsRef = useRef<HlsType | null>(null);
  // Bumped on every start so a slow hls.js load can't attach an abandoned track.
  const startAttemptRef = useRef(0);

  const detachHls = useCallback(() => {
    hlsRef.current?.destroy();
    hlsRef.current = null;
  }, []);

  const radio = useCallback((): RadioFailover | null => {
    const audio = audioRef.current;
    if (!audio) return null;
    radioRef.current ??= createRadioFailover(audio, RADIO_STATION.streams, {
      onSourceChange: (index) => {
        setRadioOnBackup(index > 0);
        setError("");
        setLoading(true);
      },
      onAllDown: () => {
        setLoading(true);
        setError("البث متوقف من المصدر الآن، وسنعيد المحاولة تلقائيًا.");
      },
      onBlocked: () => {
        setLoading(false);
        setPlaying(false);
        setError("اضغط تشغيل لبدء البث.");
      },
    });
    return radioRef.current;
  }, []);

  const start = useCallback(
    (next: AudioTrack) => {
      const audio = audioRef.current;
      if (!audio) return;
      radio()?.stop();
      detachHls();
      const attempt = ++startAttemptRef.current;
      setError("");
      setTrack(next);
      setCurrentTime(0);
      setDuration(0);
      if (next.kind === "radio") {
        audio.playbackRate = 1;
        radio()?.start();
        return;
      }
      setRadioOnBackup(false);
      setLoading(true);
      const failed = next.kind === "clip" ? "تعذّر تشغيل المقطع، تحقق من اتصالك." : "تعذّر تشغيل التلاوة، تحقق من اتصالك.";
      const begin = () => {
        audio.playbackRate = rate;
        audio
          .play()
          .then(() => setPlaying(true))
          .catch(() => {
            if (attempt !== startAttemptRef.current) return;
            setPlaying(false);
            setError(failed);
          })
          .finally(() => attempt === startAttemptRef.current && setLoading(false));
      };
      if (!next.hls) {
        audio.src = next.src;
        begin();
        return;
      }
      const attach = (Hls: typeof HlsType | null) => {
        if (attempt !== startAttemptRef.current) return;
        if (!Hls?.isSupported()) {
          if (!playsHlsNatively(audio)) {
            setLoading(false);
            setError(failed);
            return;
          }
          audio.src = next.src;
          begin();
          return;
        }
        const hls = new Hls();
        hlsRef.current = hls;
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (!data.fatal || hlsRef.current !== hls) return;
          detachHls();
          setPlaying(false);
          setLoading(false);
          setError(failed);
        });
        hls.loadSource(next.src);
        hls.attachMedia(audio);
        begin();
      };
      const ready = loadedHls();
      if (ready) {
        attach(ready);
        return;
      }
      loadHls().then(attach, () => attach(null));
    },
    [rate, radio, detachHls],
  );

  const play = useCallback(
    (next: AudioTrack, options?: PlayOptions) => {
      endedCallbackRef.current = options?.onEnded;
      setQueue(options?.queue ?? [next]);
      start(next);
    },
    [start],
  );

  const playRadio = useCallback(() => play(RADIO_TRACK), [play]);

  const pause = useCallback(() => {
    radio()?.stop();
    audioRef.current?.pause();
    setPlaying(false);
    setLoading(false);
  }, [radio]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !track) return;
    if (playing) {
      pause();
      return;
    }
    if (track.kind === "radio") {
      start(track);
      return;
    }
    setLoading(true);
    audio
      .play()
      .then(() => setPlaying(true))
      .catch(() => setError("تعذّر استكمال التشغيل."))
      .finally(() => setLoading(false));
  }, [pause, playing, start, track]);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    radio()?.stop();
    detachHls();
    startAttemptRef.current++;
    setRadioOnBackup(false);
    setLoading(false);
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    endedCallbackRef.current = undefined;
    setPlaying(false);
    setTrack(null);
    setQueue([]);
  }, [radio, detachHls]);

  const step = useCallback(
    (direction: 1 | -1) => {
      if (!track || queue.length < 2) return;
      const index = queue.findIndex((item) => item.id === track.id);
      const nextIndex = (index + direction + queue.length) % queue.length;
      const next = queue[nextIndex];
      if (next) start(next);
    },
    [queue, start, track],
  );

  function handleEnded() {
    setPlaying(false);
    if (endedCallbackRef.current) {
      endedCallbackRef.current();
      return;
    }
    if (!track) return;
    if (repeat === "one") {
      start(track);
      return;
    }
    const index = queue.findIndex((item) => item.id === track.id);
    const isLast = index === queue.length - 1;
    if (!isLast || repeat === "all") step(1);
  }

  const value = useMemo<AudioContextValue>(
    () => ({
      track,
      queue,
      playing,
      loading,
      error,
      radioOnBackup,
      currentTime,
      duration,
      volume,
      rate,
      repeat,
      play,
      playRadio,
      toggle,
      pause,
      stop,
      seek: (seconds) => {
        const audio = audioRef.current;
        if (audio && Number.isFinite(seconds)) audio.currentTime = seconds;
      },
      next: () => step(1),
      previous: () => step(-1),
      setVolume: (next) => {
        setVolumeState(next);
        if (audioRef.current) audioRef.current.volume = next / 100;
      },
      setRate: (next) => {
        setRateState(next);
        if (audioRef.current && track?.kind !== "radio") audioRef.current.playbackRate = next;
      },
      setRepeat,
      isCurrent: (id) => track?.id === id,
    }),
    [
      track,
      queue,
      playing,
      loading,
      error,
      radioOnBackup,
      currentTime,
      duration,
      volume,
      rate,
      repeat,
      play,
      playRadio,
      toggle,
      pause,
      stop,
      step,
    ],
  );

  return (
    <AudioContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        preload="none"
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onWaiting={() => {
          setLoading(true);
          if (track?.kind === "radio") radioRef.current?.onWaiting();
        }}
        onStalled={() => {
          if (track?.kind === "radio") radioRef.current?.onWaiting();
        }}
        onPlaying={() => {
          setLoading(false);
          setPlaying(true);
          if (track?.kind === "radio") radioRef.current?.onPlaying();
        }}
        onPause={() => {
          setPlaying(false);
          if (track?.kind === "radio") radioRef.current?.onPause();
        }}
        onEnded={handleEnded}
        onError={() => {
          if (!track) return;
          if (track.kind === "radio") {
            radioRef.current?.onError();
            return;
          }
          setPlaying(false);
          setLoading(false);
          setError("المصدر الصوتي غير متاح مؤقتًا.");
        }}
      />
    </AudioContext.Provider>
  );
}

export function useAudio(): AudioContextValue {
  const context = useContext(AudioContext);
  if (!context) throw new Error("useAudio must be used within AudioProvider");
  return context;
}
