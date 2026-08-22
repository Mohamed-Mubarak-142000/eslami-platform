import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/features";

export const metadata: Metadata = {
  title: "استعادة كلمة المرور",
  description: "طلب تعليمات استعادة لحساب المنارة التجريبي دون كشف وجود الحساب.",
  robots: { index: false, follow: false, noarchive: true },
};

export default function Page() {
  return <ForgotPasswordForm />;
}
