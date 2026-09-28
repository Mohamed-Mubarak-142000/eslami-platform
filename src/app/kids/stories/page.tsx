import Link from "next/link";
import type { Metadata, Route } from "next";
import { CheckCircle2, Clapperboard } from "lucide-react";
import { toArabicDigits } from "@/lib/arabic";
import { requireSession } from "@/features/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { kidsPanel } from "@/features/kids/ui/kidsStyles";
import { youtubeThumbnail } from "@/features/kids/stories/youtube";

export const metadata: Metadata = { title: "قصص الأنبياء" };

export default async function KidsStoriesPage() {
  const { activeLearner } = await requireSession("/kids/stories");
  const supabase = await createSupabaseServerClient();
  const [{ data: stories }, { data: views }] = await Promise.all([
    supabase.from("kids_stories").select("id, title, prophet, youtube_id").eq("published", true).order("sort_order").order("created_at"),
    supabase.from("story_views").select("story_id").eq("learner_id", activeLearner.id),
  ]);
  const list = stories ?? [];
  const watched = new Set((views ?? []).map((view) => view.story_id));
  const watchedCount = list.filter((story) => watched.has(story.id)).length;

  return (
    <div className="space-y-6">
      <div className={`${kidsPanel} text-center`}>
        <Clapperboard className="mx-auto size-12 text-[#7a5af5]" aria-hidden />
        <h1 className="mt-2 text-3xl font-extrabold text-emerald-deep sm:text-4xl">قصص الأنبياء</h1>
        <p className="mt-2 text-lg text-muted">
          {list.length > 0
            ? `شاهدت ${toArabicDigits(watchedCount)} من ${toArabicDigits(list.length)} قصة — اختر قصتك!`
            : "القصص في الطريق إليك قريبًا بإذن الله."}
        </p>
      </div>

      <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((story) => {
          const seen = watched.has(story.id);
          return (
            <li key={story.id}>
              <Link
                href={`/kids/stories/${story.id}` as Route}
                className="group block overflow-hidden rounded-[2rem] bg-white/95 shadow-lift ring-4 ring-white/60 transition-transform hover:-translate-y-1"
              >
                <div className="relative aspect-video bg-emerald-mist">
                  <img src={youtubeThumbnail(story.youtube_id)} alt="" loading="lazy" className="size-full object-cover" />
                  {seen && (
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
          );
        })}
      </ul>
    </div>
  );
}
