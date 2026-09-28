import type { Metadata } from "next";
import { Activity, Award, ClipboardCheck, GraduationCap, UserPlus, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toArabicDigits } from "@/lib/arabic";
import { requireAdmin } from "@/features/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getExamSettings } from "@/features/exams/data";
import { ExamSettingsForm } from "@/features/admin/AdminControls";

export const metadata: Metadata = { title: "نظرة عامة" };

function Stat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: number }) {
  return (
    <div className="flex items-center gap-4 rounded-3xl border border-line bg-white p-5 shadow-soft">
      <span className="grid size-12 place-items-center rounded-2xl bg-gold-mist text-gold-deep">
        <Icon className="size-6" aria-hidden />
      </span>
      <div>
        <p className="font-display text-2xl font-bold text-emerald-deep">{toArabicDigits(value)}</p>
        <p className="text-sm text-muted">{label}</p>
      </div>
    </div>
  );
}

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 3600_000);
}

export default async function AdminOverviewPage() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const weekAgo = daysAgo(7);
  const [users, newUsers, active, attempts, passed, certificates, settings] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", weekAgo.toISOString()),
    supabase.from("activity_days").select("learner_id").gte("day", weekAgo.toISOString().slice(0, 10)).limit(20000),
    supabase.from("exam_attempts").select("id", { count: "exact", head: true }).neq("status", "in_progress"),
    supabase.from("exam_attempts").select("id", { count: "exact", head: true }).eq("status", "passed"),
    supabase.from("certificates").select("id", { count: "exact", head: true }).is("revoked_at", null),
    getExamSettings(),
  ]);

  return (
    <div className="space-y-8">
      <section aria-label="إحصائيات" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat icon={Users} label="حساب مسجّل" value={users.count ?? 0} />
        <Stat icon={UserPlus} label="حساب جديد هذا الأسبوع" value={newUsers.count ?? 0} />
        <Stat icon={Activity} label="متعلّم نشط هذا الأسبوع" value={new Set((active.data ?? []).map((row) => row.learner_id)).size} />
        <Stat icon={ClipboardCheck} label="اختبار مُسلَّم" value={attempts.count ?? 0} />
        <Stat icon={GraduationCap} label="اختبار ناجح" value={passed.count ?? 0} />
        <Stat icon={Award} label="شهادة سارية" value={certificates.count ?? 0} />
      </section>
      <section className="rounded-4xl border border-line bg-white p-6 shadow-soft">
        <h2 className="mb-1 text-xl font-bold text-emerald-deep">إعدادات اختبارات الأجزاء</h2>
        <p className="mb-5 text-sm text-muted">تسري على الاختبارات التي تبدأ بعد الحفظ.</p>
        <ExamSettingsForm settings={settings} />
      </section>
    </div>
  );
}
