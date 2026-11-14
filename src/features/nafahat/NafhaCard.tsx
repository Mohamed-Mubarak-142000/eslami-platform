"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { NAFAHAT_TITLE, formatNafhaTime, type Nafha } from "./shared";

/** The bubble's tail at its top start corner (the right, in this RTL-only site). */
function Tail() {
  return (
    <svg viewBox="0 0 8 13" width="8" height="13" aria-hidden className="absolute -start-2 top-0 text-white">
      <path d="M0 0h8v13C6.5 8 3.5 3.5 0 1.2z" fill="currentColor" transform="scale(-1 1) translate(-8 0)" />
    </svg>
  );
}

/**
 * One post as an incoming chat message, WhatsApp-style: a white bubble with a tail, the media edge to edge
 * inside a thin frame, the text, and the time tucked at the bottom end. `children` sit under the bubble
 * (the reactions pill).
 */
export function NafhaCard({
  nafha,
  highlighted = false,
  showTail = true,
  className,
  children,
}: {
  nafha: Nafha;
  highlighted?: boolean;
  showTail?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cn("relative w-fit max-w-full", className)}>
      <div
        className={cn(
          "relative rounded-2xl bg-white p-1 shadow-[0_1px_0.5px_rgba(1,42,34,0.13)] transition-[box-shadow] duration-700",
          showTail && "rounded-ss-none",
          highlighted && "shadow-[0_0_0_3px_var(--color-gold-soft)]",
        )}
      >
        {showTail && <Tail />}
        {nafha.media_url && nafha.media_type === "image" && (
          // A user-uploaded image of any size, from the public bucket.
          <img
            src={nafha.media_url}
            alt=""
            loading="lazy"
            className="block max-h-[26rem] w-full min-w-56 rounded-xl bg-ivory object-cover sm:min-w-72"
          />
        )}
        {nafha.media_url && nafha.media_type === "video" && (
          <video
            // "#t=0.001" makes iOS Safari paint the first frame instead of a black box until played.
            src={`${nafha.media_url}#t=0.001`}
            controls
            playsInline
            preload="metadata"
            className="block max-h-[26rem] w-full min-w-56 rounded-xl bg-emerald-night sm:min-w-80"
          />
        )}
        <div className="px-2 pb-0.5 pt-1.5">
          <p className="text-[0.8rem] font-bold text-gold-deep">{NAFAHAT_TITLE}</p>
          <h3 className="mt-0.5 font-bold leading-7 text-emerald-deep" dir="auto">
            {nafha.title}
          </h3>
          {nafha.body && (
            <p className="mt-1 whitespace-pre-line text-[0.95rem] leading-7 text-ink" dir="auto">
              {nafha.body}
            </p>
          )}
          <time dateTime={nafha.created_at} className="-mb-0.5 mt-1 block text-end text-[0.68rem] tabular-nums text-muted">
            {formatNafhaTime(nafha.created_at)}
          </time>
        </div>
      </div>
      {children}
    </div>
  );
}
