import { HandHeart, Landmark, MicVocal, MoonStar, type LucideIcon } from "lucide-react";
import type { SoundCategoryKey } from "./soundsApi";

export const SOUND_ICONS: Record<SoundCategoryKey, LucideIcon> = {
  ibtihalat: MoonStar,
  tawasheeh: MicVocal,
  duas: HandHeart,
  adhan: Landmark,
};
