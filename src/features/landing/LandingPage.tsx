"use client";

import Link from "next/link";
import type { Route } from "next";
import {
  ArrowLeft, BookOpenCheck, Bookmark, CircleUserRound, Headphones,
  HeartHandshake, LibraryBig, Menu, MessageCircleQuestion, Pause,
  Play, Radio, SearchCheck, ShieldCheck, Sparkles, UsersRound, Volume2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { BrandLogo } from "@/components/layout";
import "./landing.css";

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

export interface QuranRadioStation {
  name: string;
  streamUrl: string;
  providerName: string;
  providerUrl: string;
}

function QuranRadio({ station }: { station: QuranRadioStation }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [playing, setPlaying] = useState(false);
  const [sectionVisible, setSectionVisible] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [volume, setVolume] = useState(70);

  useEffect(() => () => {
    audioRef.current?.pause();
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(([entry]) => setSectionVisible(entry?.isIntersecting ?? false), { threshold: 0.12 });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  async function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) return;
    setError("");
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    setLoading(true);
    try {
      await audio.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
      setError("تعذر تشغيل البث الآن. تحقق من اتصالك ثم حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  }

  function updateVolume(value: number) {
    setVolume(value);
    if (audioRef.current) audioRef.current.volume = value / 100;
  }

  return (
    <section className="landing-radio" id="radio" aria-labelledby="radio-title" ref={sectionRef}>
      <div className="landing-radio__copy">
        <span className="landing-kicker"><Radio size={17} aria-hidden /> بث مباشر</span>
        <h2 id="radio-title">إذاعة القرآن الكريم</h2>
        <p>اجعل تلاوة القرآن رفيقة وقتك. يبدأ البث فقط عندما تضغط تشغيل.</p>
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
        <audio ref={audioRef} src={station.streamUrl} preload="none" onPause={() => setPlaying(false)}
          onError={() => { setPlaying(false); setLoading(false); setError("البث غير متاح مؤقتًا. حاول مرة أخرى لاحقًا."); }} />
        <p className="radio-player__status" role="status" aria-live="polite">{error}</p>
      </div>
      {playing && !sectionVisible && (
        <div className="radio-dock" role="region" aria-label="مشغل إذاعة القرآن الكريم المصغر">
          <div className="radio-dock__inner">
            <span className="radio-dock__live"><Radio aria-hidden /> مباشر</span>
            <div className="radio-dock__station"><strong>{station.name}</strong><small>إذاعة القرآن الكريم المصرية</small></div>
            <button type="button" className="radio-dock__control" onClick={togglePlayback} aria-label="إيقاف إذاعة القرآن مؤقتًا"><Pause fill="currentColor" /></button>
            <label className="radio-dock__volume"><Volume2 aria-hidden /><span className="sr-only">مستوى صوت الإذاعة</span><input type="range" min="0" max="100" value={volume} onChange={(event) => updateVolume(Number(event.currentTarget.value))} /></label>
            <button type="button" className="radio-dock__close" onClick={() => { audioRef.current?.pause(); setPlaying(false); }} aria-label="إغلاق مشغل الإذاعة"><X aria-hidden /></button>
          </div>
        </div>
      )}
    </section>
  );
}

export function LandingPage({ station, isAuthenticated = false }: { station: QuranRadioStation; isAuthenticated?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const primaryHref = (isAuthenticated ? "/community" : "/register") as Route;
  return (
    <div className="landing-page">
      <a className="landing-skip" href="#landing-main">انتقل إلى المحتوى</a>
      <header className="landing-header">
        <Link className="landing-brand" href="/" aria-label="بصيرة — الرئيسية">
          <BrandLogo priority />
        </Link>
        <button className="landing-menu" type="button" aria-expanded={menuOpen} aria-controls="landing-nav" onClick={() => setMenuOpen(!menuOpen)}>
          <Menu aria-hidden /> <span className="sr-only">فتح القائمة</span>
        </button>
        <nav id="landing-nav" className="landing-nav" data-open={menuOpen || undefined} aria-label="التنقل العام">
          <a href="#why">لماذا بصيرة؟</a><a href="#categories">الأقسام</a><a href="#radio">إذاعة القرآن</a>
          <Link href="/about">من نحن</Link>
        </nav>
        <div className="landing-header__actions">
          <Link className="landing-button landing-button--ghost" href="/login">تسجيل الدخول</Link>
          <Link className="landing-button" href={primaryHref}>{isAuthenticated ? "اذهب للمجتمع" : "أنشئ حسابًا"}</Link>
        </div>
      </header>

      <main id="landing-main">
        <section className="landing-hero">
          <div className="landing-hero__copy">
            <span className="landing-kicker"><Sparkles size={17} aria-hidden /> معرفة إسلامية موثوقة</span>
            <h1>معرفة تُبصر بها،<br /><em>ومجتمع تنمو معه.</em></h1>
            <p>منصة عربية تجمع المحتوى الإسلامي الموثق، والمصادر الواضحة، وأهل الاختصاص في مساحة واحدة هادئة وقريبة منك.</p>
            <div className="landing-hero__actions">
              <Link className="landing-button landing-button--large" href={primaryHref}>
                {isAuthenticated ? "ادخل مجتمع بصيرة" : "انضم إلى مجتمع بصيرة"}<ArrowLeft aria-hidden />
              </Link>
              <Link className="landing-button landing-button--ghost landing-button--large" href="/categories">استكشف الأقسام</Link>
            </div>
            <div className="landing-proof"><span>مصادر واضحة</span><span>باحثون موثقون</span><span>خصوصيتك أولًا</span></div>
          </div>
          <div className="landing-preview" aria-label="معاينة لتجربة مجتمع بصيرة">
            <div className="landing-preview__glow" />
            <div className="preview-search"><SearchCheck aria-hidden /><span>ابحث في المعرفة والمصادر</span></div>
            <article className="preview-post">
              <div className="preview-avatar">م</div><div><strong>باحث بصيرة</strong><small>متخصص في علوم القرآن · موثق</small></div>
              <span className="preview-tag">علوم القرآن</span>
              <h2>كيف نقرأ السياق قبل فهم الآية؟</h2>
              <p>مدخل موجز يربط المعنى بالسياق، مع إحالات واضحة إلى مصادر التفسير.</p>
              <div className="preview-source"><BookOpenCheck aria-hidden /><span>المصدر موثق ومتاح للرجوع</span><Bookmark aria-hidden /></div>
            </article>
          </div>
        </section>

        <section className="landing-trust" id="why" aria-labelledby="why-title">
          <div className="landing-section-heading"><span>ما الذي يميز بصيرة؟</span><h2 id="why-title">الثقة ليست شعارًا، بل جزء من كل تجربة.</h2></div>
          <div className="landing-card-grid">{trustPoints.map(({ title, text, icon: Icon }) => <article key={title}><Icon aria-hidden /><h3>{title}</h3><p>{text}</p></article>)}</div>
        </section>

        <section className="landing-categories" id="categories" aria-labelledby="categories-title">
          <div className="landing-section-heading"><span>تعلّم حسب اهتمامك</span><h2 id="categories-title">أبواب معرفة مرتبة وواضحة.</h2><p>ابدأ من المجال الأقرب إليك، واحفظ ما يفيدك لتعود إليه لاحقًا.</p></div>
          <div className="landing-category-grid">{categories.map(({ title, text, icon: Icon }, index) => <Link href="/categories" key={title} className="landing-category"><span>0{index + 1}</span><Icon aria-hidden /><h3>{title}</h3><p>{text}</p><ArrowLeft aria-hidden /></Link>)}</div>
        </section>

        <section className="landing-community" aria-labelledby="community-title">
          <div><span className="landing-kicker"><UsersRound size={17} aria-hidden /> مجتمع المعرفة</span><h2 id="community-title">لا تكتفِ بالقراءة.<br />شارك، اسأل، وتابع من تثق بهم.</h2><p>داخل مجتمع بصيرة تستطيع متابعة أهل الاختصاص، حفظ المواد، ومناقشة الأفكار في مساحة تراعي العلم والإنسان.</p><Link className="landing-button landing-button--large" href={primaryHref}>ابدأ رحلتك الآن <ArrowLeft aria-hidden /></Link></div>
          <div className="community-orbit" aria-hidden><span><MessageCircleQuestion /></span><span><Bookmark /></span><span><UsersRound /></span><div><strong>مجتمع<br />بصيرة</strong></div></div>
        </section>

        <QuranRadio station={station} />

        <section className="landing-final"><Sparkles aria-hidden /><h2>مكان واحد لمعرفة أعمق<br />وصحبة أفضل.</h2><p>انضم إلى بصيرة وابدأ تجربة معرفية تحفظ وقتك وعقلك.</p><Link className="landing-button landing-button--light landing-button--large" href={primaryHref}>{isAuthenticated ? "دخول المجتمع" : "إنشاء حساب مجاني"}<ArrowLeft aria-hidden /></Link></section>
      </main>
      <footer className="landing-footer"><Link className="landing-brand" href="/" aria-label="بصيرة — الرئيسية"><BrandLogo /></Link><p>معرفة موثوقة، بهوية واضحة.</p><nav aria-label="روابط التذييل"><Link href="/about">من نحن</Link><Link href="/contact">اتصل بنا</Link><Link href="/categories">جميع الأقسام</Link></nav><small>© 2026 بصيرة</small></footer>
    </div>
  );
}
