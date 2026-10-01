import Link from "next/link";
import { cn } from "@/lib/cn";
import { BrandMark } from "./BrandMark";

export function Logo({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  return (
    <Link href="/" aria-label="المنارة — الرئيسية" className={cn("group inline-flex items-center gap-2.5", className)}>
      {tone === "dark" ? (
        <BrandMark priority className="h-11 transition-transform duration-500 group-hover:scale-105" />
      ) : (
        <span className="grid size-12 place-items-center rounded-2xl bg-ivory shadow-soft transition-transform duration-500 group-hover:scale-105">
          <BrandMark className="h-9" />
        </span>
      )}
      <span className="leading-none">
        <span className={cn("block font-display text-xl font-bold", tone === "dark" ? "text-emerald-deep" : "text-white")}>المنارة</span>
        <span className={cn("mt-1 block text-[0.7rem] font-semibold", tone === "dark" ? "text-gold-deep" : "text-gold-soft")}>
          قرآن · علم · ذكر
        </span>
      </span>
    </Link>
  );
}
