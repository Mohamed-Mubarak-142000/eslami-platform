import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { SUPABASE_URL } from "./env";

/**
 * Service-role client: bypasses RLS. Only for trusted server work that users must not do
 * themselves (grading exams, issuing certificates, admin user management). Never import in
 * client components.
 */
export function createSupabaseAdminClient() {
  const secret = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !secret) throw new Error("SUPABASE_SECRET_KEY is not configured");
  return createClient<Database>(SUPABASE_URL, secret, { auth: { persistSession: false, autoRefreshToken: false } });
}
