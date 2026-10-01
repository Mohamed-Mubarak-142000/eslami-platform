"use client";

import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { ArrowLeft, BookmarkCheck, Pause, Play, Radio } from "lucide-react";
import { NAV_ITEMS } from "@/components/site/nav";
import { Reveal } from "@/components/ui/Reveal";
import { buttonClass } from "@/components/ui/button";
import { Divider } from "@/components/ui/Ornament";
import { useAudio } from "@/features/audio/AudioProvider";
import { EqualizerBars } from "@/features/audio/EqualizerBars";
import { AdhkarToastToggle } from "@/features/adhkar/AdhkarToaster";
import { useLastRead } from "@/features/quran/lastReadStorage";
import { toArabicDigits } from "@/lib/arabic";
import gardenChild from "@/assets/scenes/garden-child.png";

const SECTION_TONES = [
  "from-emerald to-emerald-deep text-white",
  "from-gold-mist to-white text-ink",
  "from-emerald-deep to-emerald-night text-white",
  "from-emerald-soft to-white text-ink",
  "from-white to-gold-mist text-ink",
  "from-emerald-night to-emerald text-white",
  "from-ivory-deep to-white text-ink",
];

function SectionTitle({ kicker, title, description }: { kicker: string; title: string; description?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-bold text-gold-deep">{kicker}</p>
      <h2 className="mt-2 text-3xl font-bold text-emerald-deep sm:text-4xl">{title}</h2>
      {description && <p className="mt-3 text-muted">{description}</p>}
      <Divider className="mx-auto mt-6 max-w-xs" />
    </div>
  );
}

function ContinueReading() {
  const lastRead = useLastRead();
  if (!lastRead) {
    return (
      <Link href="/quran" className={buttonClass("primary", "lg")}>
        ابدأ القراءة <ArrowLeft aria-hidden />
      </Link>
    );
  }
  return (
    <Link href={`/quran/${lastRead.surahId}?page=${lastRead.page}` as Route} className={buttonClass("primary", "lg")}>
      <BookmarkCheck aria-hidden /> أكمل سورة {lastRead.surahName} — صفحة {toArabicDigits(lastRead.page)}
    </Link>
  );
}

function RadioCard() {
  const audio = useAudio();
  const radioOn = audio.track?.kind === "radio" && audio.playing;
  return (
    <div className="relative isolate overflow-hidden rounded-[2rem] bg-emerald-night p-7 text-white shadow-lift">
      <div className="pattern-stars-light absolute inset-0 -z-10" aria-hidden />
      <div className="absolute -left-16 -top-16 -z-10 size-56 rounded-full bg-gold/20 blur-3xl" aria-hidden />
      <p className="inline-flex items-center gap-2 text-sm font-bold text-gold-soft">
        <span className="relative flex size-2.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-rose opacity-75" />
          <span className="relative inline-flex size-2.5 rounded-full bg-rose" />
        </span>
        بث مباشر
      </p>
      <h3 className="mt-3 text-2xl font-bold">إذاعة القرآن الكريم</h3>
      <p className="mt-2 text-sm leading-7 text-white/70">تلاوات متواصلة طوال اليوم من القاهرة، تستمر معك وأنت تتصفح.</p>
      <div className="mt-6 flex items-center gap-4">
        <button type="button" onClick={radioOn ? audio.pause : audio.playRadio} className={buttonClass("gold", "lg")}>
          {radioOn ? <Pause aria-hidden className="fill-current" /> : <Play aria-hidden className="fill-current" />}
          {radioOn ? "إيقاف" : "استمع الآن"}
        </button>
        <EqualizerBars active={radioOn} bars={6} className="h-8 text-gold" />
        <Link href="/radio" className="ms-auto text-sm font-bold text-gold-soft hover:text-white">
          <Radio className="me-1 inline size-4" aria-hidden />
          صفحة الإذاعة
        </Link>
      </div>
    </div>
  );
}

export function HomeSections() {
  const sections = NAV_ITEMS.slice(1).filter((item) => !item.homeHidden);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <section className="py-20" aria-labelledby="sections-title">
        <SectionTitle
          kicker="أقسام المنارة"
          title="كل ما تحتاجه في مكانه"
          description="كل قسم في صفحته الخاصة، مصمَّم ليكون هادئًا وواضحًا وسهل الاستخدام."
        />
        <Reveal stagger="[data-card]" className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {sections.map((item, index) => {
            const Icon = item.icon;
            const dark = SECTION_TONES[index % SECTION_TONES.length]?.includes("text-white");
            return (
              <Link
                key={item.href}
                href={item.href}
                data-card
                className={`group relative isolate overflow-hidden rounded-[1.75rem] bg-linear-to-br p-6 shadow-soft ring-1 ring-black/5 transition-[transform,box-shadow] duration-300 hover:-translate-y-1.5 hover:shadow-lift ${SECTION_TONES[index % SECTION_TONES.length] ?? ""} ${index === 0 ? "lg:col-span-2 lg:row-span-2 lg:p-9" : ""}`}
              >
                <div className={`absolute inset-0 -z-10 opacity-60 ${dark ? "pattern-stars-light" : "pattern-stars"}`} aria-hidden />
                <span
                  className={`grid size-12 place-items-center rounded-2xl transition-transform duration-500 group-hover:rotate-[20deg] ${dark ? "bg-white/15 text-gold-soft" : "bg-emerald text-white"}`}
                >
                  <Icon className="size-6" aria-hidden />
                </span>
                <h3 className={`mt-5 font-bold ${index === 0 ? "text-3xl" : "text-xl"}`}>{item.label}</h3>
                <p className={`mt-2 text-sm leading-7 ${dark ? "text-white/75" : "text-muted"}`}>{item.description}</p>
                <span className={`mt-5 inline-flex items-center gap-1 text-sm font-bold ${dark ? "text-gold-soft" : "text-emerald"}`}>
                  ادخل <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" aria-hidden />
                </span>
              </Link>
            );
          })}
        </Reveal>
      </section>

      <Reveal
        as="section"
        className="grid items-center gap-10 rounded-[2.5rem] bg-white p-6 shadow-soft ring-1 ring-line md:grid-cols-2 md:p-10"
      >
        <div className="relative aspect-[16/10] overflow-hidden rounded-[2rem]">
          <Image
            src={gardenChild}
            alt="طفل يقرأ المصحف تحت شجرة في حديقة خضراء"
            fill
            sizes="(min-width: 768px) 45vw, 100vw"
            quality={80}
            placeholder="blur"
            className="object-cover object-left"
          />
        </div>
        <div>
          <p className="text-sm font-bold text-gold-deep">للأطفال</p>
          <h2 className="mt-2 text-3xl font-bold text-emerald-deep sm:text-4xl">حديقة القرآن</h2>
          <p className="mt-4 leading-8 text-muted">
            يتعلّم طفلك السور القصيرة آيةً آية مع الشيخ، ويسجّل صوته ليسمع نفسه، ويلعب ألعابًا تفاعلية في الحروف والتجويد وترتيب الآيات،
            ويجمع النجوم والشارات.
          </p>
          <Link href="/kids" className={buttonClass("primary", "lg", "mt-7")}>
            ادخل الحديقة <ArrowLeft aria-hidden />
          </Link>
        </div>
      </Reveal>

      <section className="grid gap-6 py-20 lg:grid-cols-2">
        <Reveal className="relative isolate overflow-hidden rounded-[2rem] bg-gold-mist p-7 shadow-soft ring-1 ring-gold/20">
          <div className="pattern-stars absolute inset-0 -z-10" aria-hidden />
          <p className="text-sm font-bold text-gold-deep">المصحف</p>
          <h3 className="mt-3 text-2xl font-bold text-emerald-deep">اقرأ صفحةً صفحة كما في المصحف</h3>
          <p className="mt-2 text-sm leading-7 text-muted">
            المصحف مقسّم على صفحات مصحف المدينة، مع التفسير الميسّر وألوان أحكام التجويد، ونحفظ لك مكان توقفك.
          </p>
          <div className="mt-6">
            <ContinueReading />
          </div>
        </Reveal>
        <Reveal>
          <RadioCard />
        </Reveal>
      </section>

      <Reveal as="section" className="rounded-[2rem] border border-dashed border-gold/50 bg-white p-7 text-center">
        <h2 className="text-2xl font-bold text-emerald-deep">ذكرٌ يرافقك</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-muted">
          كل نصف دقيقة يظهر لك ذكر أو دعاء قصير بمصدره، في زاوية الشاشة دون أن يقاطعك. يمكنك إيقافه متى شئت.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <AdhkarToastToggle />
          <Link href="/adhkar" className={buttonClass("outline", "md")}>
            أذكار الصباح والمساء <ArrowLeft aria-hidden />
          </Link>
        </div>
      </Reveal>
    </div>
  );
}
