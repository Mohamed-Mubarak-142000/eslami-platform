import { HandHeart, Landmark, MicVocal, MoonStar, Radio, type LucideIcon } from "lucide-react";
import type { SoundCategoryKey } from "./soundsApi";

export const SOUND_ICONS: Record<SoundCategoryKey, LucideIcon> = {
  recordings: Radio,
  ibtihalat: MoonStar,
  tawasheeh: MicVocal,
  duas: HandHeart,
  adhan: Landmark,
};
