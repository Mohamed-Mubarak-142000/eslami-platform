import { getKidsSurahs } from "@/features/kids/kidsData";
import { JourneyMap } from "@/features/kids/journey/JourneyMap";

export const revalidate = 86400;

export default async function KidsPage() {
  return <JourneyMap surahs={await getKidsSurahs()} />;
}
