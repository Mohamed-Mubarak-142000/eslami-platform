import { HadithCategoryList, categoryMetadata } from "@/features/hadith/HadithPages";

export const revalidate = 86400;

/** Rendered on first visit and cached; none at build time. */
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/hadith/category/[id]/p/[page]">) {
  return categoryMetadata((await params).id);
}

/** `/hadith/category/3?page=2`, rewritten here (next.config.ts). */
export default async function Page({ params }: PageProps<"/hadith/category/[id]/p/[page]">) {
  const { id, page } = await params;
  return <HadithCategoryList id={id} page={page} />;
}
