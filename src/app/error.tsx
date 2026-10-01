"use client";

import { buttonClass } from "@/components/ui/button";
import { BrandMark } from "@/components/site/BrandMark";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="pattern-stars grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <BrandMark priority className="mx-auto h-24" />
        <h1 className="mt-6 text-3xl font-bold text-emerald-deep">حدث خطأ غير متوقع</h1>
        <p className="mt-3 text-muted">نعتذر عن ذلك، جرّب مرة أخرى.</p>
        <button type="button" onClick={reset} className={buttonClass("primary", "lg", "mt-8")}>
          إعادة المحاولة
        </button>
      </div>
    </main>
  );
}
