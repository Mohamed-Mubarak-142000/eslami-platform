import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { fontVariables } from "@/lib/fonts";
import { SplashScreen } from "@/components/site/SplashScreen";
import { SPLASH_BOOT_SCRIPT } from "@/components/site/splash";
import { Providers } from "./providers";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://al-manara.example";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "المنارة — قرآن وعلم وذكر", template: "%s — المنارة" },
  description:
    "اقرأ القرآن الكريم في مصحف مصفّح، استمع لأكثر من مئتي قارئ وإذاعة القرآن، تابع مواقيت الصلاة والتقويم الهجري، ورافق يومك بالأذكار — مع حديقة قرآنية ممتعة للأطفال.",
  applicationName: "المنارة",
  appleWebApp: { capable: true, title: "المنارة", statusBarStyle: "default" },
  keywords: ["القرآن الكريم", "مصحف", "تلاوات", "إذاعة القرآن", "مواقيت الصلاة", "التقويم الهجري", "أذكار", "تعليم القرآن للأطفال"],
  openGraph: { type: "website", locale: "ar_EG", siteName: "المنارة" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#003e32",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // suppressHydrationWarning: the splash boot script may set data-splash on <html> before hydration.
    <html lang="ar" dir="rtl" className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SPLASH_BOOT_SCRIPT }} />
      </head>
      <body className="bg-ivory text-ink antialiased">
        <SplashScreen />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
