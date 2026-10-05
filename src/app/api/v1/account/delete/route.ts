import { z } from "zod";
import { getBearerSession } from "@/features/auth/bearer";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { UNAUTHORIZED, fail, ok, readBody } from "@/lib/api/http";

const DELETE_CONFIRMATION = "حذف";
const schema = z.object({ confirm: z.string() });

/**
 * POST /api/v1/account/delete { confirm: "حذف" } — the mobile app's deleteAccountAction (the stores
 * require in-app account deletion). Deleting the auth user cascades to the profile, learners and every
 * progress row; the app then signs out locally.
 */
export async function POST(request: Request) {
  const session = await getBearerSession(request);
  if (!session) return UNAUTHORIZED();
  const body = await readBody(request, schema);
  if (body.response) return body.response;
  if (body.data.confirm.trim() !== DELETE_CONFIRMATION) return fail(`اكتب "${DELETE_CONFIRMATION}" للتأكيد`);
  const { error } = await createSupabaseAdminClient().auth.admin.deleteUser(session.userId);
  return error ? fail("تعذّر حفظ التغييرات، حاول مرة أخرى.", 500) : ok({ deleted: true });
}
