import type { Metadata } from "next";
import { RegisterForm } from "@/features/auth/ui/AuthForms";

export const metadata: Metadata = { title: "إنشاء حساب", robots: { index: false } };

export default function RegisterPage() {
  return <RegisterForm />;
}
