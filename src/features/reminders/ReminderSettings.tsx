"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { FormAlert } from "@/features/auth/ui/AuthFields";
import type { FormState } from "@/features/auth/actions";
import { setReminderTopicAction } from "./actions";
import { TOPIC_LABELS, type ReminderTopic } from "./topics";

export type ReminderPrefs = Record<ReminderTopic, boolean>;

const TOPICS = Object.keys(TOPIC_LABELS) as ReminderTopic[];

/** Account page: one switch per reminder topic. */
export function ReminderToggles({ prefs: initial }: { prefs: ReminderPrefs }) {
  const [prefs, setPrefs] = useState(initial);
  const [pendingTopic, setPendingTopic] = useState<ReminderTopic | null>(null);
  const [, start] = useTransition();
  const [result, setResult] = useState<FormState>();

  function toggle(topic: ReminderTopic, next: boolean) {
    setPrefs((current) => ({ ...current, [topic]: next }));
    setPendingTopic(topic);
    start(async () => {
      const outcome = await setReminderTopicAction(topic, next);
      if (outcome.error) setPrefs((current) => ({ ...current, [topic]: !next }));
      setResult(outcome);
      setPendingTopic(null);
    });
  }

  return (
    <div className="space-y-3">
      {TOPICS.map((topic) => (
        <label key={topic} className="flex cursor-pointer items-center gap-3 text-sm font-bold text-ink">
          <input
            type="checkbox"
            checked={prefs[topic]}
            disabled={pendingTopic !== null}
            onChange={(event) => toggle(topic, event.target.checked)}
            className="size-5 accent-emerald"
          />
          {TOPIC_LABELS[topic]}
          {pendingTopic === topic && <Loader2 className="size-4 animate-spin text-muted" aria-hidden />}
        </label>
      ))}
      <FormAlert error={result?.error} message={result?.message} />
    </div>
  );
}
