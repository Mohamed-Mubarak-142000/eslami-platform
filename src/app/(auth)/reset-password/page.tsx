import type { Metadata } from "next";
import { requireSession } from "@/features/auth/session";
import { ResetPasswordForm } from "@/features/auth/ui/AuthForms";

export const metadata: Metadata = { title: "كلمة مرور جديدة", robots: { index: false } };

export default async function ResetPasswordPage() {
  // The recovery code signs the user in first; only then can the password be changed.
  await requireSession("/forgot-password");
  return <ResetPasswordForm />;
}
