import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/features/auth/ui/AuthForms";

export const metadata: Metadata = { title: "استعادة كلمة المرور", robots: { index: false } };

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
