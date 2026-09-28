"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { kidsButton } from "../ui/kidsStyles";
import { sfx } from "../sfx";
import { markStoryWatchedAction } from "./actions";

const ORIGIN = "https://www.youtube-nocookie.com";
const ENDED = 0;

/**
 * Privacy-enhanced YouTube embed. Listens to the player's postMessage events (enablejsapi) so a
 * story counts as watched when the video ends; a button covers players that don't report it.
 */
export function StoryPlayer({
  storyId,
  youtubeId,
  title,
  watched,
}: {
  storyId: string;
  youtubeId: string;
  title: string;
  watched: boolean;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [done, setDone] = useState(watched);
  const [pending, startSaving] = useTransition();
  const doneRef = useRef(watched);

  function markWatched() {
    if (doneRef.current) return;
    doneRef.current = true;
    setDone(true);
    sfx.correct();
    startSaving(async () => {
      const { ok } = await markStoryWatchedAction(storyId);
      if (!ok) {
        doneRef.current = false;
        setDone(false);
      }
    });
  }
  const markRef = useRef(markWatched);
  useEffect(() => {
    markRef.current = markWatched;
  });

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== ORIGIN || event.source !== frame.current?.contentWindow || typeof event.data !== "string") return;
      try {
        const data = JSON.parse(event.data) as { event?: string; info?: number | { playerState?: number } };
        const state = typeof data.info === "number" ? data.info : data.info?.playerState;
        if ((data.event === "onStateChange" || data.event === "infoDelivery") && state === ENDED) markRef.current();
      } catch {
        // Not a player message.
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const params = new URLSearchParams({ enablejsapi: "1", rel: "0", modestbranding: "1", playsinline: "1", hl: "ar" });

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[2rem] bg-black shadow-lift ring-4 ring-white/70">
        <iframe
          ref={frame}
          src={`${ORIGIN}/embed/${youtubeId}?${params.toString()}`}
          title={title}
          className="aspect-video w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          onLoad={() =>
            // Ask the player to start sending state events to this window.
            frame.current?.contentWindow?.postMessage(JSON.stringify({ event: "listening", id: storyId, channel: "widget" }), ORIGIN)
          }
        />
      </div>
      <div className="text-center">
        {done ? (
          <p className="inline-flex items-center gap-2 rounded-full bg-[#e6f7ee] px-5 py-2.5 text-lg font-extrabold text-[#0b7a44]">
            <CheckCircle2 className="size-6" aria-hidden /> أحسنت! شاهدت هذه القصة
          </p>
        ) : (
          <button type="button" disabled={pending} onClick={markWatched} className={kidsButton("emerald")}>
            <CheckCircle2 aria-hidden /> أنهيت القصة
          </button>
        )}
      </div>
    </div>
  );
}
