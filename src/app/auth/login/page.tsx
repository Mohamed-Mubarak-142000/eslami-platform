import type { Metadata } from "next";
import { LoginForm } from "@/features";
export const metadata: Metadata = { title: "تسجيل الدخول", robots: { index: false, follow: false } };
export default function Page() { return <LoginForm />; }
