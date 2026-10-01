import type { Metadata } from "next";
import { ChooseCompanion } from "@/features/kids/companion/ChooseCompanion";

export const metadata: Metadata = { title: "اختر رفيقك" };

export default function KidsWelcomePage() {
  return <ChooseCompanion />;
}
