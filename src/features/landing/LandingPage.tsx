"use client";

import Link from "next/link";
import Image from "next/image";
import mosquePhoto from "./assets/hero-mosque.jpg";
import quranPhoto from "./assets/hero-quran.jpg";
import readingPhoto from "./assets/hero-reading.jpg";
import radioPhoto from "./assets/hero-radio.jpg";
import type { Route } from "next";
import {
  ArrowLeft, BookOpenCheck, ChevronLeft, ChevronRight, CircleUserRound, Headphones,
  HeartHandshake, LibraryBig, Pause,
  Play, Radio, SearchCheck, ShieldCheck, Sparkles, UsersRound, Volume2,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { BrandLogo, SiteHeader } from "@/components/layout";
import { useSocialMotionPreset } from "@/lib/motion";
import { useRadio } from "@/features/radio";
import "./landing.css";

const MotionLink = motion.create(Link);

const categories = [
  { title: "علوم القرآن", text: "تفسير وتدبر وعلوم المصحف من مصادر واضحة.", icon: BookOpenCheck },
  { title: "الحديث الشريف", text: "قراءة واعية للسنة وشروحها وتخريجها.", icon: LibraryBig },
  { title: "الفقه والعبادات", text: "مداخل علمية مرتبة للمسائل التي تهمك.", icon: ShieldCheck },
  { title: "الأسرة والمجتمع", text: "معرفة تعين على بناء حياة أكثر اتزانًا.", icon: HeartHandshake },
];

const trustPoints = [
  { title: "المصدر أمامك", text: "كل مادة مرتبطة بمرجع واضح يمكن الرجوع إليه.", icon: SearchCheck },
  { title: "هوية موثوقة", text: "تعرف صاحب المحتوى وتخصصه وحالة توثيقه.", icon: CircleUserRound },
  { title: "مجتمع يحترم المعرفة", text: "نقاش هادئ يحفظ الاختلاف ويقرب الفهم.", icon: UsersRound },
];

function HeroCta({ href, className, children }: { href: string; className: string; children: ReactNode }) {
  if (href.startsWith("#")) {
    return <a className={className} href={href}>{children}</a>;
  }
  return <Link className={className} href={href as Route}>{children}</Link>;
}

function QuranRadio() {
  const reveal = useSocialMotionPreset("reveal");
  const sectionRef = useRef<HTMLElement>(null);
  const { station, playing, loading, error, volume, togglePlayback, updateVolume, setSectionVisible } = useRadio();

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(([entry]) => setSectionVisible(entry?.isIntersecting ?? false), { threshold: 0.12 });
    observer.observe(section);
    return () => {
      observer.disconnect();
      setSectionVisible(false);
    };
  }, [setSectionVisible]);

  return (
    <motion.section className="landing-radio" id="radio" aria-labelledby="radio-title" ref={sectionRef} {...reveal} viewport={{ once: true, amount: 0.25 }}>
      <div className="landing-radio__copy">
        <span className="landing-kicker"><Radio size={17} aria-hidden /> بث مباشر</span>
        <h2 id="radio-title">إذاعة القرآن الكريم</h2>
        <p>اجعل تلاوة القرآن رفيقة وقتك. يبدأ البث فقط عندما تضغط تشغيل، ويستمر معك أثناء تصفح المنارة.</p>
        <a href={station.providerUrl} target="_blank" rel="noreferrer">مصدر البث: {station.providerName}</a>
      </div>
      <div className="radio-player">
        <div className="radio-player__art" aria-hidden><Headphones /></div>
        <div className="radio-player__station">
          <span>{playing ? "يعمل الآن" : "جاهز للاستماع"}</span>
          <strong>{station.name}</strong>
        </div>
        <button className="radio-player__play" type="button" onClick={togglePlayback} disabled={loading}
          aria-label={playing ? "إيقاف إذاعة القرآن مؤقتًا" : "تشغيل إذاعة القرآن"}>
          {playing ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}
        </button>
        <label className="radio-player__volume">
          <Volume2 aria-hidden />
          <span>مستوى الصوت</span>
          <input type="range" min="0" max="100" value={volume} onChange={(event) => updateVolume(Number(event.currentTarget.value))} />
          <output>{volume}%</output>
        </label>
        <p className="radio-player__status" role="status" aria-live="polite">{error}</p>
      </div>
    </motion.section>
  );
}

export function LandingPage({ isAuthenticated = false }: { isAuthenticated?: boolean }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [autoplayPaused, setAutoplayPaused] = useState(false);
  const reveal = useSocialMotionPreset("reveal");
  const primaryHref = (isAuthenticated ? "/quran" : "/register") as Route;
  const joinLabel = isAuthenticated ? "استمع للقرآن الكريم" : "أنشئ حسابًا في المنارة";

  const heroSlides = [
    {
      id: "knowledge",
      kicker: "معرفة إسلامية موثوقة",
      icon: Sparkles,
      title: <>معرفة تُبصر بها،<br /><em>وقرآن يرافقك دومًا.</em></>,
      text: "منصة عربية تجمع المحتوى الإسلامي الموثق، والمصادر الواضحة، وأهل الاختصاص في مساحة واحدة هادئة وقريبة منك.",
      primaryLabel: joinLabel,
      primaryHref,
      secondaryLabel: "تصفّح القرآن الكريم",
      secondaryHref: "/quran",
      photo: mosquePhoto, photoAlt: "أقواس مسجد مزخرفة تطل على المئذنة والفناء", photoPosition: "50% 60%",
    },
    {
      id: "sources",
      kicker: "مصادر موثقة",
      icon: SearchCheck,
      title: <>كل معلومة،<br /><em>ومصدرها أمامك.</em></>,
      text: "لا نكتفي بنقل المعلومة، بل نُرفقها بمرجعها الأصلي؛ لتتحقق بنفسك وتطمئن وترجع إليه متى شئت.",
      primaryLabel: joinLabel,
      primaryHref,
      secondaryLabel: "تصفّح القرآن الكريم",
      secondaryHref: "/quran",
      photo: quranPhoto, photoAlt: "مصحف مفتوح على حامل خشبي داخل مسجد", photoPosition: "50% 57%",
    },
    {
      id: "identity",
      kicker: "هوية موثوقة",
      icon: CircleUserRound,
      title: <>تعرف من يتحدث،<br /><em>قبل أن تثق بما يُقال.</em></>,
      text: "كل صاحب محتوى في المنارة موثّق الهوية والتخصص، فتختار بثقة من تتابعه ومن تسأله.",
      primaryLabel: joinLabel,
      primaryHref,
      secondaryLabel: "تصفّح القرآن الكريم",
      secondaryHref: "/quran",
      photo: readingPhoto, photoAlt: "رجل يقرأ القرآن في لحظة هادئة من التدبر", photoPosition: "53% 45%",
    },
    {
      id: "radio",
      kicker: "بث مباشر",
      icon: Radio,
      title: <>استمع لإذاعة القرآن،<br /><em>وأنت تتصفح.</em></>,
      text: "دع تلاوة القرآن الكريم ترافقك أثناء القراءة والتصفح، بضغطة واحدة من أي مكان في المنارة.",
      primaryLabel: "استمع الآن",
      primaryHref: "#radio",
      secondaryLabel: joinLabel,
      secondaryHref: primaryHref,
      photo: radioPhoto, photoAlt: "جهاز راديو كلاسيكي للاستماع إلى البث الإذاعي", photoPosition: "50% 50%",
    },
  ];

  const slide = heroSlides[activeSlide]!;

  function goTo(index: number) {
    setActiveSlide(((index % heroSlides.length) + heroSlides.length) % heroSlides.length);
  }

  useEffect(() => {
    if (autoplayPaused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setActiveSlide((prev) => (prev + 1) % heroSlides.length), 7000);
    return () => clearInterval(id);
  }, [activeSlide, autoplayPaused, heroSlides.length]);

  return (
    <div className="landing-page">
      <a className="landing-skip" href="#landing-main">انتقل إلى المحتوى</a>
      <SiteHeader isAuthenticated={isAuthenticated} />

      <main id="landing-main">
        <section className="landing-hero" aria-roledescription="carousel" aria-label="أبرز ما يميز المنارة"
          onMouseEnter={() => setAutoplayPaused(true)} onMouseLeave={() => setAutoplayPaused(false)}>
          <AnimatePresence mode="wait">
            <motion.div key={slide.id} className="landing-hero__slide" role="group" aria-roledescription="شريحة"
              aria-label={`الشريحة ${activeSlide + 1} من ${heroSlides.length}`}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}>
              <div className="landing-hero__photo">
                <Image
                  src={slide.photo}
                  alt={slide.photoAlt}
                  fill
                  sizes="100vw"
                  placeholder="blur"
                  loading={activeSlide === 0 ? "eager" : "lazy"}
                  fetchPriority={activeSlide === 0 ? "high" : "auto"}
                  style={{ objectPosition: slide.photoPosition }}
                />
                {slide.id === "identity" && <span className="landing-hero__photo-caption">صورة تعبيرية عن التعلّم والتدبّر</span>}
              </div>
              <div className="landing-hero__copy">
                <span className="landing-kicker"><slide.icon size={17} aria-hidden /> {slide.kicker}</span>
                <h1>{slide.title}</h1>
                <p>{slide.text}</p>
                <div className="landing-hero__actions">
                  <HeroCta href={slide.primaryHref} className="landing-button landing-button--large">
                    {slide.primaryLabel}<ArrowLeft aria-hidden />
                  </HeroCta>
                  <HeroCta href={slide.secondaryHref} className="landing-button landing-button--ghost landing-button--large">
                    {slide.secondaryLabel}
                  </HeroCta>
                </div>
                {activeSlide === 0 && (
                  <div className="landing-proof"><span>مصادر واضحة</span><span>باحثون موثقون</span><span>خصوصيتك أولًا</span></div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
          <div className="landing-hero__controls">
            <button type="button" className="landing-hero__arrow" onClick={() => goTo(activeSlide - 1)} aria-label="الشريحة السابقة"><ChevronRight aria-hidden /></button>
            <div className="landing-hero__dots">
              {heroSlides.map((item, index) => (
                <button key={item.id} type="button" aria-current={index === activeSlide} aria-label={`الانتقال إلى شريحة ${item.kicker}`} onClick={() => goTo(index)} />
              ))}
            </div>
            <button type="button" className="landing-hero__arrow" onClick={() => goTo(activeSlide + 1)} aria-label="الشريحة التالية"><ChevronLeft aria-hidden /></button>
          </div>
        </section>

        <motion.section className="landing-trust" id="why" aria-labelledby="why-title" {...reveal} viewport={{ once: true, amount: 0.25 }}>
          <div className="landing-section-heading"><span>ما الذي يميز المنارة؟</span><h2 id="why-title">الثقة ليست شعارًا، بل جزء من كل تجربة.</h2></div>
          <div className="landing-card-grid">{trustPoints.map(({ title, text, icon: Icon }, index) => <motion.article key={title} {...reveal} viewport={{ once: true, amount: 0.4 }} transition={{ ...reveal.transition, delay: index * 0.08 }}><Icon aria-hidden /><h3>{title}</h3><p>{text}</p></motion.article>)}</div>
        </motion.section>

        <motion.section className="landing-categories" id="categories" aria-labelledby="categories-title" {...reveal} viewport={{ once: true, amount: 0.2 }}>
          <div className="landing-section-heading"><span>تعلّم حسب اهتمامك</span><h2 id="categories-title">أبواب معرفة مرتبة وواضحة.</h2><p>ابدأ من المجال الأقرب إليك، واحفظ ما يفيدك لتعود إليه لاحقًا.</p></div>
          <div className="landing-category-grid">{categories.map(({ title, text, icon: Icon }, index) => <MotionLink href="/quran" key={title} className="landing-category" {...reveal} viewport={{ once: true, amount: 0.4 }} transition={{ ...reveal.transition, delay: index * 0.08 }}><span>0{index + 1}</span><Icon aria-hidden /><h3>{title}</h3><p>{text}</p><ArrowLeft aria-hidden /></MotionLink>)}</div>
        </motion.section>

        <QuranRadio />

        <motion.section className="landing-final" {...reveal} viewport={{ once: true, amount: 0.3 }}><Sparkles aria-hidden /><h2>مكان واحد لمعرفة أعمق<br />وصحبة أفضل.</h2><p>انضم إلى المنارة وابدأ تجربة معرفية تحفظ وقتك وعقلك.</p><Link className="landing-button landing-button--light landing-button--large" href={primaryHref}>{isAuthenticated ? "الاستماع للقرآن الكريم" : "إنشاء حساب مجاني"}<ArrowLeft aria-hidden /></Link></motion.section>
      </main>
      <footer className="landing-footer"><Link className="landing-brand" href="/" aria-label="المنارة — الرئيسية"><BrandLogo /></Link><p>معرفة موثوقة، بهوية واضحة.</p><nav aria-label="روابط التذييل"><Link href="/quran">القرآن الكريم</Link></nav><small>© 2026 المنارة</small></footer>
    </div>
  );
}
