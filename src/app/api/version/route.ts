import { BUILD_ID } from "@/features/update/buildId";

/** The build this server runs; pages compare it with their own to offer a reload after a deploy. */
export function GET() {
  return Response.json({ build: BUILD_ID }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
