"use client";

import { usePathname } from "next/navigation";
import { AdSlot } from "./AdSlot";

/** Private, legal and focused pages (exams, recitation tests) stay ad-free. */
const AD_FREE = [
  "/admin",
  "/account",
  "/dashboard",
  "/certificates",
  "/privacy",
  "/terms",
  "/exams",
  "/tasmee",
  "/stories",
  "/unsubscribe",
];

export function FooterAd() {
  const pathname = usePathname();
  if (AD_FREE.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) return null;
  return <AdSlot className="mt-16" />;
}
