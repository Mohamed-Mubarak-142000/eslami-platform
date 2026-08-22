import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout";
import { DiscoveryRail, IntegrationProvider, services, ShellActions, ShellSearch } from "@/integrations";
import "@/styles/application.css";
import "@/integrations/shell-composition.css";

export const metadata: Metadata = { metadataBase: new URL("https://basira.example"), title: { default: "بصيرة — معرفة إسلامية موثوقة", template: "%s | بصيرة" }, description: "منصة عربية للمعرفة الإسلامية الموثقة بالمصادر.", robots: { index: true, follow: true } };
const navigation = [{ href: "/", label: "الرئيسية" }, { href: "/explore", label: "استكشف" }, { href: "/search", label: "البحث" }, { href: "/ask/1", label: "اسأل" }, { href: "/saved", label: "المحفوظات" }];
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <IntegrationProvider session={services.session}>
          <AppShell
            navigation={navigation}
            search={<ShellSearch />}
            actions={<ShellActions />}
            contextualRail={<DiscoveryRail topics={services.data.topics} scholars={services.data.scholars} />}
            unreadNotifications={1}
          >
            {children}
          </AppShell>
        </IntegrationProvider>
      </body>
    </html>
  );
}
