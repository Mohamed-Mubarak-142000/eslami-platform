import { SoundsPage, soundsMetadata } from "@/features/sounds/SoundsPage";

export const metadata = soundsMetadata("recordings");

export const revalidate = 86400;

export default function RecordingsPage() {
  return <SoundsPage category="recordings" />;
}
