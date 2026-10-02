import { z } from "zod";
import { emailSchema, otpTypeSchema, requestCode } from "@/features/auth/service";
import { fail, ok, readBody } from "@/lib/api/http";

const schema = z.object({ email: emailSchema, type: otpTypeSchema });

/**
 * POST /api/v1/auth/code — sends a 6-digit code: "signup" (resend), "recovery" (forgot password) or
 * "email" (sign in by code). Answers the same for unknown emails.
 */
export async function POST(request: Request) {
  const body = await readBody(request, schema);
  if (body.response) return body.response;
  const result = await requestCode(body.data.email, body.data.type);
  return result.ok ? ok({ ok: true, message: "إن كان البريد مسجّلًا فقد أرسلنا إليه كودًا." }) : fail(result.error, 429);
}
