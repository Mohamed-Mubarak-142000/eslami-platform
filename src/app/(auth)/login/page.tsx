import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/ui/AuthForms";

export const metadata: Metadata = { title: "تسجيل الدخول", robots: { index: false } };

const NOTICES: Record<string, string> = {
  google: "تعذّر الدخول بحساب Google، حاول مرة أخرى.",
  callback: "انتهت صلاحية رابط الدخول، سجّل الدخول من جديد.",
  "not-configured": "الحسابات غير مفعّلة على هذا الخادم بعد.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : undefined;
  const error = typeof params.error === "string" ? NOTICES[params.error] : undefined;
  return <LoginForm next={next} notice={error} />;
}
