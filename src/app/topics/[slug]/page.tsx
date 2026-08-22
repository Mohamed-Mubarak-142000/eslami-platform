import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TopicView } from "@/features";
import { services } from "@/integrations";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; const topic = services.data.topics.find(item => item.slug === slug); return { title: topic?.name ?? "موضوع غير موجود" }; }
export default async function Page({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const topic = services.data.topics.find(item => item.slug === slug); if (!topic) notFound(); return <TopicView topic={topic} content={services.data.content} />; }
