import Image from "next/image";
import { cn } from "@/lib/cn";
import siteLogo from "./assets/site-logo.png";

export function BrandLogo({ className, priority = false, showName = true }: { className?: string; priority?: boolean; showName?: boolean }) {
  return (
    <span className={cn("brand-logo", className)}>
      <span className="brand-logo__image"><Image src={siteLogo} alt="" priority={priority} sizes="(max-width: 640px) 40px, 48px" /></span>
      {showName && <span className="brand-logo__name">بصيرة</span>}
    </span>
  );
}
