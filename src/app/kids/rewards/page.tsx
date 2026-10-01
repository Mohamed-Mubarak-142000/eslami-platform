import type { Metadata } from "next";
import { RewardsView, type RewardsTab } from "@/features/kids/rewards/RewardsView";

export const metadata: Metadata = { title: "جوائزي" };

const TABS: RewardsTab[] = ["chests", "badges", "shop"];

export default async function KidsRewardsPage({ searchParams }: PageProps<"/kids/rewards">) {
  const { tab } = await searchParams;
  const initialTab = TABS.find((entry) => entry === tab) ?? "chests";
  return <RewardsView key={initialTab} initialTab={initialTab} />;
}
