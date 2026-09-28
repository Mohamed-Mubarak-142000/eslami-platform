import { cn } from "@/lib/cn";

export function EqualizerBars({ active, className, bars = 4 }: { active: boolean; className?: string; bars?: number }) {
  return (
    <span className={cn("flex h-5 items-end gap-[3px]", className)} aria-hidden="true">
      {Array.from({ length: bars }, (_, index) => (
        <span
          key={index}
          className={cn("w-[3px] origin-bottom rounded-full bg-current", active ? "animate-eq" : "scale-y-[0.3]")}
          style={{ height: "100%", animationDelay: `${index * 0.14}s` }}
        />
      ))}
    </span>
  );
}
