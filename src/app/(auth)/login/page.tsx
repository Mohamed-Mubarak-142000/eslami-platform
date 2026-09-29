import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/ui/AuthForms";

export const metadata: Metadata = { title: "تسجيل الدخول", robots: { index: false } };

const NOTICES: Record<string, string> = {
  google: "تعذّر الدخول بحساب Google، حاول مرة أخرى.",
  facebook: "تعذّر الدخول بحساب Facebook، حاول مرة أخرى.",
  "oauth-cancelled": "لم يكتمل الدخول. اضغط الزر مرة أخرى متى شئت.",
  "oauth-no-email":
    "حسابك على Facebook لا يشارك بريدًا إلكترونيًا، ونحتاجه لحفظ تقدّمك. اسمح بمشاركة البريد، أو ادخل بحساب Google أو أنشئ حسابًا بالبريد.",
  callback: "لم يكتمل الدخول. حاول مرة أخرى من متصفح الهاتف (Chrome أو Safari)، أو ادخل بكلمة المرور أو بكود على البريد.",
  "not-configured": "الحسابات غير مفعّلة على هذا الخادم بعد.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : undefined;
  const error = typeof params.error === "string" ? NOTICES[params.error] : undefined;
  return <LoginForm next={next} notice={error} />;
}
