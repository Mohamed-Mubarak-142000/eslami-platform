"use client";

import type { ReactNode } from "react";
import { BrandMark } from "@/components/site/BrandMark";
import { cn } from "@/lib/cn";
import { NAFAHAT_TITLE, formatNafhaDate, type Nafha } from "./shared";

/**
 * One post of the channel, as a message bubble from "نفحات المنارة". `footer` holds the reactions and the
 * share/download buttons; the admin composer's preview renders it without them.
 */
export function NafhaCard({
  nafha,
  footer,
  preview = false,
  className,
}: {
  nafha: Nafha;
  footer?: ReactNode;
  preview?: boolean;
  className?: string;
}) {
  return (
    <article id={preview ? undefined : `nafha-${nafha.id}`} className={cn("flex scroll-mt-28 items-end gap-2.5", className)}>
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white shadow-soft ring-2 ring-gold-soft">
        <BrandMark className="h-7" />
      </span>
      <div className="min-w-0 flex-1 overflow-hidden rounded-3xl rounded-es-md border border-line bg-white shadow-soft">
        {nafha.media_url && nafha.media_type === "image" && (
          // A user-uploaded image of any size, from the public bucket.
          <img src={nafha.media_url} alt="" loading="lazy" className="max-h-[28rem] w-full bg-ivory object-contain" />
        )}
        {nafha.media_url && nafha.media_type === "video" && (
          <video src={nafha.media_url} controls playsInline preload="metadata" className="max-h-[28rem] w-full bg-emerald-night" />
        )}
        <div className="px-4 pb-3 pt-3.5">
          <p className="text-xs font-bold text-gold-deep">{NAFAHAT_TITLE}</p>
          <h3 className="mt-1 font-display text-lg font-bold leading-snug text-emerald-deep" dir="auto">
            {nafha.title}
          </h3>
          {nafha.body && (
            <p className="mt-2 whitespace-pre-line text-[0.95rem] leading-8 text-ink" dir="auto">
              {nafha.body}
            </p>
          )}
          <time dateTime={nafha.created_at} className="mt-2 block text-end text-[0.7rem] text-muted">
            {formatNafhaDate(nafha.created_at)}
          </time>
        </div>
        {footer}
      </div>
    </article>
  );
}
