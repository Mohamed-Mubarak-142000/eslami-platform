import type { Metadata } from "next";
import { GardenView } from "@/features/kids/garden/GardenView";

export const metadata: Metadata = { title: "حديقتي" };

export default function KidsGardenPage() {
  return <GardenView />;
}
