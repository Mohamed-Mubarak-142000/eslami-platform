import type { Metadata } from "next";
import { getKidsSurahs } from "@/features/kids/kidsData";
import { ParentArea } from "@/features/kids/progress/ParentArea";

export const metadata: Metadata = { title: "لوحة الأهل", robots: { index: false } };
export const revalidate = 86400;

export default async function ParentPage() {
  return <ParentArea surahs={await getKidsSurahs()} />;
}
