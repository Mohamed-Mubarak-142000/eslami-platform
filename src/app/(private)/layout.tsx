import type { Metadata } from "next";
import type { ReactNode } from "react";
export const metadata: Metadata = { robots: { index: false, follow: false, noarchive: true, noimageindex: true } };
export const dynamic = "force-dynamic";
export const revalidate = 0;
export default function PrivateLayout({ children }: { children: ReactNode }) { return children; }
