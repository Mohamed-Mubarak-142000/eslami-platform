"use client";

import { useState } from "react";
import { Loader2, LocateFixed } from "lucide-react";
import { cn } from "@/lib/cn";
import { requestPreciseLocation, type GeolocateResult } from "./location";

const MESSAGES: Record<Exclude<GeolocateResult, "ok">, string> = {
  denied: "لم يُسمح بالوصول للموقع — نعرض أقرب مدينة لمنطقتك الزمنية.",
  unsupported: "المتصفح لا يدعم تحديد الموقع.",
  error: "تعذّر تحديد موقعك الآن، حاول مرة أخرى.",
};

export function LocationButton({ tone = "light", className }: { tone?: "light" | "dark"; className?: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function locate() {
    setBusy(true);
    setMessage("");
    const result = await requestPreciseLocation();
    setBusy(false);
    if (result !== "ok") setMessage(MESSAGES[result]);
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={locate}
        disabled={busy}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
          tone === "light" ? "bg-white/10 text-white hover:bg-white/20" : "bg-emerald-mist text-emerald hover:bg-emerald-soft",
        )}
      >
        {busy ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <LocateFixed className="size-3.5" aria-hidden />}
        حدّد موقعي بدقة
      </button>
      {message && (
        <p role="status" className={cn("mt-2 text-xs", tone === "light" ? "text-white/70" : "text-muted")}>
          {message}
        </p>
      )}
    </div>
  );
}
