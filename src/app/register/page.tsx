import type { Metadata } from "next";
import { RegisterForm } from "@/features";

export const metadata: Metadata = {
  title: "إنشاء حساب عضو",
  description: "إنشاء حساب عضو تجريبي في المنارة.",
  robots: { index: false, follow: false, noarchive: true },
};

export default function Page() {
  return <RegisterForm />;
}
