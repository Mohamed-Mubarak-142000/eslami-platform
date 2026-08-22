import type { Metadata } from "next";
import { LoginForm } from "@/features";

export const metadata: Metadata = {
  title: "تسجيل الدخول",
  description: "تسجيل الدخول إلى تجربة بصيرة الداخلية.",
  robots: { index: false, follow: false, noarchive: true },
};

export default function Page() {
  return <LoginForm />;
}
