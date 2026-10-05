import { z } from "zod";
import { emailSchema, passwordSchema, registerAccount } from "@/features/auth/service";
import { fail, ok, readBody } from "@/lib/api/http";

const schema = z.object({
  fullName: z.string().trim().min(2, "اكتب اسمك (حرفان على الأقل)").max(60),
  email: emailSchema,
  password: passwordSchema,
});

/**
 * POST /api/v1/auth/register — creates the account already confirmed; the app then signs in on the
 * device with supabase.auth.signInWithPassword(). No code is emailed.
 */
export async function POST(request: Request) {
  const body = await readBody(request, schema);
  if (body.response) return body.response;
  const result = await registerAccount(body.data);
  return result.ok ? ok({ ok: true }) : fail(result.error);
}
