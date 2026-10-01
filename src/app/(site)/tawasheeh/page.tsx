import { SoundsPage, soundsMetadata } from "@/features/sounds/SoundsPage";

export const metadata = soundsMetadata("tawasheeh");

export const revalidate = 86400;

export default function TawasheehPage() {
  return <SoundsPage category="tawasheeh" />;
}
