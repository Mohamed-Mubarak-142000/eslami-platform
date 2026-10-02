import { z } from "zod";
import { getBearerSession } from "@/features/auth/bearer";
import { startExam } from "@/features/exams/service";
import { UNAUTHORIZED, fail, ok, readBody } from "@/lib/api/http";

const schema = z.object({ juz: z.number().int().min(1).max(30) });

/**
 * POST /api/v1/exams/start { juz } — the same checks as the website (memorized + recited juz, cooldown,
 * daily limit). Returns the attempt id; the app reads its questions (never the answer key) through
 * Supabase with the learner's own session.
 */
export async function POST(request: Request) {
  const session = await getBearerSession(request);
  if (!session) return UNAUTHORIZED();
  const body = await readBody(request, schema);
  if (body.response) return body.response;
  const outcome = await startExam(session, body.data.juz);
  return "error" in outcome ? fail(outcome.error, 409) : ok(outcome);
}
