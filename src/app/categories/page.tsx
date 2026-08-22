import type { Metadata } from "next";
import { BookOpen, Grid3X3 } from "lucide-react";
import { services } from "@/integrations";
import "@/integrations/public-pages.css";

export const metadata: Metadata = { title: "جميع الأقسام", description: "تصفح جميع أقسام وموضوعات المعرفة المتاحة على منصة بصيرة." };

export default function CategoriesPage() {
  return <section className="public-page" aria-labelledby="categories-title"><header className="public-page__hero"><p>تصفح المعرفة</p><h1 id="categories-title">جميع الأقسام</h1><p>اختر القسم الذي يناسب اهتمامك وابدأ القراءة.</p></header><ul className="categories-grid">{services.data.topics.map((topic) => <li key={topic.id}><a href={`/topics/${topic.slug}`}><span><BookOpen aria-hidden="true" /></span><strong>{topic.name}</strong><Grid3X3 size={17} aria-hidden="true" /></a></li>)}</ul></section>;
}
