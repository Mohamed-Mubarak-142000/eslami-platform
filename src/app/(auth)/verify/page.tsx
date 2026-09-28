import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { VerifyOtpForm } from "@/features/auth/ui/AuthForms";
import type { OtpType } from "@/features/auth/actions";

export const metadata: Metadata = { title: "كود التحقق", robots: { index: false } };

const TYPES: OtpType[] = ["signup", "recovery", "email"];

export default async function VerifyPage({ searchParams }: PageProps<"/verify">) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : "";
  const type = TYPES.find((value) => value === params.type) ?? "signup";
  if (!email) redirect("/login");
  return <VerifyOtpForm email={email} type={type} next={typeof params.next === "string" ? params.next : undefined} />;
}
