"use client";

import { cn } from "@/lib/cn";
import { WEEK_ORDER, WEEKDAY_NAMES } from "./schedule";

export function FieldError({ message }: { message?: string | undefined }) {
  return message ? <span className="mt-1 block text-sm text-rose">{message}</span> : null;
}

/** Weekday chips (Saturday first), submitted as repeated `name` inputs. */
export function DaysPicker({
  name,
  label,
  days,
  onChange,
  error,
}: {
  name: string;
  label: string;
  days: number[];
  onChange: (days: number[]) => void;
  error?: string | undefined;
}) {
  return (
    <fieldset>
      <legend className="mb-1.5 block text-sm font-bold">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {WEEK_ORDER.map((day) => {
          const on = days.includes(day);
          return (
            <label
              key={day}
              className={cn(
                "cursor-pointer rounded-full border px-3 py-1.5 text-sm font-bold transition-colors has-focus-visible:ring-2 has-focus-visible:ring-gold",
                on ? "border-emerald bg-emerald text-white" : "border-line bg-white text-muted hover:border-emerald/40",
              )}
            >
              <input
                type="checkbox"
                name={name}
                value={day}
                checked={on}
                onChange={(event) => onChange(event.target.checked ? [...days, day] : days.filter((value) => value !== day))}
                className="sr-only"
              />
              {WEEKDAY_NAMES[day]}
            </label>
          );
        })}
      </div>
      <FieldError message={error} />
    </fieldset>
  );
}
