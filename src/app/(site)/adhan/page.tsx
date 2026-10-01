import { SoundsPage, soundsMetadata } from "@/features/sounds/SoundsPage";

export const metadata = soundsMetadata("adhan");

export const revalidate = 86400;

export default function AdhanPage() {
  return <SoundsPage category="adhan" />;
}
