import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, ScrollText } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCategories, getHadith } from "@/features/hadith/api";
import { HadithView } from "@/features/hadith/HadithView";

export const revalidate = 604800;

export async function generateMetadata({ params }: PageProps<"/hadith/[id]">): Promise<Metadata> {
  const hadith = await getHadith((await params).id);
  if (!hadith) return { title: "الأحاديث النبوية" };
  return { title: hadith.title.slice(0, 70), description: hadith.explanation.slice(0, 160) };
}

export default async function HadithPage({ params, searchParams }: PageProps<"/hadith/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [hadith, categories] = await Promise.all([getHadith(id), getCategories()]);
  if (!hadith) notFound();
  // Back to the list the reader came from, else the hadith's first topic.
  const from = typeof query.c === "string" ? query.c : hadith.categoryIds[0];
  const category = categories.find((entry) => entry.id === from);

  return (
    <>
      <PageHeader
        kicker={category?.title ?? "الأحاديث النبوية"}
        icon={<ScrollText className="size-4" aria-hidden />}
        title={hadith.title}
      />
      <div className="mx-auto max-w-4xl space-y-8 px-4 py-10 sm:px-6">
        <Link
          href={(category ? `/hadith/category/${category.id}` : "/hadith") as Route}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald hover:underline"
        >
          <ArrowRight className="size-4" aria-hidden /> {category ? `أحاديث ${category.title}` : "كل الأحاديث"}
        </Link>
        <HadithView hadith={hadith} />
      </div>
    </>
  );
}
