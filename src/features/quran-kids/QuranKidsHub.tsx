"use client";

import Link from "next/link";
import { Award, Headphones, PenLine, Puzzle, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useSocialMotionPreset } from "@/lib/motion";
import { KidsProgressWidget } from "./progress/KidsProgressWidget";
import "./quran-kids.css";

const CARDS = [
  {
    href: "/quran/kids/audio",
    icon: Headphones,
    title: "استمع للمصحف المعلم",
    description: "تسجيلات تتكرر فيها كل آية مرتين، مثالية لبداية الحفظ.",
  },
  {
    href: "/quran/kids/listen",
    icon: PenLine,
    title: "استمع وردد",
    description: "استمع لكل آية بمفردها مع تظليلها، ثم رددها بصوتك.",
  },
  {
    href: "/quran/kids/match",
    icon: Puzzle,
    title: "لعبة التوصيل والتلوين",
    description: "طابق الحروف وألوان أحكام التجويد في لعبة ممتعة.",
  },
  {
    href: "/quran/kids/quiz",
    icon: Sparkles,
    title: "اختبار تفاعلي",
    description: "أسئلة اختيار من متعدد حول آيات وسور قصيرة.",
  },
  {
    href: "/quran/kids/progress",
    icon: Award,
    title: "رحلتي وشاراتي",
    description: "تابع الآيات التي حفظتها واجمع الشارات.",
  },
] as const;

export function QuranKidsHub() {
  const reveal = useSocialMotionPreset("reveal");

  return (
    <main id="quran-main" className="quran-page quran-kids-hub">
      <motion.section className="quran-intro" {...reveal} viewport={{ once: true, amount: 0.3 }}>
        <span className="landing-kicker"><Sparkles size={17} aria-hidden /> منطقة الأطفال</span>
        <h1>تعلّم القرآن الكريم بطريقة ممتعة</h1>
        <p>اختر نشاطًا لتبدأ رحلتك مع القرآن الكريم: استماع، ترديد، ألعاب، واختبارات تفاعلية.</p>
        <KidsProgressWidget />
      </motion.section>

      <div className="quran-kids-card-grid">
        {CARDS.map(({ href, icon: Icon, title, description }) => (
          <Link key={href} href={href} className="quran-kids-card">
            <span className="quran-kids-card__icon" aria-hidden><Icon /></span>
            <span className="quran-kids-card__title">{title}</span>
            <span className="quran-kids-card__description">{description}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
