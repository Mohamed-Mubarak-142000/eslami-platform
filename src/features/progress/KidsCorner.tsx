"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Gamepad2, Trees, UserPlus } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { useAccountContext } from "@/features/account/AccountProvider";

/** Entry to the kids garden from the dashboard: open it for the selected child, or pick / add one. */
export function KidsCorner() {
  const { state, setActiveLearner } = useAccountContext();
  const router = useRouter();
  if (state.status !== "signed-in") return null;

  const { activeLearner, learners } = state;
  const children = learners.filter((learner) => learner.kind === "child");

  return (
    <section
      aria-labelledby="kids-corner-heading"
      className="flex flex-wrap items-center justify-between gap-5 rounded-4xl border border-sky/30 bg-linear-to-l from-sky/10 to-white p-6 shadow-soft"
    >
      <div className="flex items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-sky/15 text-sky">
          <Trees className="size-6" aria-hidden />
        </span>
        <div>
          <h2 id="kids-corner-heading" className="text-xl font-bold text-emerald-deep">
            {activeLearner.kind === "child" ? `حديقة القرآن لـ ${activeLearner.display_name}` : "حديقة القرآن لأطفالك"}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {activeLearner.kind === "child"
              ? "تعلّم السور وألعاب الحروف والتجويد — كل نتيجة ونجمة تُحفظ في ملفه."
              : children.length > 0
                ? "اختر طفلك لتفتح له الحديقة، وتُحفظ ألعابه ونتائجه في ملفه."
                : "أضف طفلك لتفتح له مساحة يتعلّم فيها ويلعب، وتتابع نتائجه من هنا."}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {activeLearner.kind === "child" ? (
          <Link href="/kids" className={buttonClass("primary", "md")}>
            <Gamepad2 aria-hidden /> ادخل الحديقة
          </Link>
        ) : children.length > 0 ? (
          children.map((child) => (
            <button
              key={child.id}
              type="button"
              onClick={() => {
                setActiveLearner(child.id);
                router.push("/kids");
              }}
              className={buttonClass("outline", "md")}
            >
              <Gamepad2 aria-hidden /> {child.display_name}
            </button>
          ))
        ) : (
          <Link href="/account" className={buttonClass("primary", "md")}>
            <UserPlus aria-hidden /> أضف طفلًا
          </Link>
        )}
      </div>
    </section>
  );
}
