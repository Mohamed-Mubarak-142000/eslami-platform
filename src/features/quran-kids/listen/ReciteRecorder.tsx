"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square, Trash2 } from "lucide-react";
import "../quran-kids.css";

type RecordingStatus = "idle" | "recording" | "recorded" | "unsupported" | "denied";

// Recordings live only in memory for this ayah (an object URL), never uploaded or
// saved to storage — this is a "listen to yourself next to the reciter" aid, not a record.
export function ReciteRecorder() {
  const [status, setStatus] = useState<RecordingStatus>("idle");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    };
  }, []);

  function setAudioUrlAndRef(url: string | null) {
    audioUrlRef.current = url;
    setAudioUrl(url);
  }

  async function startRecording() {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setStatus("unsupported");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (event) => { if (event.data.size > 0) chunksRef.current.push(event.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioUrlAndRef(URL.createObjectURL(blob));
        setStatus("recorded");
        stream.getTracks().forEach((track) => track.stop());
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setStatus("recording");
    } catch {
      setStatus("denied");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
  }

  function discardRecording() {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrlAndRef(null);
    setStatus("idle");
  }

  return (
    <div className="quran-recite-recorder">
      <p className="quran-recite-recorder__label">سجّل نفسك وأنت تردد الآية، واسمع نفسك جنب القارئ</p>

      {status === "unsupported" && <p className="quran-empty">المتصفح ده مش بيدعم تسجيل الصوت.</p>}
      {status === "denied" && <p className="quran-empty">محتاجين إذن الميكروفون عشان تسجّل. تقدر تسمح من إعدادات المتصفح وتجرّب تاني.</p>}

      {(status === "idle" || status === "denied") && (
        <button type="button" onClick={startRecording}><Mic size={16} aria-hidden /> سجّل صوتك</button>
      )}

      {status === "recording" && (
        <button type="button" onClick={stopRecording} className="quran-recite-recorder__stop">
          <Square size={16} aria-hidden /> إيقاف التسجيل
        </button>
      )}

      {status === "recorded" && audioUrl && (
        <div className="quran-recite-recorder__playback">
          <audio src={audioUrl} controls />
          <button type="button" onClick={discardRecording}><Trash2 size={16} aria-hidden /> امسح وسجّل تاني</button>
        </div>
      )}
    </div>
  );
}
