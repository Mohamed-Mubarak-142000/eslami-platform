import type { Metadata } from "next";
import type { ReactNode } from "react";
import { KidsShell } from "@/features/kids/ui/KidsShell";
import { ChooseChild } from "@/features/kids/ChooseChild";
import { requireSession } from "@/features/auth/session";

export const metadata: Metadata = {
  title: { default: "حديقة القرآن للأطفال", template: "%s — حديقة القرآن" },
  description: "مساحة ممتعة يتعلّم فيها الأطفال السور القصيرة آيةً آية، ويلعبون ألعابًا تفاعلية في الحروف والتجويد.",
  robots: { index: false },
};

// Children only: an account must be signed in with one of its children selected, so every game,
// star and badge is saved to that child in the database.
export default async function KidsLayout({ children }: { children: ReactNode }) {
  const session = await requireSession("/kids");
  const childLearners = session.learners.filter((learner) => learner.kind === "child");
  return (
    <KidsShell>
      {session.activeLearner.kind === "child" ? (
        children
      ) : (
        <ChooseChild childLearners={childLearners.map(({ id, display_name }) => ({ id, display_name }))} />
      )}
    </KidsShell>
  );
}
