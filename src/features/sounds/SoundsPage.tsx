import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { SOUND_CATEGORIES, getSoundCollections, type SoundCategoryKey } from "./soundsApi";
import { SoundsLibrary } from "./SoundsLibrary";
import { SOUND_ICONS } from "./soundIcons";

export function soundsMetadata(category: SoundCategoryKey): Metadata {
  const { title, description, href } = SOUND_CATEGORIES[category];
  return { title, description, alternates: { canonical: href } };
}

export async function SoundsPage({ category }: { category: SoundCategoryKey }) {
  const { title, description } = SOUND_CATEGORIES[category];
  const Icon = SOUND_ICONS[category];
  const collections = await getSoundCollections(category);
  return (
    <>
      <PageHeader
        kicker="أدعية وابتهالات"
        icon={<Icon className="size-4" aria-hidden />}
        title={title}
        description={`${description} والاستماع يستمر معك وأنت تتنقّل في الموقع.`}
      />
      <div className="pt-10">
        <SoundsLibrary category={category} collections={collections} />
      </div>
    </>
  );
}
