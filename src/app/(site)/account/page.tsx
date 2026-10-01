import type { Metadata } from "next";
import { Settings } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireSession } from "@/features/auth/session";
import { AccountSettings } from "@/features/account/AccountSettings";

export const metadata: Metadata = { title: "حسابي", robots: { index: false } };

export default async function AccountPage() {
  const { email, profile, learners } = await requireSession("/account");
  return (
    <>
      <PageHeader
        kicker="حسابي"
        icon={<Settings className="size-4" aria-hidden />}
        title={`أهلًا ${profile.full_name || "بك"}`}
        description="بياناتك، وملفات أطفالك، وكلمة المرور."
      />
      <AccountSettings
        email={email}
        fullName={profile.full_name}
        certificateName={profile.certificate_name}
        childLearners={learners.filter((learner) => learner.kind === "child")}
        emailUpdates={profile.email_updates}
        reminders={{ friday: profile.remind_friday, fasting: profile.remind_fasting, seasons: profile.remind_seasons }}
      />
    </>
  );
}
