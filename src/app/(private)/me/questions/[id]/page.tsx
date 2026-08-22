import type { Metadata } from "next";
import { QuestionDetail } from "@/features";
import { services } from "@/integrations";
export const metadata: Metadata = { title: "سؤال خاص", description: "متابعة سؤال خاص", robots: { index: false, follow: false, noarchive: true, nosnippet: true } };
export const dynamic = "force-dynamic";
export const revalidate = 0;
export default function Page() { return <QuestionDetail question={services.data.privateQuestion} privateAccess />; }
