import type { Metadata } from "next";
import { RegisterForm } from "@/features";
export const metadata: Metadata = { title: "إنشاء حساب", robots: { index: false, follow: false } };
export default function Page() { return <RegisterForm />; }
