import { z } from "zod";
import { getBearerSession } from "@/features/auth/bearer";
import { startNawawiExam } from "@/features/nawawi/service";
import { UNAUTHORIZED, fail, ok, readBody } from "@/lib/api/http";

const schema = z.object({ part: z.number().int().min(1).max(5) });

/**
 * POST /api/v1/nawawi/start { part } — a Forty Nawawi exam: parts 1–4, or 5 for the final once every
 * part is passed. Returns the attempt id; the app reads its questions (never the answer key) through
 * Supabase with the learner's own session.
 */
export async function POST(request: Request) {
  const session = await getBearerSession(request);
  if (!session) return UNAUTHORIZED();
  const body = await readBody(request, schema);
  if (body.response) return body.response;
  const outcome = await startNawawiExam(session, body.data.part);
  return "error" in outcome ? fail(outcome.error, 409) : ok(outcome);
}
