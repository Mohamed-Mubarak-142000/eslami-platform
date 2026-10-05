import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { confirmEmail, emailSchema } from "@/features/auth/service";
import { NOT_CONFIGURED, authErrorMessage } from "@/features/auth/errors";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, isSupabaseConfigured } from "@/lib/supabase/env";
import { fail, ok, readBody } from "@/lib/api/http";

const schema = z.object({ email: emailSchema, password: z.string().min(1, "أدخل كلمة المرور") });

/**
 * POST /api/v1/auth/confirm — the mobile half of loginAction's legacy path: an account left
 * unconfirmed by the old signup-code flow is confirmed once its password is proven, then the app
 * signs in again on the device. Supabase checks the password before the confirmation, so
 * `email_not_confirmed` only comes back for the right password.
 */
export async function POST(request: Request) {
  if (!isSupabaseConfigured) return fail(NOT_CONFIGURED, 503);
  const body = await readBody(request, schema);
  if (body.response) return body.response;

  // A throwaway client: nothing is stored, the session (if any) is discarded.
  const probe = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await probe.auth.signInWithPassword(body.data);
  if (!error) return ok({ confirmed: true });
  if (error.code !== "email_not_confirmed") return fail(authErrorMessage(error), 401);
  return (await confirmEmail(body.data.email)) ? ok({ confirmed: true }) : fail(authErrorMessage(null), 500);
}
