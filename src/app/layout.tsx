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
  return {
    metadataBase: new URL("https://basira.example"),
    title: { default: t.title, template: t.titleTemplate },
    description: t.description,
    robots: { index: true, follow: true },
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await resolveLocale();
  const t = dictionaries[locale].shell;
  const navigation = [
    { href: "/", label: t.navHome },
    { href: "/explore", label: t.navExplore },
    { href: "/search", label: t.navSearch },
    { href: "/ask/1", label: t.navAsk },
    { href: "/saved", label: t.navSaved },
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
