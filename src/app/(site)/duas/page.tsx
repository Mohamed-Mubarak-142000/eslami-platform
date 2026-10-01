import { SoundsPage, soundsMetadata } from "@/features/sounds/SoundsPage";

export const metadata = soundsMetadata("duas");

export const revalidate = 86400;

export default function DuasPage() {
  return <SoundsPage category="duas" />;
}
