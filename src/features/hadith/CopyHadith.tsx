"use client";

import { useState, useSyncExternalStore } from "react";
import { Check, Copy, Share2 } from "lucide-react";

/** Share sheet on phones, clipboard elsewhere. */
export function CopyHadith({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const canShare = useSyncExternalStore(
    () => () => {},
    () => "share" in navigator,
    () => false,
  );

  async function share() {
    const body = `${text}\n${window.location.href}`;
    try {
      if (canShare) {
        await navigator.share({ text: body });
        return;
      }
      await navigator.clipboard.writeText(body);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Dismissed or blocked: nothing to do.
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className="ms-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold text-emerald hover:bg-white"
    >
      {copied ? (
        <Check className="size-4" aria-hidden />
      ) : canShare ? (
        <Share2 className="size-4" aria-hidden />
      ) : (
        <Copy className="size-4" aria-hidden />
      )}
      {copied ? "نُسخ" : canShare ? "مشاركة" : "نسخ"}
    </button>
  );
}
