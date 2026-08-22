import type { Metadata } from "next";
import { ResetPasswordForm } from "@/features";
import { readResetTokenState } from "@/integrations";

export const metadata: Metadata = {
  title: "تعيين كلمة مرور جديدة",
  description: "تعيين كلمة مرور جديدة في بيئة المنارة التجريبية.",
  robots: { index: false, follow: false, noarchive: true },
};

export default async function Page({ searchParams }: { searchParams: Promise<{ state?: string | string[] }> }) {
  const query = await searchParams;
  return <ResetPasswordForm tokenState={readResetTokenState(query.state)} />;
}
