import { NextResponse, type NextRequest } from "next/server";
import { unsubscribeAction } from "@/features/announcements/actions";

/**
 * RFC 8058 one-click unsubscribe: Gmail's own "Unsubscribe" link POSTs here directly, without
 * opening the page. Only POST changes anything, so link scanners that GET the URL can't.
 */
export async function POST(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const result = await unsubscribeAction(params.get("u") ?? "", params.get("t") ?? "");
  return NextResponse.json(result, { status: result.error ? 400 : 200 });
}
