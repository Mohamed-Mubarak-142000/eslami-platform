import { cn } from "@/lib/cn";
import "./brand-logo.css";

export interface BrandLogoProps {
  className?: string;
  /** Kept for backward compatibility with legacy `next/image` preload callers; unused by the text wordmark. */
  priority?: boolean;
  showName?: boolean;
}

/**
 * business-facts.md: the real Twister logo file is missing, so this renders a text/monogram
 * fallback (never a fabricated logo image) until the restaurant owner supplies real brand art.
 */
export function BrandLogo({ className, showName = true }: BrandLogoProps) {
  return (
    <span className={cn("brand-logo", className)}>
      <span className="brand-logo__mark" aria-hidden="true">
        T
      </span>
      {showName && <span className="brand-logo__name">توستر</span>}
    </span>
  );
}
