"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Mic, Square, Trash2 } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { kidsButton } from "./ui/kidsStyles";

type RecordingStatus = "idle" | "recording" | "recorded" | "unsupported" | "denied";

// Recordings live only in memory (an object URL) and are never uploaded or saved —
// this is a "listen to yourself next to the reciter" aid, not a record.
export function ReciteRecorder({ variant = "kids" }: { variant?: "kids" | "site" }) {
  const site = variant === "site";
  const [status, setStatus] = useState<RecordingStatus>("idle");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(
    () => () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    },
    [],
  );

  function setUrl(url: string | null) {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = url;
    setAudioUrl(url);
  }

  async function start() {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setStatus("unsupported");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        setUrl(URL.createObjectURL(new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" })));
        setStatus("recorded");
        stream.getTracks().forEach((track) => track.stop());
      };
      recorderRef.current = recorder;
      recorder.start();
      setStatus("recording");
    } catch {
      setStatus("denied");
    }
  }

  function discard() {
    setUrl(null);
    setStatus("idle");
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {(status === "idle" || status === "denied" || status === "unsupported") && (
        <button type="button" onClick={start} className={site ? buttonClass("outline", "md") : kidsButton("white", "px-7")}>
          <Mic aria-hidden className="text-[#e84a67]" /> سجّل صوتك
        </button>
      )}
      {status === "recording" && (
        <button
          type="button"
          onClick={() => recorderRef.current?.stop()}
          className={site ? buttonClass("primary", "md", "bg-rose hover:bg-rose/90") : kidsButton("rose", "px-7")}
        >
          <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1, repeat: Infinity }} className="inline-flex">
            <Square aria-hidden className="fill-current" />
          </motion.span>
          أوقف التسجيل
        </button>
      )}
      {status === "recorded" && audioUrl && (
        <div className="flex w-full max-w-md flex-col items-center gap-2 rounded-3xl bg-[#fff6d8] p-3">
          <p className="text-sm font-extrabold text-[#8a5a00]">اسمع صوتك</p>
          <audio src={audioUrl} controls className="w-full" />
          <button type="button" onClick={discard} className="inline-flex items-center gap-1.5 text-sm font-bold text-muted hover:text-ink">
            <Trash2 className="size-4" aria-hidden /> امسح وسجّل مرة أخرى
          </button>
        </div>
      )}
      {status === "denied" && (
        <p className="text-center text-sm text-muted">
          {site ? "اسمح للمتصفح باستخدام الميكروفون لتسجيل صوتك." : "نحتاج إذن الميكروفون لنسجّل صوتك — اطلب من أحد والديك السماح به."}
        </p>
      )}
      {status === "unsupported" && <p className="text-center text-sm text-muted">هذا المتصفح لا يدعم تسجيل الصوت.</p>}
    </div>
  );
}
