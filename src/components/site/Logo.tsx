import Link from "next/link";
import { cn } from "@/lib/cn";
import { StarMark } from "@/components/ui/Ornament";

export function Logo({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  return (
    <Link href="/" aria-label="المنارة — الرئيسية" className={cn("group inline-flex items-center gap-2.5", className)}>
      <span className="relative grid size-10 place-items-center rounded-2xl bg-emerald text-gold shadow-soft transition-transform duration-500 group-hover:rotate-45">
        <StarMark className="size-6" />
      </span>
      <span className="leading-none">
        <span className={cn("block font-display text-xl font-bold", tone === "dark" ? "text-emerald-deep" : "text-white")}>المنارة</span>
        <span className={cn("mt-1 block text-[0.7rem] font-semibold", tone === "dark" ? "text-gold-deep" : "text-gold-soft")}>
          قرآن · علم · ذكر
        </span>
      </span>
    </Link>
  );
}
