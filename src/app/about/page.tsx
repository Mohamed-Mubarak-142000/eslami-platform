import type { Metadata } from "next";
import { BookOpenCheck, ShieldCheck, UsersRound } from "lucide-react";
import "@/integrations/public-pages.css";

export const metadata: Metadata = { title: "من نحن", description: "تعرف على رسالة المنارة ومنهجها في تقديم معرفة إسلامية موثقة." };

export default function AboutPage() {
  return <article className="public-page" aria-labelledby="about-title"><header className="public-page__hero"><p>عن منصة المنارة</p><h1 id="about-title">معرفة موثوقة، أقرب إلى الناس</h1><p>نبني مساحة عربية تجمع المحتوى النافع بالمصادر الواضحة والمتخصصين الموثوقين.</p></header><div className="public-page__grid"><section><BookOpenCheck aria-hidden="true" /><h2>رسالتنا</h2><p>تسهيل الوصول إلى المعرفة الإسلامية بلغة واضحة وتجربة حديثة.</p></section><section><ShieldCheck aria-hidden="true" /><h2>منهجنا</h2><p>إظهار المصادر، واحترام الاختلاف المعتبر، وحماية خصوصية السائل.</p></section><section><UsersRound aria-hidden="true" /><h2>مجتمعنا</h2><p>قراء وباحثون ومتخصصون يجتمعون حول التعلم والحوار المسؤول.</p></section></div></article>;
}
