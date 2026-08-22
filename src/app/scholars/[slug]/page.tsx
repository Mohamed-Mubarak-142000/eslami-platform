import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ScholarProfileView } from "@/features";
import { services } from "@/integrations";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; const scholar = services.data.scholars.find(item => item.slug === slug); return scholar ? { title: scholar.displayName, description: scholar.bio } : { title: "ملف غير موجود" }; }
export default async function Page({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const scholar = services.data.scholars.find(item => item.slug === slug); if (!scholar) notFound(); return <ScholarProfileView scholar={scholar} content={services.data.content} />; }
