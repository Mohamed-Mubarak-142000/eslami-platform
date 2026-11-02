import { HadithDetail, hadithMetadata } from "@/features/hadith/HadithPages";

export const revalidate = 604800;

/** Rendered on first visit and cached; none at build time. */
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/hadith/[id]/in/[c]">) {
  return hadithMetadata((await params).id);
}

/** `/hadith/5?c=3`, rewritten here (next.config.ts): the hadith opened from a topic's list. */
export default async function Page({ params }: PageProps<"/hadith/[id]/in/[c]">) {
  const { id, c } = await params;
  return <HadithDetail id={id} from={c} />;
}
