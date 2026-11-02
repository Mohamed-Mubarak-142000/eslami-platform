import { HadithDetail, hadithMetadata } from "@/features/hadith/HadithPages";

export const revalidate = 604800;

/** Rendered on first visit and cached; none at build time. */
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/hadith/[id]">) {
  return hadithMetadata((await params).id);
}

/** One hadith, under its first topic. */
export default async function Page({ params }: PageProps<"/hadith/[id]">) {
  const { id } = await params;
  return <HadithDetail id={id} />;
}
