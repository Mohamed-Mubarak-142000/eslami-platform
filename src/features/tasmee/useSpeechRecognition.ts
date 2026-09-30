"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/** The Web Speech API is still prefixed and untyped in most browsers; this is the part we use. */
interface RecognitionResult {
  isFinal: boolean;
  0: { transcript: string };
}
interface RecognitionEvent {
  resultIndex: number;
  results: ArrayLike<RecognitionResult>;
}
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
type RecognitionConstructor = new () => Recognition;

function recognitionClass(): RecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export type SpeechError = "not-allowed" | "network" | "unsupported" | "other";

/** Whether this browser can recognize speech at all (false during server rendering). */
export function useSpeechSupported(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => recognitionClass() !== null,
    () => false,
  );
}

/**
 * Keeps Arabic speech recognition running until stopped: browsers end a session after a silence,
 * so it restarts itself. `onFinal` gets each finished phrase once; `onInterim` the live text.
 */
export function useSpeechRecognition({ onFinal, onInterim }: { onFinal: (text: string) => void; onInterim: (text: string) => void }) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<SpeechError | null>(null);
  const recognitionRef = useRef<Recognition | null>(null);
  const wantedRef = useRef(false);
  const handlers = useRef({ onFinal, onInterim });
  useEffect(() => {
    handlers.current = { onFinal, onInterim };
  });

  const stop = useCallback(() => {
    wantedRef.current = false;
    setListening(false);
    handlers.current.onInterim("");
    recognitionRef.current?.abort();
    recognitionRef.current = null;
  }, []);

  const start = useCallback(() => {
    const Klass = recognitionClass();
    if (!Klass) {
      setError("unsupported");
      return;
    }
    setError(null);
    wantedRef.current = true;
    setListening(true);
    // Android Chrome repeats earlier words in every result of a continuous session, so there each
    // phrase gets its own short session instead.
    const android = /android/i.test(navigator.userAgent);

    const open = () => {
      if (!wantedRef.current) return;
      const recognition = new Klass();
      recognition.lang = "ar-SA";
      recognition.continuous = !android;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      let handled = 0;
      recognition.onresult = (event) => {
        let interim = "";
        for (let index = handled; index < event.results.length; index++) {
          const result = event.results[index]!;
          if (result.isFinal) {
            handled = index + 1;
            const text = result[0].transcript.trim();
            if (text) handlers.current.onFinal(text);
          } else {
            interim += `${result[0].transcript} `;
          }
        }
        handlers.current.onInterim(interim.trim());
      };
      recognition.onerror = (event) => {
        if (event.error === "no-speech" || event.error === "aborted") return; // onend restarts
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          wantedRef.current = false;
          setError("not-allowed");
        } else if (event.error === "network") {
          wantedRef.current = false;
          setError("network");
        } else {
          setError("other");
        }
      };
      recognition.onend = () => {
        if (recognitionRef.current !== recognition) return;
        if (wantedRef.current) {
          setTimeout(open, 150);
        } else {
          recognitionRef.current = null;
          setListening(false);
          handlers.current.onInterim("");
        }
      };
      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch {
        setTimeout(open, 300);
      }
    };
    open();
  }, []);

  useEffect(() => () => stop(), [stop]);

  return { listening, error, start, stop };
}
