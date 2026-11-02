import { HadithCategoryList, categoryMetadata } from "@/features/hadith/HadithPages";

export const revalidate = 86400;

/** Rendered on first visit and cached; none at build time. */
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/hadith/category/[id]">) {
  return categoryMetadata((await params).id);
}

/** A topic's first page of hadiths. */
export default async function Page({ params }: PageProps<"/hadith/category/[id]">) {
  const { id } = await params;
  return <HadithCategoryList id={id} />;
}
