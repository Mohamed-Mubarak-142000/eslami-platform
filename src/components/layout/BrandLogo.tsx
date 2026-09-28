import { cn } from "@/lib/cn";
import "./brand-logo.css";

export interface BrandLogoProps {
  className?: string;
  /** Kept for backward compatibility with legacy `next/image` preload callers; unused by the text wordmark. */
  priority?: boolean;
  showName?: boolean;
}

/**
 * The real Al-Manara logo asset hasn't been supplied yet, so this renders a text/monogram
 * fallback (never a fabricated logo image) until real brand art is provided.
 */
export function BrandLogo({ className, showName = true }: BrandLogoProps) {
  return (
    <span className={cn("brand-logo", className)}>
      <span className="brand-logo__mark" aria-hidden="true">
        م
      </span>
      {showName && <span className="brand-logo__name">المنارة</span>}
    </span>
  );
}
