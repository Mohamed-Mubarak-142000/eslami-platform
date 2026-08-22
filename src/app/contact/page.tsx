import type { Metadata } from "next";
import { Mail, MessageCircle, ShieldCheck } from "lucide-react";
import "@/integrations/public-pages.css";

export const metadata: Metadata = { title: "اتصل بنا", description: "تواصل مع فريق منصة بصيرة للدعم والاستفسارات والشراكات." };

export default function ContactPage() {
  return <article className="public-page" aria-labelledby="contact-title"><header className="public-page__hero"><p>نحن هنا للمساعدة</p><h1 id="contact-title">اتصل بنا</h1><p>اختر قناة التواصل المناسبة، وسيرد عليك الفريق في أقرب وقت.</p></header><div className="public-page__grid public-page__grid--contact"><a href="mailto:hello@basira.example"><Mail aria-hidden="true" /><span><strong>البريد العام</strong><small>hello@basira.example</small></span></a><a href="mailto:support@basira.example"><MessageCircle aria-hidden="true" /><span><strong>الدعم الفني</strong><small>support@basira.example</small></span></a><a href="mailto:privacy@basira.example"><ShieldCheck aria-hidden="true" /><span><strong>الخصوصية والأمان</strong><small>privacy@basira.example</small></span></a></div></article>;
}
