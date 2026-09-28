import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { LearnerRow, ProfileRow } from "@/lib/supabase/database.types";

export const ACTIVE_LEARNER_COOKIE = "al-manara-learner";

export interface Session {
  userId: string;
  email: string;
  profile: ProfileRow;
  learners: LearnerRow[];
  activeLearner: LearnerRow;
}

/** The signed-in user (verified with the auth server), their profile and learners — once per request. */
export const getSession = cache(async (): Promise<Session | null> => {
  if (!isSupabaseConfigured) return null;
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return null;

  const [{ data: profile }, { data: learners }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("learners").select("*").eq("owner_id", user.id).order("created_at"),
  ]);
  if (!profile || !learners || learners.length === 0) return null;

  const chosen = (await cookies()).get(ACTIVE_LEARNER_COOKIE)?.value;
  const activeLearner =
    learners.find((learner) => learner.id === chosen) ?? learners.find((learner) => learner.kind === "self") ?? learners[0]!;
  return { userId: user.id, email: user.email ?? profile.email ?? "", profile, learners, activeLearner };
});

export async function requireSession(next = "/dashboard"): Promise<Session> {
  const session = await getSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (session.profile.disabled) redirect("/account/disabled");
  return session;
}

export async function requireAdmin(): Promise<Session> {
  const session = await requireSession("/admin");
  if (session.profile.role !== "admin") notFound();
  return session;
}
