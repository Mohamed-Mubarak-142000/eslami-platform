import Link from "next/link";
import type { Route } from "next";
import { ArrowLeft, ArrowRight, CheckCircle2, Lightbulb } from "lucide-react";
import { toArabicDigits } from "@/lib/arabic";
import { kidsButton, kidsPanel } from "../ui/kidsStyles";
import type { StoriesPath, StorySummary } from "./data";
import { youtubeThumbnail } from "./youtube";

export function storiesProgressLine(stories: StorySummary[], watched: Set<string>): string {
  if (stories.length === 0) return "القصص في الطريق إليك قريبًا بإذن الله.";
  const count = stories.filter((story) => watched.has(story.id)).length;
  return `شاهدت ${toArabicDigits(count)} من ${toArabicDigits(stories.length)} قصة — اختر قصتك!`;
}

export function StoryGrid({ stories, watched, basePath }: { stories: StorySummary[]; watched: Set<string>; basePath: StoriesPath }) {
  return (
    <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {stories.map((story) => (
        <li key={story.id}>
          <Link
            href={`${basePath}/${story.id}` as Route}
            className="group block overflow-hidden rounded-[2rem] bg-white/95 shadow-lift ring-4 ring-white/60 transition-transform hover:-translate-y-1"
          >
            <div className="relative aspect-video bg-emerald-mist">
              <img src={youtubeThumbnail(story.youtube_id)} alt="" loading="lazy" className="size-full object-cover" />
              {watched.has(story.id) && (
                <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#12a15b] px-3 py-1 text-sm font-extrabold text-white">
                  <CheckCircle2 className="size-4" aria-hidden /> شاهدتها
                </span>
              )}
            </div>
            <div className="p-4 text-center">
              {story.prophet && <p className="text-sm font-bold text-[#7a5af5]">{story.prophet}</p>}
              <p className="mt-1 text-xl font-extrabold text-emerald-deep">{story.title}</p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Summary + lesson panel and the back / next buttons under the player. */
export function StoryFooter({ story, next, basePath }: { story: StorySummary; next: StorySummary | null; basePath: StoriesPath }) {
  return (
    <>
      {(story.summary || story.lesson) && (
        <div className={`${kidsPanel} space-y-4`}>
          {story.summary && <p className="text-lg leading-9 text-ink">{story.summary}</p>}
          {story.lesson && (
            <p className="flex items-start gap-3 rounded-3xl bg-[#fff6d8] p-4 text-lg font-bold text-[#6b4a00]">
              <Lightbulb className="mt-1 size-6 shrink-0 text-[#e0a800]" aria-hidden />
              <span>ماذا تعلّمنا؟ {story.lesson}</span>
            </p>
          )}
        </div>
      )}
      <div className="flex flex-wrap justify-center gap-3">
        <Link href={basePath as Route} className={kidsButton("white")}>
          <ArrowRight aria-hidden /> كل القصص
        </Link>
        {next && (
          <Link href={`${basePath}/${next.id}` as Route} className={kidsButton("violet")}>
            القصة التالية <ArrowLeft aria-hidden />
          </Link>
        )}
      </div>
    </>
  );
}
