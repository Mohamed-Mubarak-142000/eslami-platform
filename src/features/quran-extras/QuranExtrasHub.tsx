"use client";

import Link from "next/link";
import { Compass, HelpCircle, Moon, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useSocialMotionPreset } from "@/lib/motion";
import "./quran-extras.css";

const CARDS = [
  {
    href: "/quran/prayer-times",
    icon: Compass,
    title: "مواقيت الصلاة والقبلة",
    description: "مواعيد الصلوات الخمس واتجاه القبلة، محسوبة من موقعك الحالي.",
  },
  {
    href: "/quran/hijri",
    icon: Moon,
    title: "التاريخ الهجري ورمضان",
    description: "تابع التاريخ الهجري الحالي والعد التنازلي لرمضان.",
  },
  {
    href: "/quran/duas",
    icon: Sparkles,
    title: "أدعية مأثورة",
    description: "أدعية قصيرة لمناسبات يومك، مصنّفة مع عدّاد للتكرار.",
  },
  {
    href: "/quran/topics",
    icon: HelpCircle,
    title: "موضوعات وأسئلة شائعة",
    description: "مدخل تمهيدي لموضوعات معرفية وأسئلة متداولة.",
  },
] as const;

export function QuranExtrasHub() {
  const reveal = useSocialMotionPreset("reveal");

  return (
    <main id="quran-main" className="quran-page quran-extras-page">
      <motion.section className="quran-intro" {...reveal} viewport={{ once: true, amount: 0.3 }}>
        <span className="landing-kicker">المزيد</span>
        <h1>مواقيت، تقويم، وأدعية</h1>
        <p>إضافات خفيفة تكمّل تجربة القرآن الكريم في الموقع — اختر قسمًا لتبدأ.</p>
      </motion.section>

      <div className="quran-extras-hub-grid">
        {CARDS.map(({ href, icon: Icon, title, description }) => (
          <Link key={href} href={href} className="quran-extras-hub-card">
            <span className="quran-extras-hub-card__icon" aria-hidden>
              <Icon />
            </span>
            <span className="quran-extras-hub-card__title">{title}</span>
            <span className="quran-extras-hub-card__description">{description}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
