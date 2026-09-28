import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "gold" | "outline" | "ghost" | "light";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-emerald text-white shadow-soft hover:bg-emerald-deep",
  gold: "bg-gold text-emerald-night shadow-gold hover:bg-gold-soft",
  outline: "border border-line bg-white/80 text-ink hover:border-emerald/40 hover:bg-white",
  ghost: "text-ink hover:bg-emerald-mist",
  light: "border border-white/30 bg-white/10 text-white backdrop-blur hover:bg-white/20",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-sm gap-1.5",
  md: "h-11 px-5 text-[0.95rem] gap-2",
  lg: "h-13 px-7 text-base gap-2.5",
};

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string): string {
  return cn(
    "inline-flex items-center justify-center rounded-full font-bold whitespace-nowrap transition-[background-color,color,border-color,transform,box-shadow] duration-200 active:scale-[0.97] disabled:opacity-50 [&_svg]:size-[1.15em] [&_svg]:shrink-0",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}
