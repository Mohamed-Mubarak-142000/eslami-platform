"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useRef, useState } from "react";
import { Gift } from "lucide-react";
import { useKidsProgress } from "../progress/KidsProgressProvider";
import { unopenedChests } from "../progress/rewards";
import { Celebration } from "../ui/Celebration";
import { kidsButton } from "../ui/kidsStyles";

/** Announces a newly earned chest (a finished station or daily challenge) wherever it happens. */
export function ChestWatcher() {
  const { state, status } = useKidsProgress();
  const ids = unopenedChests(state).map((chest) => chest.id);
  const key = ids.join(",");
  const seen = useRef<Set<string> | null>(null);
  const [fresh, setFresh] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "ready") {
      seen.current = null;
      return;
    }
    const current = key ? key.split(",") : [];
    // The first ready snapshot is what the child already had; only later additions are news.
    if (seen.current === null) {
      seen.current = new Set(current);
      return;
    }
    const added = current.find((id) => !seen.current!.has(id));
    seen.current = new Set(current);
    if (!added) return;
    // Let the game's own celebration finish first.
    const timer = setTimeout(() => setFresh(added), 2600);
    return () => clearTimeout(timer);
  }, [key, status]);

  const daily = fresh?.startsWith("daily-");
  return (
    <Celebration
      open={fresh !== null}
      title={daily ? "أكملت تحدي اليوم! 🎉" : "أكملت المحطة! 🎉"}
      message="حصلت على صندوق مفاجآت، ماذا بداخله يا ترى؟"
    >
      <Link href={"/kids/rewards" as Route} onClick={() => setFresh(null)} className={kidsButton("rose")}>
        <Gift aria-hidden /> افتح الصندوق
      </Link>
      <button type="button" onClick={() => setFresh(null)} className={kidsButton("white")}>
        لاحقًا
      </button>
    </Celebration>
  );
}
