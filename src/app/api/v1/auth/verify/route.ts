import { z } from "zod";
import { emailSchema, otpTypeSchema, verifyCode } from "@/features/auth/service";
import { fail, ok, readBody } from "@/lib/api/http";

const schema = z.object({
  email: emailSchema,
  type: otpTypeSchema,
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "الكود ٦ أرقام"),
});

/**
 * POST /api/v1/auth/verify — checks the code and returns `tokenHash`; the app exchanges it on the
 * device with supabase.auth.verifyOtp({ type: "email", token_hash }). After a "recovery" code the app
 * then sets the new password itself with supabase.auth.updateUser().
 */
export async function POST(request: Request) {
  const body = await readBody(request, schema);
  if (body.response) return body.response;
  const result = await verifyCode(body.data.email, body.data.type, body.data.code);
  return result.ok ? ok({ tokenHash: result.tokenHash }) : fail(result.error);
}
