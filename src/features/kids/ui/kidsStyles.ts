import { cn } from "@/lib/cn";

export type KidsTone = "emerald" | "sky" | "gold" | "rose" | "violet" | "white";

const TONES: Record<KidsTone, string> = {
  emerald: "bg-[#12a15b] text-white shadow-[0_6px_0_#0b7a44] hover:bg-[#15b064]",
  sky: "bg-[#1f9be0] text-white shadow-[0_6px_0_#157ab3] hover:bg-[#2aa8ee]",
  gold: "bg-[#f5b92e] text-[#5a3d00] shadow-[0_6px_0_#c98f10] hover:bg-[#ffc640]",
  rose: "bg-[#e84a67] text-white shadow-[0_6px_0_#b92f49] hover:bg-[#f25a76]",
  violet: "bg-[#7a5af5] text-white shadow-[0_6px_0_#5a3ed1] hover:bg-[#8a6cff]",
  white: "bg-white text-emerald-deep shadow-[0_6px_0_#d9dccf] ring-2 ring-[#e6eadf] hover:bg-[#fbfdf8]",
};

/** Chunky, tactile kids button (pressed-down look via the bottom shadow). */
export function kidsButton(tone: KidsTone = "emerald", className?: string): string {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 font-kids text-lg font-extrabold transition-[transform,box-shadow,background-color] duration-150 active:translate-y-1 active:shadow-none disabled:opacity-50 [&_svg]:size-5",
    TONES[tone],
    className,
  );
}

export const kidsPanel =
  "rounded-[2.5rem] bg-white/95 p-5 shadow-[0_24px_60px_-24px_rgb(0_62_50/45%)] ring-4 ring-white/60 backdrop-blur sm:p-8";
