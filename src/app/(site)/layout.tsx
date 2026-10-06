import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { AdSenseScript } from "@/components/ads/AdSenseScript";
import { FooterAd } from "@/components/ads/FooterAd";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main">{children}</main>
      <FooterAd />
      <SiteFooter />
      <AdSenseScript />
    </>
  );
}
