import { SoundsPage, soundsMetadata } from "@/features/sounds/SoundsPage";

export const metadata = soundsMetadata("ibtihalat");

export const revalidate = 86400;

export default function IbtihalatPage() {
  return <SoundsPage category="ibtihalat" />;
}
