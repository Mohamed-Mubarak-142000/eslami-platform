"use client";

import type { ReactNode } from "react";
import { HandHeart } from "lucide-react";
import { buttonClass, type ButtonSize, type ButtonVariant } from "@/components/ui/button";
import { openSupportSheet } from "./support-store";

/** Opens the "ادعم المنارة" sheet from anywhere, server components included. */
export function SupportButton({
  variant = "gold",
  size = "sm",
  className,
  onOpen,
  children = "ادعم المنارة",
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  onOpen?: () => void;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        onOpen?.();
        openSupportSheet();
      }}
      className={buttonClass(variant, size, className)}
    >
      <HandHeart aria-hidden />
      {children}
    </button>
  );
}
