import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { fontVariables } from "@/lib/fonts";
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
  icons: { apple: "/icons/apple-touch-icon.png" },
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
    <html lang="ar" dir="rtl" className={fontVariables}>
      <body className="bg-ivory text-ink antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
