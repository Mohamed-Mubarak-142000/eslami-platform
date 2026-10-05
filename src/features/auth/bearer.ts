import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Session } from "./session";

/** The mobile app picks the learner per request (the website keeps it in a cookie). */
export const LEARNER_HEADER = "x-learner-id";

/**
 * The /api/v1 counterpart of getSession(): the mobile app sends its Supabase access token as
 * `Authorization: Bearer <jwt>`. The token is verified with the auth server, then the same
 * profile/learners/active-learner shape the website uses is loaded.
 */
export async function getBearerSession(request: Request): Promise<Session | null> {
  if (!isSupabaseConfigured) return null;
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : "";
  if (!token) return null;

  const admin = createSupabaseAdminClient();
  const { data: userData, error } = await admin.auth.getUser(token);
  const user = userData.user;
  if (error || !user) return null;

  const [{ data: profile }, { data: learners }] = await Promise.all([
    admin.from("profiles").select("*").eq("id", user.id).single(),
    admin.from("learners").select("*").eq("owner_id", user.id).order("created_at"),
  ]);
  if (!profile || profile.disabled || !learners || learners.length === 0) return null;

  const chosen = request.headers.get(LEARNER_HEADER);
  const activeLearner =
    learners.find((learner) => learner.id === chosen) ?? learners.find((learner) => learner.kind === "self") ?? learners[0]!;
  return { userId: user.id, email: user.email ?? profile.email ?? "", profile, learners, activeLearner };
}
