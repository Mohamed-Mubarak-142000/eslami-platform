import type { Metadata } from "next";
import { LetterMemoryGame } from "@/features/kids/games/LetterMemoryGame";

export const metadata: Metadata = { title: "ذاكرة الحروف", alternates: { canonical: "/kids/games/letters" } };

export default function LettersGamePage() {
  return <LetterMemoryGame />;
}
