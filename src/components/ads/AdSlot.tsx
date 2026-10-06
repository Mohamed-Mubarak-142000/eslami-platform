"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { ADSENSE_CLIENT, ADSENSE_SLOT, adsEnabled } from "./config";

declare global {
  interface Window {
    adsbygoogle?: object[];
  }
}

function AdUnit() {
  const ref = useRef<HTMLModElement>(null);

  useEffect(() => {
    // A filled <ins> gets data-adsbygoogle-status; pushing again for it throws "already have ads".
    if (!ref.current || ref.current.dataset.adsbygoogleStatus) return;
    try {
      (window.adsbygoogle ||= []).push({});
    } catch {
      // Blocked by an ad blocker, or no fill — the reserved space just stays empty.
    }
  }, []);

  return (
    <ins
      ref={ref}
      className="adsbygoogle block min-h-[100px] w-full"
      data-ad-client={ADSENSE_CLIENT}
      data-ad-slot={ADSENSE_SLOT}
      data-ad-format="auto"
      data-full-width-responsive="true"
      {...(process.env.NODE_ENV !== "production" && { "data-adtest": "on" })}
    />
  );
}

/** One labelled, fixed-height ad box. Remounts on navigation so each page gets a fresh ad. */
export function AdSlot({ className }: { className?: string }) {
  const pathname = usePathname();
  if (!adsEnabled) return null;
  return (
    <aside aria-label="إعلان" className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6", className)}>
      <p className="mb-1 text-center text-xs text-muted">إعلان</p>
      <AdUnit key={pathname} />
    </aside>
  );
}
