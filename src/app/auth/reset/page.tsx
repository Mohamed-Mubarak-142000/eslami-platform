import type { Metadata } from "next";
import { ForgotPasswordForm, ResetPasswordForm } from "@/features";
import { readResetTokenState } from "@/integrations";
export const metadata: Metadata = { title: "استعادة كلمة المرور", robots: { index: false, follow: false } };
export default async function Page({ searchParams }: { searchParams: Promise<{ mode?: string | string[]; state?: string | string[] }> }) {
  const query = await searchParams;
  const mode = Array.isArray(query.mode) ? query.mode[0] : query.mode;
  return mode === "reset"
    ? <ResetPasswordForm tokenState={readResetTokenState(query.state)} />
    : <ForgotPasswordForm />;
}
