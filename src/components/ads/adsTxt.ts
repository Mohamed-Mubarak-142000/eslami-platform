import { ADSENSE_CLIENT } from "./config";

/** ads.txt / app-ads.txt: Google's seller line for our publisher ID, or 404 while ads are off. */
export function adsTxtResponse(): Response {
  if (!ADSENSE_CLIENT) return new Response("Not found", { status: 404 });
  const publisher = ADSENSE_CLIENT.replace(/^ca-/, "");
  return new Response(`google.com, ${publisher}, DIRECT, f08c47fec0942fa0\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
