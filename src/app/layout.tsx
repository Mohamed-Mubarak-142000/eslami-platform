import type { Metadata } from "next";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { dictionaries } from "@/i18n/dictionaries";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import { defaultLocale, dirFor, isLocale, localeCookieName } from "@/i18n/locales";
import { ThemeProvider } from "@/lib/theme/ThemeProvider";
import { ApplicationFrame, IntegrationProvider, services } from "@/integrations";
import "@/styles/application.css";
import "@/integrations/shell-composition.css";

async function resolveLocale() {
  const store = await cookies();
  const cookieLocale = store.get(localeCookieName)?.value;
  return isLocale(cookieLocale) ? cookieLocale : defaultLocale;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  const t = dictionaries[locale].meta;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://basira.example";
  return {
    metadataBase: new URL(siteUrl),
    applicationName: locale === "ar" ? "بصيرة" : "Basira",
    title: { default: t.title, template: t.titleTemplate },
    description: t.description,
    keywords: locale === "ar"
      ? ["بصيرة", "معرفة إسلامية", "علوم القرآن", "الحديث", "باحثون", "مصادر موثوقة"]
      : ["Basira", "Islamic knowledge", "Quran studies", "Hadith", "researchers", "trusted sources"],
    authors: [{ name: locale === "ar" ? "فريق بصيرة" : "Basira Team" }],
    creator: locale === "ar" ? "بصيرة" : "Basira",
    alternates: { canonical: "./" },
    openGraph: {
      type: "website",
      locale: locale === "ar" ? "ar_AR" : "en_US",
      url: "./",
      siteName: locale === "ar" ? "بصيرة" : "Basira",
      title: t.title,
      description: t.description,
      images: [{ url: "/opengraph-image.png", width: 1254, height: 1254, alt: locale === "ar" ? "شعار منصة بصيرة" : "Basira platform logo" }],
    },
    twitter: {
      card: "summary_large_image",
      title: t.title,
      description: t.description,
      images: ["/opengraph-image.png"],
    },
    robots: { index: true, follow: true },
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await resolveLocale();
  const t = dictionaries[locale].shell;
  const navigation = [
    { href: "/", label: t.navHome },
    { href: "/about", label: locale === "ar" ? "من نحن" : "About" },
    { href: "/contact", label: locale === "ar" ? "اتصل بنا" : "Contact" },
    { href: "/categories", label: locale === "ar" ? "جميع الأقسام" : "All categories" },
  ];

  return (
    <html lang={locale} dir={dirFor[locale]} suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <LocaleProvider initialLocale={locale}>
            <IntegrationProvider session={services.session}>
              <ApplicationFrame
                navigation={navigation}
                topics={services.data.topics}
                scholars={services.data.scholars}
                unreadNotifications={1}
              >
                {children}
              </ApplicationFrame>
            </IntegrationProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
