import { BookOpenText, History, Lightbulb, ScrollText, Users } from "lucide-react";
import { SEERAH_DETAILS } from "./seerahDetails";

const ICONS: Record<string, typeof History> = {
  الخلفية: History,
  "ما جرى": ScrollText,
  "شخصيات في الحدث": Users,
  "دروس وعبر": Lightbulb,
};

/** "عمه أبو طالب: ..." → the name in bold, then the rest. */
function Person({ text }: { text: string }) {
  const at = text.indexOf(":");
  if (at < 1 || at > 60) return <p className="leading-8 text-ink">{text}</p>;
  return (
    <p className="leading-8 text-ink">
      <strong className="font-bold text-emerald-deep">{text.slice(0, at)}</strong>
      {text.slice(at)}
    </p>
  );
}

/** The chapter's written details, after its animated story: the key facts, then the full account. */
export function ChapterDetails({ chapter }: { chapter: string }) {
  const details = SEERAH_DETAILS[chapter];
  if (!details) return null;
  return (
    <section aria-labelledby="seerah-details" className="mt-10 rounded-4xl border border-line bg-white p-5 shadow-soft sm:p-8">
      <h2 id="seerah-details" className="flex items-center gap-2 font-display text-2xl font-bold text-emerald-deep">
        <BookOpenText className="size-6 text-gold-deep" aria-hidden /> تفاصيل الحدث
      </h2>

      <dl className="mt-5 grid gap-2 sm:grid-cols-2">
        {details.facts.map((fact) => (
          <div key={fact.label} className="rounded-2xl bg-ivory px-4 py-3">
            <dt className="text-xs font-bold text-gold-deep">{fact.label}</dt>
            <dd className="mt-0.5 font-bold leading-7 text-ink">{fact.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-8 space-y-8">
        {details.sections.map((section) => {
          const Icon = ICONS[section.title] ?? ScrollText;
          const people = section.title === "شخصيات في الحدث";
          const lessons = section.title === "دروس وعبر";
          return (
            <div key={section.title}>
              <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-emerald-deep">
                <span className="grid size-8 place-items-center rounded-xl bg-emerald-mist text-emerald">
                  <Icon className="size-4" aria-hidden />
                </span>
                {section.title}
              </h3>
              {lessons ? (
                <ul className="space-y-2">
                  {section.paragraphs.map((paragraph, index) => (
                    <li key={index} className="flex gap-3 rounded-2xl border border-gold/30 bg-gold-mist/60 px-4 py-3 leading-8 text-ink">
                      <span className="mt-3 size-2 shrink-0 rounded-full bg-gold" aria-hidden />
                      {paragraph}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className={people ? "space-y-3 border-s-2 border-gold/40 ps-4" : "space-y-4"}>
                  {section.paragraphs.map((paragraph, index) =>
                    people ? (
                      <Person key={index} text={paragraph} />
                    ) : (
                      <p key={index} className="text-[1.05rem] leading-9 text-ink">
                        {paragraph}
                      </p>
                    ),
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-8 text-xs leading-6 text-muted">
        بأسلوبنا على ما في «الرحيق المختوم» وكتب السيرة المعتمدة، مقتصرين على ما اتفقت عليه المصادر، وما اختُلف فيه ذُكر الخلاف أو تُرك.
      </p>
    </section>
  );
}
