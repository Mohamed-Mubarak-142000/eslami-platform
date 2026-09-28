import type { Metadata } from "next";
import { RadioStage } from "@/features/radio/RadioStage";

export const metadata: Metadata = {
  title: "إذاعة القرآن الكريم",
  description: "استمع لإذاعة القرآن الكريم من القاهرة بثًا مباشرًا على مدار الساعة.",
  alternates: { canonical: "/radio" },
};

export default function RadioPage() {
  return <RadioStage />;
}
