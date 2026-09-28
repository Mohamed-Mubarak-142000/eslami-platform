import type { ReactNode } from "react";

export interface LegalSection {
  title: string;
  body: ReactNode;
}

export function LegalDocument({ updated, sections }: { updated: string; sections: LegalSection[] }) {
  return (
    <article className="mx-auto max-w-3xl px-4 pt-10 sm:px-6">
      <p className="text-sm text-ink/60">آخر تحديث: {updated}</p>
      <div className="mt-8 space-y-10">
        {sections.map((section, index) => (
          <section key={section.title}>
            <h2 className="text-xl font-bold text-emerald-deep">
              {index + 1}. {section.title}
            </h2>
            <div className="mt-3 space-y-3 leading-8 text-ink/85 [&_li]:ms-5 [&_li]:list-disc [&_ul]:space-y-1.5">{section.body}</div>
          </section>
        ))}
      </div>
    </article>
  );
}
