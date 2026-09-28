import type { Metadata } from "next";
import type { ReactNode } from "react";
import { KidsShell } from "@/features/kids/ui/KidsShell";

export const metadata: Metadata = {
  title: { default: "حديقة القرآن للأطفال", template: "%s — حديقة القرآن" },
  description: "مساحة ممتعة يتعلّم فيها الأطفال السور القصيرة آيةً آية، ويلعبون ألعابًا تفاعلية في الحروف والتجويد.",
};

export default function KidsLayout({ children }: { children: ReactNode }) {
  return <KidsShell>{children}</KidsShell>;
}
