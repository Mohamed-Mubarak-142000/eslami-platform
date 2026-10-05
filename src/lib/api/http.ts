import "server-only";
import { NextResponse } from "next/server";
import type { z } from "zod";

/** JSON helpers shared by the /api/v1 routes the mobile app calls. Errors carry an Arabic `error` message. */

export function ok<T extends object>(body: T, status = 200) {
  return NextResponse.json(body, { status, headers: { "cache-control": "no-store" } });
}

export function fail(error: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error, ...extra }, { status, headers: { "cache-control": "no-store" } });
}

export const UNAUTHORIZED = () => fail("سجّل الدخول أولًا.", 401);

/** Parses a JSON body against a schema; on failure returns the first field message, like the website's forms. */
export async function readBody<S extends z.ZodType>(
  request: Request,
  schema: S,
): Promise<{ data: z.infer<S>; response?: never } | { data?: never; response: NextResponse }> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return { response: fail("طلب غير صالح.") };
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0] ?? "form")] ??= issue.message;
    return { response: fail(Object.values(fieldErrors)[0] ?? "بيانات غير صحيحة.", 400, { fieldErrors }) };
  }
  return { data: parsed.data };
}
