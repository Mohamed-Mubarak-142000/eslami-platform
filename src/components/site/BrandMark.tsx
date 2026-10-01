import Image from "next/image";
import { cn } from "@/lib/cn";

/** The Al-Manara logo mark. Its greens disappear on dark surfaces, so give it a light tile there. */
export function BrandMark({ className, priority = false }: { className?: string; priority?: boolean }) {
  return (
    <Image
      src="/brand/logo.png"
      alt=""
      aria-hidden
      width={387}
      height={512}
      priority={priority}
      className={cn("h-auto w-auto object-contain", className)}
    />
  );
}
