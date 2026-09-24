import type { ReactNode } from "react";
import { KidsProgressProvider } from "@/features";

export default function QuranKidsLayout({ children }: { children: ReactNode }) {
  return <KidsProgressProvider>{children}</KidsProgressProvider>;
}
