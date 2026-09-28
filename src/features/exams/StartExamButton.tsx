"use client";

import { useState, useTransition } from "react";
import { Loader2, Play } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { FormAlert } from "@/features/auth/ui/AuthFields";
import { startExamAction } from "./actions";

export function StartExamButton({ juz, label = "ابدأ الاختبار" }: { juz: number; label?: string }) {
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  return (
    <div className="space-y-3">
      <FormAlert error={error} />
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const result = await startExamAction(juz);
            setError(result.error);
          })
        }
        className={buttonClass("gold", "lg")}
      >
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Play className="fill-current" aria-hidden />}{" "}
        {pending ? "نجهّز أسئلتك..." : label}
      </button>
    </div>
  );
}
