"use client";

import { useEffect, useRef } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useActiveLearner } from "@/features/account/AccountProvider";
import { applyLastRead, clearLastRead, readLastRead, subscribeLastRead } from "./lastReadStorage";

const PUSH_DELAY_MS = 1500;

/** Keeps the device's "continue reading" position in step with the signed-in learner's account. */
export function LastReadSync() {
  const learner = useActiveLearner();
  const learnerId = learner?.id ?? null;
  const previousLearnerId = useRef<string | null>(null);

  useEffect(() => {
    // Signed in → signed out: the device copy came from the account, so drop it.
    if (previousLearnerId.current && !learnerId) clearLastRead();
    previousLearnerId.current = learnerId;
  }, [learnerId]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !learnerId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let lastPushed = "";

    void supabase
      .from("reading_position")
      .select("surah, surah_name, page, updated_at")
      .eq("learner_id", learnerId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled || !data) return;
        const local = readLastRead();
        if (!local || data.updated_at > local.updatedAt) {
          lastPushed = data.updated_at;
          applyLastRead({ surahId: data.surah, surahName: data.surah_name, page: data.page, updatedAt: data.updated_at });
        }
      });

    const unsubscribe = subscribeLastRead(() => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const entry = readLastRead();
        if (!entry || entry.updatedAt === lastPushed) return;
        lastPushed = entry.updatedAt;
        void supabase
          .from("reading_position")
          .upsert(
            { learner_id: learnerId, surah: entry.surahId, surah_name: entry.surahName, page: entry.page, updated_at: entry.updatedAt },
            { onConflict: "learner_id" },
          );
      }, PUSH_DELAY_MS);
    });

    return () => {
      cancelled = true;
      clearTimeout(timer);
      unsubscribe();
    };
  }, [learnerId]);

  return null;
}
