import { z } from "zod";
import { getBearerSession } from "@/features/auth/bearer";
import { submitNawawiExam } from "@/features/nawawi/service";
import { UNAUTHORIZED, fail, ok, readBody } from "@/lib/api/http";

const schema = z.object({ attemptId: z.string().uuid(), answers: z.array(z.number().int()).max(200) });

/** POST /api/v1/nawawi/submit { attemptId, answers } — graded on the server; passing the final issues the certificate. */
export async function POST(request: Request) {
  const session = await getBearerSession(request);
  if (!session) return UNAUTHORIZED();
  const body = await readBody(request, schema);
  if (body.response) return body.response;
  const result = await submitNawawiExam(session, body.data.attemptId, body.data.answers);
  return result.error ? fail(result.error, 409) : ok(result);
}
