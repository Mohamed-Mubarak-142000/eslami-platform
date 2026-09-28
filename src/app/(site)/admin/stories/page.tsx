import type { Metadata } from "next";
import { cn } from "@/lib/cn";
import { toArabicDigits } from "@/lib/arabic";
import { requireAdmin } from "@/features/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AddStoryForm, StoryRowControls } from "@/features/admin/StoryControls";
import { youtubeThumbnail } from "@/features/kids/stories/youtube";

export const metadata: Metadata = { title: "قصص الأطفال" };

export default async function AdminStoriesPage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const [{ data: stories }, { data: views }] = await Promise.all([
    supabase.from("kids_stories").select("*").order("sort_order").order("created_at"),
    supabase.from("story_views").select("story_id").limit(50000),
  ]);
  const list = stories ?? [];
  const viewCount = new Map<string, number>();
  for (const view of views ?? []) viewCount.set(view.story_id, (viewCount.get(view.story_id) ?? 0) + 1);
  const nextOrder = list.reduce((max, story) => Math.max(max, story.sort_order), 0) + 10;

  return (
    <div className="space-y-6">
      <section className="rounded-4xl border border-line bg-white p-6 shadow-soft">
        <h2 className="mb-1 text-xl font-bold text-emerald-deep">إضافة قصة</h2>
        <p className="mb-5 text-sm text-muted">
          الصق رابط الفيديو من يوتيوب. شاهد الفيديو كاملًا قبل إظهاره، وتأكد أنه لا يصوّر الأنبياء ومناسب للأطفال.
        </p>
        <AddStoryForm nextOrder={nextOrder} />
      </section>

      <div className="overflow-x-auto rounded-3xl border border-line bg-white shadow-soft">
        <table className="w-full min-w-3xl text-sm">
          <thead className="bg-ivory text-xs text-muted">
            <tr>
              <th className="px-4 py-3 text-start font-bold">القصة</th>
              <th className="px-4 py-3 text-start font-bold">الترتيب</th>
              <th className="px-4 py-3 text-start font-bold">الحالة</th>
              <th className="px-4 py-3 text-start font-bold">شاهدها</th>
              <th className="px-4 py-3 text-start font-bold">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {list.map((story) => (
              <tr key={story.id} className={cn(!story.published && "bg-ivory/60")}>
                <td className="px-4 py-3">
                  <a
                    href={`https://www.youtube.com/watch?v=${story.youtube_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 hover:underline"
                  >
                    <img
                      src={youtubeThumbnail(story.youtube_id)}
                      alt=""
                      className="h-12 w-20 shrink-0 rounded-lg object-cover"
                      loading="lazy"
                    />
                    <span>
                      <span className="block font-bold">{story.title}</span>
                      {story.prophet && <span className="block text-xs text-muted">{story.prophet}</span>}
                    </span>
                  </a>
                </td>
                <td className="px-4 py-3">{toArabicDigits(story.sort_order)}</td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-bold",
                      story.published ? "bg-emerald-mist text-emerald" : "bg-line text-muted",
                    )}
                  >
                    {story.published ? "ظاهرة" : "مخفية"}
                  </span>
                </td>
                <td className="px-4 py-3">{toArabicDigits(viewCount.get(story.id) ?? 0)} طفل</td>
                <td className="px-4 py-3">
                  <StoryRowControls storyId={story.id} published={story.published} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <p className="p-6 text-center text-muted">لا توجد قصص بعد.</p>}
      </div>
    </div>
  );
}
