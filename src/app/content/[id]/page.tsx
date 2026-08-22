import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentDetail } from "@/features";
import { services } from "@/integrations";
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> { const { id } = await params; const content = services.data.content.find(item => item.id === id); return content ? { title: content.title, description: content.summary } : { title: "محتوى غير موجود" }; }
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; const content = services.data.content.find(item => item.id === id); if (!content) notFound(); return <ContentDetail content={content} author={services.data.scholars[0]} />; }
