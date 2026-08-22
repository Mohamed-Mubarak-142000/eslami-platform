import type { Metadata } from "next";
import { QuestionDetail } from "@/features";
import { services } from "@/integrations";
const publicQuestion = { ...services.data.privateQuestion, id: "question-public-1", title: "سؤال عام تجريبي", details: "تفاصيل سؤال عام موثق.", visibility: "public" as const };
export const metadata: Metadata = { title: "سؤال عام", description: "سؤال عام وإجابة موثقة بالمصادر." };
export default function Page() { return <QuestionDetail question={publicQuestion} sources={services.data.content[0].sources} />; }
