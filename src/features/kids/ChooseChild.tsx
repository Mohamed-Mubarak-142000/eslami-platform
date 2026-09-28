"use client";

import Link from "next/link";
import { ArrowRight, Baby, UserPlus } from "lucide-react";
import { useAccountContext } from "@/features/account/AccountProvider";
import type { LearnerRow } from "@/lib/supabase/database.types";
import { kidsButton, kidsPanel } from "./ui/kidsStyles";

/**
 * Shown instead of the kids pages while the account holder (not a child) is selected: the kids
 * area records progress per child, so one of them has to be picked first.
 */
export function ChooseChild({ childLearners }: { childLearners: Pick<LearnerRow, "id" | "display_name">[] }) {
  const { setActiveLearner } = useAccountContext();

  return (
    <div className={`${kidsPanel} mx-auto max-w-xl text-center`}>
      <Baby className="mx-auto size-14 text-[#1f9be0]" aria-hidden />
      <h1 className="mt-3 text-3xl font-extrabold text-emerald-deep">حديقة القرآن لأطفالك</h1>
      {childLearners.length > 0 ? (
        <>
          <p className="mt-2 text-lg text-muted">اختر طفلك لتُحفظ ألعابه ونجومه وتقدّمه في حسابه.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {childLearners.map((child) => (
              <button key={child.id} type="button" onClick={() => setActiveLearner(child.id)} className={kidsButton("sky", "text-lg")}>
                {child.display_name}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="mt-2 text-lg text-muted">أضف طفلك من صفحة حسابك أولًا، ثم افتح له الحديقة.</p>
          <Link href="/account" className={kidsButton("emerald", "mt-6 text-lg")}>
            <UserPlus aria-hidden /> أضف طفلًا
          </Link>
        </>
      )}
      <Link href="/dashboard" className="mt-6 flex items-center justify-center gap-1 text-sm font-bold text-emerald hover:underline">
        <ArrowRight className="size-4" aria-hidden /> العودة إلى رحلتي
      </Link>
    </div>
  );
}
